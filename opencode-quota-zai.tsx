/** @jsxImportSource @opentui/solid */
import { createEffect, createMemo, createSignal, onCleanup, Show } from "solid-js"
import type { TuiPlugin, TuiPluginApi, TuiPluginModule } from "@opencode-ai/plugin/tui"
import type { Message, Part, Provider } from "@opencode-ai/sdk/v2"
import { TextAttributes } from "@opentui/core"
import {
  API_POLL_MS, EXHAUSTED_POLL_MS, TICK_MS, FETCH_TIMEOUT_MS, STALE_MAX_MS,
  CREDENTIAL_FILE_PATHS,
  safeNumber, clampPct, formatRemaining, formatCount,
  scanMessageParts, BarRow, HomeQuotaLine, type HomeQuotaSummary,
} from "./opencode-quota-shared"
import { readFileSync, existsSync } from "fs"

// --- API response shapes ----------------------------------------------------

interface TokenLimit {
  type: "TOKENS_LIMIT"
  unit: number
  number: number
  percentage: number
  nextResetTime: number
  usage?: number
  currentValue?: number
  remaining?: number
}

interface UsageDetail {
  modelCode: string
  usage: number
}

interface TimeLimit {
  type: "TIME_LIMIT"
  unit: number
  number: number
  usage: number
  currentValue: number
  remaining: number
  percentage: number
  nextResetTime: number
  usageDetails: UsageDetail[]
}

interface QuotaApiResponse {
  code: number
  msg?: string
  data: {
    limits: (TokenLimit | TimeLimit)[]
    level: string
  }
}

interface AbsoluteQuota {
  usedPct: number
  remainingPct: number
  nextResetEpoch: number
  used: number
  total: number
}

export interface ZaiQuotaData {
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

// --- ZAI-specific constants -------------------------------------------------

const TIME_UNIT = { SESSION_5H: 3, WEEKLY_7D: 6 } as const

const ZAI_QUOTA_URL = "https://api.z.ai/api/monitor/usage/quota/limit"
const ZAI_PROVIDER_ID = "zai-coding-plan"
const KV_BASELINE_KEY = "quota_zai_baseline_sgt"
const KV_CYCLE_MS_KEY = "quota_zai_cycle_ms"
const FALLBACK_BASELINE_SGT = "2026-05-28 00:45:44"
const FALLBACK_CYCLE_MS = 5 * 3600 * 1000
const RESET_PARSE_RE = /Your limit will reset at (\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/
const RETRY_AFTER_RE = /reset after (\d+h)?(\d+m)?(\d+s)?/i
const SGT_OFFSET_MS = 8 * 60 * 60 * 1000

// --- ZAI-specific helpers ---------------------------------------------------

function parseSgt(dateStr: string): number | null {
  if (!dateStr || typeof dateStr !== "string") return null
  const parts = dateStr.split(" ")
  if (parts.length !== 2) return null
  const [ymd, hms] = parts
  const dateParts = ymd.split("-").map(Number)
  const timeParts = hms.split(":").map(Number)
  if (dateParts.length !== 3 || timeParts.length !== 3) return null
  const [y, m, d] = dateParts
  const [hh, mm, ss] = timeParts
  if ([y, m, d, hh, mm, ss].some(v => !Number.isFinite(v))) return null
  return Date.UTC(y, m - 1, d, hh, mm, ss) - SGT_OFFSET_MS
}

function nextResetEpoch(baselineEpoch: number, cycleMs: number, now: number): number {
  const elapsed = now - baselineEpoch
  if (elapsed < 0) return baselineEpoch
  const cyclesPast = Math.floor(elapsed / cycleMs)
  return baselineEpoch + (cyclesPast + 1) * cycleMs
}

function isPeakHour(epochMs: number): boolean {
  const dateInSgt = new Date(epochMs + SGT_OFFSET_MS)
  const utcHour = dateInSgt.getUTCHours()
  return utcHour >= 14 && utcHour < 18
}

// --- API key discovery ------------------------------------------------------

interface AccountFile {
  version: number
  active?: Record<string, string>
  accounts?: Record<string, AccountEntry>
}

interface AccountEntry {
  serviceID: string
  credential?: { key: string }
}

interface AuthEntry {
  type?: string
  key?: string
}

export function findZaiKeyFromFiles(): string | null {
  for (const filePath of CREDENTIAL_FILE_PATHS) {
    try {
      if (!existsSync(filePath)) continue
      const raw = readFileSync(filePath, "utf-8")
      const data = JSON.parse(raw)
      const key = keyFromAuthFile(data) ?? keyFromAccountFile(data) ?? keyFromAccountArray(data)
      if (key) return key
    } catch (err) {
      console.error("[quota-zai] Failed to read credential file:", err)
    }
  }
  return null
}

function keyFromAuthFile(data: unknown): string | null {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null
  const entry = (data as Record<string, AuthEntry>)[ZAI_PROVIDER_ID]
  if (!entry || typeof entry !== "object") return null
  if (entry.type && entry.type !== "api") return null
  return typeof entry.key === "string" && entry.key ? entry.key : null
}

function keyFromAccountFile(data: unknown): string | null {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null
  const file = data as AccountFile
  if (file.version !== 2 || !file.accounts) return null
  const activeId = file.active?.[ZAI_PROVIDER_ID]
  if (activeId && file.accounts[activeId]?.credential?.key) {
    return file.accounts[activeId].credential.key
  }
  for (const entry of Object.values(file.accounts)) {
    if (entry?.serviceID === ZAI_PROVIDER_ID && entry.credential?.key) {
      return entry.credential.key
    }
  }
  return null
}

function keyFromAccountArray(data: unknown): string | null {
  if (!Array.isArray(data)) return null
  const found = data.find(
    (x): x is AccountEntry =>
      typeof x === "object" && x !== null && (x as AccountEntry).serviceID === ZAI_PROVIDER_ID,
  )
  return found?.credential?.key ?? null
}

export function findZaiKeyFromProviders(providers: readonly Provider[]): string | null {
  const zai = providers.find(p => p.id === ZAI_PROVIDER_ID)
  return zai?.key ?? null
}

// --- Quota fetch + normalization -------------------------------------------

export async function fetchZaiQuota(apiKey: string): Promise<ZaiQuotaData | null> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
    const res = await fetch(ZAI_QUOTA_URL, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Accept": "application/json",
      },
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    if (!res.ok) {
      console.error(`[quota-zai] API returned ${res.status}`)
      return null
    }
    const payload = await res.json() as QuotaApiResponse
    if (payload?.code !== 200) {
      console.error(`[quota-zai] API code ${payload?.code}: ${payload?.msg || "unknown"}`)
      return null
    }
    const data = payload.data
    if (!data || !Array.isArray(data.limits)) {
      console.error("[quota-zai] API response missing data.limits")
      return null
    }
    const rawLevel = String(data.level || "Unknown")
    const level = rawLevel.charAt(0).toUpperCase() + rawLevel.slice(1).toLowerCase()
    const tokensLimits = data.limits.filter((l): l is TokenLimit => l.type === "TOKENS_LIMIT")
    const tokenLimit = tokensLimits.find(l => l.unit === TIME_UNIT.SESSION_5H) || tokensLimits[0]
    const weeklyLimit = tokensLimits.find(l => l.unit === TIME_UNIT.WEEKLY_7D && l !== tokenLimit)
    const timeLimit = data.limits.find((l): l is TimeLimit => l.type === "TIME_LIMIT")

    function absoluteFromToken(l: TokenLimit, usedPct: number): AbsoluteQuota | null {
      const total = safeNumber(l.usage, 0)
      if (!l.usage || total <= 0) return null
      const used = safeNumber(l.currentValue, Math.round(total * usedPct / 100))
      return {
        usedPct,
        remainingPct: clampPct(100 - usedPct),
        nextResetEpoch: safeNumber(l.nextResetTime, 0),
        total,
        used,
      }
    }

    let tokenUsedPct = 0
    let tokenNextResetEpoch = 0
    let tokenAbsolute: AbsoluteQuota | null = null
    if (tokenLimit) {
      tokenUsedPct = clampPct(safeNumber(tokenLimit.percentage, 0))
      tokenNextResetEpoch = safeNumber(tokenLimit.nextResetTime, 0)
      tokenAbsolute = absoluteFromToken(tokenLimit, tokenUsedPct)
    }
    let weeklyQuota: ZaiQuotaData["weeklyLimit"] = null
    if (weeklyLimit) {
      const weeklyUsedPct = clampPct(safeNumber(weeklyLimit.percentage, 0))
      weeklyQuota = {
        usedPct: weeklyUsedPct,
        remainingPct: clampPct(100 - weeklyUsedPct),
        nextResetEpoch: safeNumber(weeklyLimit.nextResetTime, 0),
        absolute: absoluteFromToken(weeklyLimit, weeklyUsedPct),
      }
    }
    let timeQuota: ZaiQuotaData["timeLimit"] = null
    if (timeLimit) {
      const timeUsedPct = clampPct(safeNumber(timeLimit.percentage, 0))
      timeQuota = {
        usedPct: timeUsedPct,
        remainingPct: clampPct(100 - timeUsedPct),
        nextResetEpoch: safeNumber(timeLimit.nextResetTime, 0),
        total: safeNumber(timeLimit.usage, 0),
        used: safeNumber(timeLimit.currentValue, 0),
        usageDetails: Array.isArray(timeLimit.usageDetails) ? timeLimit.usageDetails : [],
      }
    }
    return {
      level,
      tokenUsedPct,
      tokenRemainingPct: clampPct(100 - tokenUsedPct),
      tokenNextResetEpoch,
      tokenAbsolute,
      weeklyLimit: weeklyQuota,
      timeLimit: timeQuota,
    }
  } catch (err) {
    console.error("[quota-zai] fetchQuota error:", err)
    return null
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

// --- Display computation ----------------------------------------------------

interface DisplayState {
  source: "api" | "retry-after" | "heuristic"
  level: string
  isPeak: boolean
  token: {
    usedPct: number
    remainingPct: number
    nextResetEpoch: number
    absolute: AbsoluteQuota | null
    countdown: string
  }
  weekly: {
    usedPct: number
    remainingPct: number
    nextResetEpoch: number
    absolute: AbsoluteQuota | null
    countdown: string
  } | null
  time: {
    usedPct: number
    remainingPct: number
    nextResetEpoch: number
    total: number
    used: number
    countdown: string
    usageDetails: UsageDetail[]
  } | null
}

function computeDisplay(
  t: number,
  apiQuota: ZaiQuotaData | null,
  ra: number | null,
  bs: string,
  cy: number,
): DisplayState {
  const isPeak = isPeakHour(t)
  const hasApiData =
    apiQuota !== null &&
    (apiQuota.tokenNextResetEpoch > 0 ||
      apiQuota.timeLimit !== null ||
      apiQuota.weeklyLimit !== null)
  if (hasApiData) {
    const hasTokenReset = apiQuota.tokenNextResetEpoch > 0
    return {
      source: "api",
      level: apiQuota.level,
      isPeak,
      token: {
        usedPct: apiQuota.tokenUsedPct,
        remainingPct: apiQuota.tokenRemainingPct,
        nextResetEpoch: apiQuota.tokenNextResetEpoch,
        absolute: apiQuota.tokenAbsolute,
        countdown: hasTokenReset ? formatRemaining(apiQuota.tokenNextResetEpoch - t) : "—",
      },
      weekly: apiQuota.weeklyLimit
        ? {
          usedPct: apiQuota.weeklyLimit.usedPct,
          remainingPct: apiQuota.weeklyLimit.remainingPct,
          nextResetEpoch: apiQuota.weeklyLimit.nextResetEpoch,
          absolute: apiQuota.weeklyLimit.absolute,
          countdown: formatRemaining(apiQuota.weeklyLimit.nextResetEpoch - t),
        }
        : null,
      time: apiQuota.timeLimit
        ? {
          usedPct: apiQuota.timeLimit.usedPct,
          remainingPct: apiQuota.timeLimit.remainingPct,
          nextResetEpoch: apiQuota.timeLimit.nextResetEpoch,
          total: apiQuota.timeLimit.total,
          used: apiQuota.timeLimit.used,
          countdown: formatRemaining(apiQuota.timeLimit.nextResetEpoch - t),
          usageDetails: apiQuota.timeLimit.usageDetails,
        }
        : null,
    }
  }
  if (ra && ra > t) {
    return {
      source: "retry-after",
      level: "Rate limited",
      isPeak,
      token: {
        usedPct: 0,
        remainingPct: 0,
        nextResetEpoch: ra,
        absolute: null,
        countdown: formatRemaining(ra - t),
      },
      weekly: null,
      time: null,
    }
  }
  const baseEpoch = parseSgt(bs)
  const nextEpoch = baseEpoch !== null ? nextResetEpoch(baseEpoch, cy, t) : t + cy
  const remaining = nextEpoch - t
  return {
    source: "heuristic",
    level: "",
    isPeak,
    token: {
      usedPct: 0,
      remainingPct: 0,
      nextResetEpoch: nextEpoch,
      absolute: null,
      countdown: formatRemaining(remaining),
    },
    weekly: null,
    time: null,
  }
}

// --- Component --------------------------------------------------------------

function View(props: { api: TuiPluginApi; sessionID: string }) {
  const theme = () => props.api.theme.current

  const [apiKey, setApiKey] = createSignal<string | null>(findZaiKeyFromFiles())
  createEffect(() => {
    const key = findZaiKeyFromProviders(props.api.state.provider)
    if (key) setApiKey(key)
  })

  const [quotaTrigger, setQuotaTrigger] = createSignal(0)
  const [quotaData, setQuotaData] = createSignal<ZaiQuotaData | null>(null)
  const [quotaStale, setQuotaStale] = createSignal(false)
  const [lastSuccessAt, setLastSuccessAt] = createSignal(0)
  const [hasFetched, setHasFetched] = createSignal(false)

  createEffect(() => {
    const key = apiKey()
    quotaTrigger()
    if (!key) {
      setHasFetched(true)
      return
    }
    fetchZaiQuota(key).then(data => {
      if (data) {
        setQuotaData(data)
        setQuotaStale(false)
        setLastSuccessAt(Date.now())
      } else if (quotaData()) {
        setQuotaStale(true)
      } else {
        setQuotaData(null)
      }
      setHasFetched(true)
    }).catch(() => {
      if (quotaData()) {
        setQuotaStale(true)
      } else {
        setQuotaData(null)
      }
      setHasFetched(true)
    })
  })

  createEffect(() => {
    const key = apiKey()
    if (!key) return
    const data = quotaData()
    const isExhausted = data ? data.tokenRemainingPct <= 0 : false
    const pollMs = isExhausted ? EXHAUSTED_POLL_MS : API_POLL_MS
    const id = setInterval(() => setQuotaTrigger((x: number) => x + 1), pollMs)
    onCleanup(() => clearInterval(id))
  })

  const [baselineSgt, setBaselineSgt] = createSignal<string>(FALLBACK_BASELINE_SGT)
  const [cycleMs, setCycleMs] = createSignal<number>(FALLBACK_CYCLE_MS)
  createEffect(() => {
    try {
      const storedBase = props.api.kv.get<string>(KV_BASELINE_KEY)
      if (storedBase) setBaselineSgt(storedBase)
      const storedCycle = props.api.kv.get<number>(KV_CYCLE_MS_KEY)
      if (storedCycle) setCycleMs(Number(storedCycle) || FALLBACK_CYCLE_MS)
    } catch { /* KV not ready */ }
  })

  const messages = createMemo(() => {
    try {
      return props.api.state.session.messages(props.sessionID)
    } catch {
      return [] as Message[]
    }
  })

  const partReader = (messageID: string): readonly Part[] => {
    try {
      return props.api.state.part(messageID)
    } catch {
      return [] as Part[]
    }
  }

  createEffect(() => {
    const found = scanMessageParts(messages(), partReader, RESET_PARSE_RE)
    if (found) {
      const match = found.match(RESET_PARSE_RE)
      const resetTime = match ? match[1] : null
      if (resetTime && resetTime !== baselineSgt()) {
        setBaselineSgt(resetTime)
        try { props.api.kv.set(KV_BASELINE_KEY, resetTime) } catch { /* best-effort */ }
      }
    }
  })

  const [retryAfterEpoch, setRetryAfterEpoch] = createSignal<number | null>(null)
  createEffect(() => {
    const found = scanMessageParts(messages(), partReader, RETRY_AFTER_RE)
    if (!found) {
      setRetryAfterEpoch(null)
      return
    }
    const match = found.match(RETRY_AFTER_RE)
    if (!match) {
      setRetryAfterEpoch(null)
      return
    }
    const h = match[1] ? parseInt(match[1]) : 0
    const m = match[2] ? parseInt(match[2]) : 0
    const s = match[3] ? parseInt(match[3]) : 0
    const totalSec = h * 3600 + m * 60 + s
    setRetryAfterEpoch(totalSec > 0 ? Date.now() + totalSec * 1000 : null)
  })

  const [now, setNow] = createSignal(Date.now())
  const tickId = setInterval(() => {
    const current = Date.now()
    setNow(current)
    const lastOk = lastSuccessAt()
    if (lastOk && current - lastOk > STALE_MAX_MS && quotaData()) {
      setQuotaData(null)
      setQuotaStale(false)
    }
  }, TICK_MS)
  onCleanup(() => clearInterval(tickId))

  const [displayState, setDisplayState] = createSignal(computeDisplay(
    Date.now(), null, null, FALLBACK_BASELINE_SGT, FALLBACK_CYCLE_MS,
  ))

  createEffect(() => {
    setDisplayState(computeDisplay(
      now(), quotaData(), retryAfterEpoch(), baselineSgt(), cycleMs(),
    ))
  })

  const [open, setOpen] = createSignal(false)

  return (
    <box flexDirection="column">
      {(() => {
        if (!hasFetched()) {
          return (
            <box flexDirection="column">
              <text fg={theme().textMuted}>Loading Z.AI...</text>
            </box>
          )
        }

        const s = displayState()

        if (s.source === "heuristic") {
          return (
            <box flexDirection="column">
              <text fg={theme().text} attributes={TextAttributes.BOLD}>Z.AI (est)</text>
              <text fg={theme().text}>  Reset: {s.token.countdown}</text>
            </box>
          )
        }

        const canExpand = s.source === "api"
        const rem = s.token.remainingPct

        return (
          <box flexDirection="column">
            {/* Header row */}
            <box flexDirection="row" gap={1} onMouseDown={() => canExpand && setOpen((x: boolean) => !x)}>
              <Show when={canExpand}>
                <text fg={theme().text}>{open() ? "▼" : "▶"}</text>
              </Show>
              <text fg={theme().text} attributes={TextAttributes.BOLD}>
                Z.AI{s.level ? `: ${s.level}` : ""}
              </text>
              <Show when={s.source === "api"}>
                <text fg={s.isPeak ? theme().warning : theme().success}>
                  {s.isPeak ? "Peak (3x)" : "Off-Peak (1x)"}
                </text>
              </Show>
              <Show when={s.token.remainingPct <= 0}>
                <text fg={theme().error}>⚠ Limited</text>
              </Show>
              <Show when={quotaStale()}>
                <text fg={theme().warning}>~stale</text>
              </Show>
            </box>

            {/* 1x space below Title */}
            {/* <box height={1} /> */}

            {/* 5H row - always visible */}
            <BarRow label="5H" remainingPct={rem} theme={theme()} />

            {/* Expanded section */}
            <Show when={open()}>
              <box flexDirection="column">
                {/* 5H usage detail + reset countdown */}
                <Show when={s.token.absolute} fallback={<text fg={theme().textMuted}>  Reset in {s.token.countdown}</text>}>
                  {(abs) => (
                    <text fg={theme().textMuted}>  {formatCount(abs().used)} / {formatCount(abs().total)} tokens · Reset in {s.token.countdown}</text>
                  )}
                </Show>

                {/* Weekly (7D) limit details */}
                {(() => {
                  if (s.weekly) {
                    const w = s.weekly
                    return (
                      <box flexDirection="column">
                        <BarRow label="7D" remainingPct={w.remainingPct} theme={theme()} />
                        <Show when={w.absolute} fallback={<text fg={theme().textMuted}>  Reset in {w.countdown}</text>}>
                          {(wAbs) => (
                            <text fg={theme().textMuted}>  {formatCount(wAbs().used)} / {formatCount(wAbs().total)} tokens · Reset in {w.countdown}</text>
                          )}
                        </Show>
                      </box>
                    )
                  } else {
                    return (
                      <box flexDirection="column">
                        <BarRow label="7D" remainingPct={100} theme={theme()} />
                        <text fg={theme().textMuted}>  Unlimited (Legacy)</text>
                      </box>
                    )
                  }
                })()}

                {/* Tool section */}
                {/* <Show when={s.time !== null}>
                  {(() => {
                    const tu = s.time
                    if (tu === null) return null
                    return (
                      <box flexDirection="column">
                        <box height={1} />
                        <BarRow label="T" remainingPct={tu.remainingPct} theme={theme()} />
                        <text fg={theme().textMuted}>  {formatCount(tu.used)} / {formatCount(tu.total)} calls · Reset in {tu.countdown}</text>
                        <Show when={tu.usageDetails && tu.usageDetails.some(u => u.usage > 0)}>
                          <box flexDirection="column">
                            <For each={tu.usageDetails.filter(u => u.usage > 0)}>
                              {(detail) => (
                                <text fg={theme().textMuted}>  {detail.modelCode}: {detail.usage}</text>
                              )}
                            </For>
                          </box>
                        </Show>
                      </box>
                    )
                  })()}
                </Show> */}
              </box>
            </Show>
          </box>
        )
      })()}
    </box>
  )
}

function HomeView(props: { api: TuiPluginApi }) {
  const theme = () => props.api.theme.current

  const [apiKey, setApiKey] = createSignal<string | null>(findZaiKeyFromFiles())
  createEffect(() => {
    const key = findZaiKeyFromProviders(props.api.state.provider)
    if (key) setApiKey(key)
  })

  const [quotaTrigger, setQuotaTrigger] = createSignal(0)
  const [summary, setSummary] = createSignal<HomeQuotaSummary | null>(null)

  createEffect(() => {
    const key = apiKey()
    quotaTrigger()
    if (!key) {
      setSummary(null)
      return
    }
    fetchZaiQuota(key)
      .then(data => setSummary(data ? zaiHomeQuotaSummary(data) : null))
      .catch(() => setSummary(null))
  })

  const id = setInterval(() => setQuotaTrigger((x: number) => x + 1), API_POLL_MS)
  onCleanup(() => clearInterval(id))

  return (
    <box gap={0}>
      <Show when={summary()}>
        {(item) => <HomeQuotaLine summary={item()} theme={theme()} />}
      </Show>
    </box>
  )
}

const tui: TuiPlugin = async (api) => {
  const { slots } = api

  slots.register({
    order: 110,
    slots: {
      home_bottom() {
        return <HomeView api={api} />
      },
      sidebar_content(_ctx, props) {
        return <View api={api} sessionID={props.session_id} />
      },
    },
  })
}

const plugin: TuiPluginModule & { id: string } = {
  id: "aamkye/opencode-quota-zai",
  tui,
}

export default plugin
