import { existsSync, readFileSync } from "node:fs"
import type { TuiPluginApi } from "@opencode-ai/plugin/tui"
import type { Message, Part, Provider, TextPart } from "@opencode-ai/sdk/v2"
import { createEffect, createRoot, createSignal, onCleanup } from "solid-js"

import type { PanelItem, PanelModel, PanelStatus, PanelTextSegment } from "../presentation/types.js"
import type { HomeQuotaSummary, ProviderFreshness, QuotaProviderAdapter, QuotaProviderOptions } from "./types.js"

const DEFAULT_REFRESH_INTERVAL_MS = 10_000
const EXHAUSTED_POLL_MS = 300_000
const TICK_MS = 1_000
const FETCH_TIMEOUT_MS = 20_000
const STALE_MAX_MS = 10 * 60 * 1_000
const CREDENTIAL_FILE_PATHS = [
  `${process.env.XDG_DATA_HOME || `${process.env.HOME || ""}/.local/share`}/opencode/auth.json`,
  `${process.env.XDG_CONFIG_HOME || `${process.env.HOME || ""}/.config`}/opencode/auth.json`,
  `${process.env.XDG_CONFIG_HOME || `${process.env.HOME || ""}/.config`}/opencode/account.json`,
  `${process.env.XDG_DATA_HOME || `${process.env.HOME || ""}/.local/share`}/opencode/account.json`,
]
const ZAI_QUOTA_URL = "https://api.z.ai/api/monitor/usage/quota/limit"
const ZAI_PROVIDER_ID = "zai-coding-plan"
const PROVIDER_ORDER = 110
const KV_BASELINE_KEY = "quota_zai_baseline_sgt"
const KV_CYCLE_MS_KEY = "quota_zai_cycle_ms"
const FALLBACK_BASELINE_SGT = "2026-05-28 00:45:44"
const FALLBACK_CYCLE_MS = 5 * 60 * 60 * 1_000
const RESET_PARSE_RE = /Your limit will reset at (\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/
const RETRY_AFTER_RE = /reset after (\d+h)?(\d+m)?(\d+s)?/i
const SGT_OFFSET_MS = 8 * 60 * 60 * 1_000
const TIME_UNIT = { SESSION_5H: 3, WEEKLY_7D: 6 } as const

function providerRefreshInterval(options: QuotaProviderOptions): number {
  return typeof options.refreshIntervalMs === "number"
    && Number.isFinite(options.refreshIntervalMs)
    && options.refreshIntervalMs > 0
    ? options.refreshIntervalMs
    : DEFAULT_REFRESH_INTERVAL_MS
}

type TokenLimit = {
  type: "TOKENS_LIMIT"
  unit: number
  percentage: number
  nextResetTime: number
  usage?: number
  currentValue?: number
}

type UsageDetail = {
  modelCode: string
  usage: number
}

type TimeLimit = {
  type: "TIME_LIMIT"
  unit: number
  usage: number
  currentValue: number
  percentage: number
  nextResetTime: number
  usageDetails: UsageDetail[]
}

type QuotaApiResponse = {
  code: number
  msg?: string
  data?: {
    limits?: (TokenLimit | TimeLimit)[]
    level?: string
  }
}

type AbsoluteQuota = {
  usedPct: number
  remainingPct: number
  nextResetEpoch: number
  used: number
  total: number
}

export type ZaiQuotaData = {
  level: string
  tokenUsedPct: number
  tokenRemainingPct: number
  tokenNextResetEpoch: number
  tokenAbsolute: AbsoluteQuota | null
  weeklyLimit: {
    usedPct: number
    remainingPct: number
    nextResetEpoch: number
    absolute: AbsoluteQuota | null
  } | null
  timeLimit: {
    usedPct: number
    remainingPct: number
    nextResetEpoch: number
    total: number
    used: number
    usageDetails: UsageDetail[]
  } | null
}

export type ZaiPanelPhase = "loading" | "unavailable" | "ready" | "stale" | "heuristic" | "rate-limited"

export type ZaiPanelState = {
  phase: ZaiPanelPhase
  now: number
  data?: ZaiQuotaData | null
  retryAfterEpoch?: number | null
  baselineSgt?: string
  cycleMs?: number
  hideTools?: boolean
}

type AccountEntry = {
  serviceID: string
  credential?: { key: string }
}

type AccountFile = {
  version: number
  active?: Record<string, string>
  accounts?: Record<string, AccountEntry>
}

function clampPct(value: number): number {
  return Math.min(100, Math.max(0, value))
}

function safeNumber(value: unknown, fallback: number): number {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function parseSgt(date: string): number | null {
  const [ymd, hms] = date.split(" ")
  if (!ymd || !hms) return null
  const [year, month, day] = ymd.split("-").map(Number)
  const [hour, minute, second] = hms.split(":").map(Number)
  if ([year, month, day, hour, minute, second].some((value) => !Number.isFinite(value))) return null
  return Date.UTC(year, month - 1, day, hour, minute, second) - SGT_OFFSET_MS
}

function nextResetEpoch(baselineEpoch: number, cycleMs: number, now: number): number {
  const elapsed = now - baselineEpoch
  if (elapsed < 0) return baselineEpoch
  return baselineEpoch + (Math.floor(elapsed / cycleMs) + 1) * cycleMs
}

function isPeakHour(epoch: number): boolean {
  const sgt = new Date(epoch + SGT_OFFSET_MS)
  const hour = sgt.getUTCHours()
  return hour >= 14 && hour < 18
}

function timerState(remainingPct: number, epoch: number, now: number): "unavailable" | "idle" | "countdown" | "expired" {
  if (remainingPct >= 100) return "idle"
  if (epoch <= 0) return "unavailable"
  return epoch > now ? "countdown" : "expired"
}

function keyFromAuthFile(data: unknown): string | null {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null
  const entry = (data as Record<string, { type?: string; key?: string }>)[ZAI_PROVIDER_ID]
  if (!entry || (entry.type && entry.type !== "api")) return null
  return typeof entry.key === "string" && entry.key ? entry.key : null
}

function keyFromAccountFile(data: unknown): string | null {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null
  const file = data as AccountFile
  if (file.version !== 2 || !file.accounts) return null
  const activeID = file.active?.[ZAI_PROVIDER_ID]
  if (activeID && file.accounts[activeID]?.credential?.key) return file.accounts[activeID].credential.key
  return Object.values(file.accounts).find((entry) => entry.serviceID === ZAI_PROVIDER_ID)?.credential?.key ?? null
}

function keyFromAccountArray(data: unknown): string | null {
  if (!Array.isArray(data)) return null
  return data.find((entry): entry is AccountEntry => typeof entry === "object" && entry !== null && (entry as AccountEntry).serviceID === ZAI_PROVIDER_ID)?.credential?.key ?? null
}

export function findZaiKeyFromFiles(): string | null {
  for (const path of CREDENTIAL_FILE_PATHS) {
    try {
      if (!existsSync(path)) continue
      const data = JSON.parse(readFileSync(path, "utf8"))
      const key = keyFromAuthFile(data) ?? keyFromAccountFile(data) ?? keyFromAccountArray(data)
      if (key) return key
    } catch (error) {
      console.error("[quota-zai] Failed to read credential file:", error)
    }
  }
  return null
}

export function findZaiKeyFromProviders(providers: readonly Provider[]): string | null {
  return providers.find((provider) => provider.id === ZAI_PROVIDER_ID)?.key ?? null
}

export async function fetchZaiQuota(apiKey: string, signal?: AbortSignal): Promise<ZaiQuotaData | null> {
  const ownedController = signal ? null : new AbortController()
  const requestSignal = signal ?? ownedController!.signal
  const timeout = ownedController
    ? setTimeout(() => ownedController.abort(), FETCH_TIMEOUT_MS)
    : null
  try {
    const response = await fetch(ZAI_QUOTA_URL, {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
      signal: requestSignal,
    })
    if (!response.ok) return null
    const payload = await response.json() as QuotaApiResponse
    if (payload.code !== 200 || !payload.data?.limits) return null

    const rawLevel = String(payload.data.level || "Unknown")
    const tokenLimits = payload.data.limits.filter((limit): limit is TokenLimit => limit.type === "TOKENS_LIMIT")
    const token = tokenLimits.find((limit) => limit.unit === TIME_UNIT.SESSION_5H) ?? tokenLimits[0]
    const weekly = tokenLimits.find((limit) => limit.unit === TIME_UNIT.WEEKLY_7D && limit !== token)
    const time = payload.data.limits.find((limit): limit is TimeLimit => limit.type === "TIME_LIMIT")
    const absolute = (limit: TokenLimit, usedPct: number): AbsoluteQuota | null => {
      const total = safeNumber(limit.usage, 0)
      if (total <= 0) return null
      return {
        usedPct,
        remainingPct: clampPct(100 - usedPct),
        nextResetEpoch: safeNumber(limit.nextResetTime, 0),
        used: safeNumber(limit.currentValue, Math.round(total * usedPct / 100)),
        total,
      }
    }
    const tokenUsedPct = token ? clampPct(safeNumber(token.percentage, 0)) : 0

    return {
      level: rawLevel.charAt(0).toUpperCase() + rawLevel.slice(1).toLowerCase(),
      tokenUsedPct,
      tokenRemainingPct: clampPct(100 - tokenUsedPct),
      tokenNextResetEpoch: token ? safeNumber(token.nextResetTime, 0) : 0,
      tokenAbsolute: token ? absolute(token, tokenUsedPct) : null,
      weeklyLimit: weekly
        ? {
            usedPct: clampPct(safeNumber(weekly.percentage, 0)),
            remainingPct: clampPct(100 - safeNumber(weekly.percentage, 0)),
            nextResetEpoch: safeNumber(weekly.nextResetTime, 0),
            absolute: absolute(weekly, clampPct(safeNumber(weekly.percentage, 0))),
          }
        : null,
      timeLimit: time
        ? {
            usedPct: clampPct(safeNumber(time.percentage, 0)),
            remainingPct: clampPct(100 - safeNumber(time.percentage, 0)),
            nextResetEpoch: safeNumber(time.nextResetTime, 0),
            total: safeNumber(time.usage, 0),
            used: safeNumber(time.currentValue, 0),
            usageDetails: Array.isArray(time.usageDetails) ? time.usageDetails : [],
          }
        : null,
    }
  } catch (error) {
    if (!requestSignal.aborted) console.error("[quota-zai] fetchQuota error:", error)
    return null
  } finally {
    if (timeout) clearTimeout(timeout)
  }
}

export function zaiHomeQuotaSummary(data: ZaiQuotaData): HomeQuotaSummary {
  return {
    provider: "Z.AI",
    plan: data.level,
    primaryPct: data.tokenRemainingPct,
    secondaryPct: data.weeklyLimit?.remainingPct,
  }
}

function header(
  title: string,
  detail?: string,
  status?: PanelStatus,
  detailSegments?: readonly PanelTextSegment[],
): PanelItem {
  return {
    id: "zai:header",
    order: 10,
    kind: "header",
    title,
    ...(detail ? { detail } : {}),
    ...(status ? { status } : {}),
    ...(detailSegments?.length ? { detailSegments } : {}),
  }
}

function quotaItems(label: "5H" | "7D", id: "5h" | "7d", order: number, remainingPct: number, epoch: number, now: number, absolute: AbsoluteQuota | null): PanelItem[] {
  const items: PanelItem[] = [
    { id: `zai:${id}`, order, kind: "progress", label, value: remainingPct, total: 100 },
    { id: `zai:${id}-reset`, order: order + 10, kind: "timer", label: `${label} reset`, state: timerState(remainingPct, epoch, now), ...(epoch > 0 ? { epoch } : {}) },
  ]
  if (absolute) {
    items.push(
      { id: `zai:${id}-used`, order: order + 11, kind: "quantity", label: `${label} used`, value: absolute.used, unit: "count" },
      { id: `zai:${id}-total`, order: order + 12, kind: "quantity", label: `${label} total`, value: absolute.total, unit: "count" },
    )
  }
  return items
}

export function mapZaiPanelState(state: ZaiPanelState): PanelModel {
  const { now, data } = state
  const items: PanelItem[] = []
  const peak = isPeakHour(now)
  const peakSummary = {
    text: peak ? "Peak (3x)" : "Off-Peak (1x)",
    status: peak ? "error" as const : "success" as const,
  }

  if (state.phase === "loading") items.push(header("Z.AI", "Loading Z.AI...", "textMuted"))
  else if (state.phase === "unavailable") items.push(header("Z.AI", "No Z.AI account linked", "textMuted"))
  else if (state.phase === "rate-limited") {
    const epoch = state.retryAfterEpoch ?? 0
    items.push(header("Z.AI", "Rate limited", "error"))
    items.push(...quotaItems("5H", "5h", 20, 0, epoch, now, null))
  } else if (state.phase === "heuristic") {
    const baseline = parseSgt(state.baselineSgt ?? FALLBACK_BASELINE_SGT)
    const epoch = baseline === null ? now + (state.cycleMs ?? FALLBACK_CYCLE_MS) : nextResetEpoch(baseline, state.cycleMs ?? FALLBACK_CYCLE_MS, now)
    items.push(header("Z.AI (est)", "Usage unavailable", "textMuted"))
    items.push({ id: "zai:5h-reset", order: 20, kind: "timer", label: "Estimated reset", state: "countdown", epoch })
  } else if (data) {
    const staleSegments: readonly PanelTextSegment[] | undefined = state.phase === "stale"
      ? [
          { text: peakSummary.text, status: peakSummary.status },
          { text: " / ", status: "textMuted" },
          { text: "stale", status: "warning" },
        ]
      : undefined
    items.push(staleSegments
      ? header(`Z.AI: ${data.level}`, undefined, undefined, staleSegments)
      : header(`Z.AI: ${data.level}`, peakSummary.text, peakSummary.status))
    items.push(...quotaItems("5H", "5h", 20, data.tokenRemainingPct, data.tokenNextResetEpoch, now, data.tokenAbsolute))
    const weekly = data.weeklyLimit
    items.push(...quotaItems("7D", "7d", 50, weekly?.remainingPct ?? 100, weekly?.nextResetEpoch ?? 0, now, weekly?.absolute ?? null))
    if (!weekly) items.push({ id: "zai:7d-legacy", order: 65, kind: "text", text: "Unlimited (Legacy)", status: "textMuted" })
    if (data.timeLimit && !state.hideTools) {
      const time = data.timeLimit
      items.push(
        { id: "zai:time", order: 80, kind: "progress", label: "T", value: time.remainingPct, total: 100 },
        { id: "zai:time-reset", order: 90, kind: "timer", label: "Tool reset", state: timerState(time.remainingPct, time.nextResetEpoch, now), ...(time.nextResetEpoch > 0 ? { epoch: time.nextResetEpoch } : {}) },
        { id: "zai:time-spacer", order: 91, kind: "text", text: "" },
        { id: "zai:time-used", order: 92, kind: "quantity", label: "Tool used", value: time.used, unit: "count" },
        { id: "zai:time-total", order: 93, kind: "quantity", label: "Tool total", value: time.total, unit: "count" },
      )
      const rows = time.usageDetails.filter((detail) => detail.usage > 0)
      if (rows.length) items.push({
        id: "zai:time-models",
        order: 95,
        kind: "table",
        columns: [
          { id: "model", order: 10, title: "Model" },
          { id: "usage", order: 20, title: "Usage", align: "end" },
        ],
        rows: rows.map((detail, index) => ({
          id: `zai:time-model:${detail.modelCode}`,
          order: index,
          cells: [{ kind: "text", text: detail.modelCode }, { kind: "quantity", value: detail.usage, unit: "count" }],
        })),
      })
    }
  } else {
    items.push(header("Z.AI", "Usage unavailable", "textMuted"))
  }

  return {
    id: "zai",
    order: PROVIDER_ORDER,
    title: "Z.AI",
    collapsedSummary: data
      ? { kind: "text", text: peakSummary.text, status: peakSummary.status }
      : undefined,
    groups: [{ id: "zai:quota", order: 10, items }],
  }
}

function scanMessageParts(messages: readonly Message[], partReader: (messageID: string) => readonly Part[], regex: RegExp): string | null {
  for (let messageIndex = messages.length - 1; messageIndex >= 0; messageIndex -= 1) {
    const message = messages[messageIndex]
    if (!message) continue
    const parts = partReader(message.id)
    for (let partIndex = parts.length - 1; partIndex >= 0; partIndex -= 1) {
      const part = parts[partIndex]
      if (part?.type === "text" && (part as TextPart).text.match(regex)) return (part as TextPart).text.match(regex)![0]
    }
  }
  return null
}

function unref(timer: ReturnType<typeof setTimeout> | ReturnType<typeof setInterval>): void {
  ;(timer as { unref?: () => void }).unref?.()
}

function freshnessFor(phase: ZaiPanelPhase): ProviderFreshness {
  if (phase === "heuristic" || phase === "rate-limited") return "unavailable"
  return phase
}

export function createZaiProvider(api: TuiPluginApi, options: QuotaProviderOptions = {}): QuotaProviderAdapter {
  const refreshIntervalMs = providerRefreshInterval(options)
  return createRoot((dispose) => {
  type PublishedQuota = { data: ZaiQuotaData; generation: number }
  type GenerationBoundary = { epoch: number; generation: number }

  const [apiKey, setApiKey] = createSignal<string | null>(null)
  const [quotaState, setQuotaState] = createSignal<PublishedQuota | null>(null)
  const quotaData = () => quotaState()?.data ?? null
  const [phase, setPhase] = createSignal<ZaiPanelPhase>("loading")
  const [lastSuccessAt, setLastSuccessAt] = createSignal(0)
  const [retryAfterEpoch, setRetryAfterEpoch] = createSignal<number | null>(null)
  const [baselineSgt, setBaselineSgt] = createSignal(FALLBACK_BASELINE_SGT)
  const [cycleMs, setCycleMs] = createSignal(FALLBACK_CYCLE_MS)
  const [sessionID, setSessionID] = createSignal<string | null>(null)
  const [now, setNow] = createSignal(Date.now())
  const [refreshedBoundary, setRefreshedBoundary] = createSignal<GenerationBoundary | null>(null)
  let refreshInFlight: Promise<void> | null = null
  let refreshStartedAt = 0
  let pendingBoundary: GenerationBoundary | null = null
  let credentialGeneration = 0
  let observedCredential: string | null | undefined
  let disposed = false
  let boundarySchedule: {
    timer: ReturnType<typeof setTimeout>
    generation: number
  } | null = null
  let activeRequest: {
    generation: number
    controller: AbortController
    timeout: ReturnType<typeof setTimeout>
    promise: Promise<void>
  } | null = null

  const clearBoundarySchedule = (): void => {
    const schedule = boundarySchedule
    boundarySchedule = null
    if (schedule) clearTimeout(schedule.timer)
    pendingBoundary = null
    setRefreshedBoundary(null)
  }

  const cancelActiveRequest = (): void => {
    const request = activeRequest
    if (!request) return
    activeRequest = null
    request.controller.abort()
    clearTimeout(request.timeout)
    if (refreshInFlight === request.promise) {
      refreshInFlight = null
      refreshStartedAt = 0
    }
  }

  const refresh = (): Promise<void> => {
    if (disposed) return Promise.resolve()
    if (refreshInFlight) return refreshInFlight
    const key = apiKey()
    if (!key) {
      setPhase("unavailable")
      return Promise.resolve()
    }

    const generation = credentialGeneration
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
    const startedAt = Date.now()
    const request = (async () => {
      const data = await fetchZaiQuota(key, controller.signal)
      if (disposed || generation !== credentialGeneration) return
      if (data) {
        setQuotaState({ data, generation })
        setPhase("ready")
        setLastSuccessAt(Date.now())
      } else if (quotaData()) {
        setPhase("stale")
      } else {
        setPhase(retryAfterEpoch() && retryAfterEpoch()! > Date.now() ? "rate-limited" : "heuristic")
      }
    })()
    refreshInFlight = request
    refreshStartedAt = startedAt
    activeRequest = { generation, controller, timeout, promise: request }
    const settled = () => {
      if (activeRequest?.promise === request) {
        clearTimeout(activeRequest.timeout)
        activeRequest = null
      }
      if (refreshInFlight !== request) return
      refreshInFlight = null
      refreshStartedAt = 0
      const queued = pendingBoundary
      if (disposed || generation !== credentialGeneration || queued?.generation !== generation) return
      pendingBoundary = null
      setRefreshedBoundary(queued)
      void refresh()
    }
    void request.then(settled, settled)
    return request
  }

  createEffect(() => {
    const next = findZaiKeyFromProviders(api.state.provider) ?? findZaiKeyFromFiles()
    if (next === observedCredential) return
    const replacingCredential = observedCredential !== undefined && observedCredential !== null
    observedCredential = next
    credentialGeneration += 1
    clearBoundarySchedule()
    cancelActiveRequest()
    setRetryAfterEpoch(null)
    setApiKey(next)

    if (!next) {
      setQuotaState(null)
      setLastSuccessAt(0)
      setPhase("unavailable")
      return
    }
    setPhase(replacingCredential && quotaData() ? "stale" : "loading")
    void refresh()
  })

  createEffect(() => {
    const key = apiKey()
    const published = quotaState()
    const exhausted = published?.generation === credentialGeneration
      && published.data.tokenRemainingPct === 0
    if (!key) return
    const timer = setInterval(() => void refresh(), exhausted ? EXHAUSTED_POLL_MS : refreshIntervalMs)
    unref(timer)
    onCleanup(() => clearInterval(timer))
  })

  createEffect(() => {
    try {
      const storedBaseline = api.kv.get<string>(KV_BASELINE_KEY)
      if (storedBaseline) setBaselineSgt(storedBaseline)
      const storedCycle = api.kv.get<number>(KV_CYCLE_MS_KEY)
      if (storedCycle) setCycleMs(Number(storedCycle) || FALLBACK_CYCLE_MS)
    } catch {
      // The host KV store can initialize after the adapter.
    }
  })

  createEffect(() => {
    const id = sessionID()
    if (!id) return
    let messages: readonly Message[] = []
    try {
      messages = api.state.session.messages(id)
    } catch {
      return
    }
    const readParts = (messageID: string): readonly Part[] => {
      try {
        return api.state.part(messageID)
      } catch {
        return []
      }
    }
    const resetMessage = scanMessageParts(messages, readParts, RESET_PARSE_RE)
    const reset = resetMessage?.match(RESET_PARSE_RE)?.[1]
    if (reset && reset !== baselineSgt()) {
      setBaselineSgt(reset)
      try {
        api.kv.set(KV_BASELINE_KEY, reset)
      } catch {
        // The reset fallback remains in memory if persistence is unavailable.
      }
    }
    const retryMessage = scanMessageParts(messages, readParts, RETRY_AFTER_RE)
    const match = retryMessage?.match(RETRY_AFTER_RE)
    const seconds = (match?.[1] ? Number.parseInt(match[1]) * 3_600 : 0) + (match?.[2] ? Number.parseInt(match[2]) * 60 : 0) + (match?.[3] ? Number.parseInt(match[3]) : 0)
    setRetryAfterEpoch(seconds > 0 ? Date.now() + seconds * 1_000 : null)
  })

  const tick = setInterval(() => {
    if (disposed) return
    const current = Date.now()
    setNow(current)
    if (lastSuccessAt() && current - lastSuccessAt() > STALE_MAX_MS && quotaData()) {
      setQuotaState(null)
      clearBoundarySchedule()
      setPhase("heuristic")
    }
  }, TICK_MS)
  unref(tick)
  onCleanup(() => clearInterval(tick))

  createEffect(() => {
    const published = quotaState()
    const generation = published?.generation ?? credentialGeneration
    if (published && generation !== credentialGeneration) return
    const epoch = published?.data.tokenNextResetEpoch ?? retryAfterEpoch() ?? 0
    const refreshed = refreshedBoundary()
    const pending = pendingBoundary
    if (
      epoch <= 0
      || (refreshed?.generation === generation && refreshed.epoch === epoch)
      || (pending?.generation === generation && pending.epoch === epoch)
    ) return

    const timer = setTimeout(() => {
      const current = quotaState()
      const sourceIsCurrent = published
        ? current?.generation === generation
        : current === null
      if (disposed || generation !== credentialGeneration || !sourceIsCurrent) return
      if (refreshInFlight && activeRequest?.generation === generation && refreshStartedAt < epoch) {
        pendingBoundary = { epoch, generation }
        return
      }
      setRefreshedBoundary({ epoch, generation })
      void refresh()
    }, Math.max(0, epoch - Date.now()))
    const schedule = { timer, generation }
    boundarySchedule = schedule
    unref(timer)
    onCleanup(() => {
      if (boundarySchedule !== schedule) return
      boundarySchedule = null
      clearTimeout(timer)
    })
  })

  return {
    id: "zai",
    order: PROVIDER_ORDER,
    panel: () => mapZaiPanelState({ phase: phase(), data: quotaData(), retryAfterEpoch: retryAfterEpoch(), baselineSgt: baselineSgt(), cycleMs: cycleMs(), hideTools: options.hideTools, now: now() }),
    home: () => phase() === "ready" && quotaData() ? zaiHomeQuotaSummary(quotaData()!) : null,
    quotaSummary: () => quotaData() ? zaiHomeQuotaSummary(quotaData()!) : null,
    configured: () => Boolean(apiKey()),
    freshness: () => freshnessFor(phase()),
    refresh,
    setSessionID(id: string): void {
      if (!disposed) setSessionID(id)
    },
    dispose(): void {
      if (disposed) return
      disposed = true
      credentialGeneration += 1
      clearBoundarySchedule()
      cancelActiveRequest()
      dispose()
    },
  }
  })
}
