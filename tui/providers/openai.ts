import { existsSync, readFileSync } from "node:fs"
import type { TuiPluginApi } from "@opencode-ai/plugin/tui"
import { createEffect, createRoot, createSignal, onCleanup } from "solid-js"

import type { PanelItem, PanelModel, PanelTextSegment } from "../presentation/types.js"
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
const OPENAI_USAGE_URL = "https://chatgpt.com/backend-api/wham/usage"
const USER_AGENT = "OpenCode-Quota-Toast/1.0"
const AUTH_SOURCE_KEYS = ["openai", "codex", "chatgpt", "opencode"] as const
const PROVIDER_ORDER = 120

function providerRefreshInterval(options: QuotaProviderOptions): number {
  return typeof options.refreshIntervalMs === "number"
    && Number.isFinite(options.refreshIntervalMs)
    && options.refreshIntervalMs > 0
    ? options.refreshIntervalMs
    : DEFAULT_REFRESH_INTERVAL_MS
}

export type RateLimitWindow = {
  used_percent: number
  limit_window_seconds: number
  reset_after_seconds: number
  reset_at?: number
}

type RateLimitGroup = {
  allowed?: boolean
  limit_reached?: boolean
  primary_window: RateLimitWindow
  secondary_window?: RateLimitWindow | null
}

type UsageResponse = {
  plan_type?: string
  rate_limit?: RateLimitGroup | null
  code_review_rate_limit?: { primary_window?: RateLimitWindow | null } | null
  credits?: {
    has_credits?: boolean
    unlimited?: boolean
    balance?: string | null
  } | null
}

export type OpenAiQuotaData = {
  planType: string
  primary: RateLimitWindow
  secondary: RateLimitWindow | null
  codeReview: RateLimitWindow | null
  limitReached: boolean
  creditsBalance: string | null
  creditsUnlimited: boolean
}

export type OpenAiAuthEntry = {
  type?: string
  access?: string
  expires?: number
  refresh?: string
  accountId?: string
}

export type OpenAiPanelPhase = "loading" | "unavailable" | "ready" | "stale"

export type OpenAiPanelState = {
  phase: OpenAiPanelPhase
  now: number
  data?: OpenAiQuotaData | null
  authenticated?: boolean
}

function clampPct(value: number): number {
  return Math.min(100, Math.max(0, value))
}

function safeNumber(value: unknown, fallback: number): number {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function resetEpochMs(window: RateLimitWindow, now: number): number {
  if (typeof window.reset_at === "number" && window.reset_at > 0) return window.reset_at * 1_000
  const remaining = safeNumber(window.reset_after_seconds, 0)
  return remaining > 0 ? now + remaining * 1_000 : 0
}

export function openAiRemainingPct(window: RateLimitWindow): number {
  return clampPct(100 - safeNumber(window.used_percent, 0))
}

function derivePlanLabel(planType: string | undefined): string {
  const raw = (planType || "").toLowerCase()
  if (raw.includes("pro") && !raw.includes("lite")) return "Pro"
  if (raw.includes("plus")) return "Plus"
  if (raw.includes("lite")) return "Pro Lite"
  if (planType) return planType.charAt(0).toUpperCase() + planType.slice(1)
  return "OpenAI"
}

export function findOpenAiAuthFromFiles(): OpenAiAuthEntry | null {
  for (const filePath of CREDENTIAL_FILE_PATHS) {
    try {
      if (!existsSync(filePath)) continue
      const data = JSON.parse(readFileSync(filePath, "utf-8"))
      for (const key of AUTH_SOURCE_KEYS) {
        const entry = data?.[key]
        if (entry && typeof entry === "object" && entry.access) return entry as OpenAiAuthEntry
      }
    } catch (error) {
      console.error("[quota-openai] Failed to read credential file:", error)
    }
  }
  return null
}

export function findOpenAiAuthFromProviders(providers: TuiPluginApi["state"]["provider"]): OpenAiAuthEntry | null {
  for (const key of AUTH_SOURCE_KEYS) {
    const provider = providers.find((candidate) => candidate.id === key)
    if (provider?.key) return { access: provider.key, type: "oauth" }
  }
  return null
}

function decodeJwtAccountId(token: string): string | null {
  try {
    const payload = token.split(".")[1]
    if (!payload) return null
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/")
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4)
    const data = JSON.parse(Buffer.from(padded, "base64").toString("utf-8"))
    return data?.["https://api.openai.com/auth"]?.chatgpt_account_id ?? null
  } catch {
    return null
  }
}

export async function fetchOpenAiQuota(auth: OpenAiAuthEntry, signal?: AbortSignal): Promise<OpenAiQuotaData | null> {
  const accessToken = auth.access
  if (!accessToken) return null
  if (auth.expires && auth.expires < Date.now()) {
    console.error("[quota-openai] Token expired")
    return null
  }

  const ownedController = signal ? null : new AbortController()
  const requestSignal = signal ?? ownedController!.signal
  const timeout = ownedController
    ? setTimeout(() => ownedController.abort(), FETCH_TIMEOUT_MS)
    : null
  try {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": USER_AGENT,
    }
    const accountId = auth.accountId || decodeJwtAccountId(accessToken)
    if (accountId) headers["ChatGPT-Account-Id"] = accountId

    const response = await fetch(OPENAI_USAGE_URL, { headers, signal: requestSignal })
    if (!response.ok) {
      console.error(`[quota-openai] API returned ${response.status}`)
      return null
    }
    const data = await response.json() as UsageResponse
    const primary = data.rate_limit?.primary_window
    if (!primary) {
      console.error("[quota-openai] No primary rate limit window")
      return null
    }
    return {
      planType: derivePlanLabel(data.plan_type),
      primary,
      secondary: data.rate_limit?.secondary_window ?? null,
      codeReview: data.code_review_rate_limit?.primary_window ?? null,
      limitReached: Boolean(data.rate_limit?.limit_reached),
      creditsBalance: data.credits?.balance ?? null,
      creditsUnlimited: Boolean(data.credits?.unlimited),
    }
  } catch (error) {
    if (!requestSignal.aborted) console.error("[quota-openai] fetchQuota error:", error)
    return null
  } finally {
    if (timeout) clearTimeout(timeout)
  }
}

export function openAiHomeQuotaSummary(data: OpenAiQuotaData): HomeQuotaSummary {
  return {
    provider: "OpenAI",
    plan: data.planType,
    primaryPct: openAiRemainingPct(data.primary),
    secondaryPct: data.secondary ? openAiRemainingPct(data.secondary) : undefined,
  }
}

function timerState(remainingPct: number, epoch: number, now: number): "unavailable" | "idle" | "countdown" | "expired" {
  if (remainingPct >= 100) return "idle"
  if (epoch <= 0) return "unavailable"
  return epoch > now ? "countdown" : "expired"
}

function header(title: string, detail?: string, detailSegments?: readonly PanelTextSegment[]): PanelItem {
  return {
    id: "openai:header",
    order: 10,
    kind: "header",
    title,
    ...(detail ? { detail } : {}),
    ...(detailSegments?.length ? { detailSegments } : {}),
  }
}

export function formatWindowDuration(seconds: number | undefined): string {
  if (typeof seconds !== "number" || !Number.isFinite(seconds) || seconds <= 0) return "Quota"
  const rounded = Math.round(seconds)
  const month = 30 * 24 * 60 * 60
  const week = 7 * 24 * 60 * 60
  const day = 24 * 60 * 60
  const hour = 60 * 60

  if (rounded % month === 0) return `${rounded / month}M`
  if (rounded === week) return "7D"
  if (rounded % week === 0) return `${rounded / week}W`
  if (rounded % day === 0) return `${rounded / day}D`
  if (rounded % hour === 0) return `${rounded / hour}H`
  return `${Math.max(1, Math.round(rounded / hour))}H`
}

function quotaItems(role: "primary" | "secondary", order: number, window: RateLimitWindow, now: number): PanelItem[] {
  const remainingPct = openAiRemainingPct(window)
  const epoch = resetEpochMs(window, now)
  const durationSeconds = typeof window.limit_window_seconds === "number"
    && Number.isFinite(window.limit_window_seconds)
    && window.limit_window_seconds > 0
    ? Math.round(window.limit_window_seconds)
    : 0
  const label = formatWindowDuration(window.limit_window_seconds)
  const durationKey = durationSeconds > 0 ? `${durationSeconds}s` : "unknown"
  const id = `${durationKey}-${role}`

  return [
    { id: `openai:${id}`, order, kind: "progress", label, value: remainingPct, total: 100 },
    { id: `openai:${id}-reset`, order: order + 10, kind: "timer", label: `${label} reset`, state: timerState(remainingPct, epoch, now), ...(epoch > 0 ? { epoch } : {}) },
  ]
}

export function mapOpenAiPanelState(state: OpenAiPanelState): PanelModel {
  const { data, now } = state
  const items: PanelItem[] = []

  if (state.phase === "loading") items.push(header("OpenAI", "Loading OpenAI..."))
  else if (!data) items.push(header("OpenAI", state.authenticated ? "Usage unavailable" : "No ChatGPT account linked"))
  else {
    items.push(header(
      `OpenAI: ${data.planType}`,
      undefined,
      state.phase === "stale" ? [{ text: "stale", status: "warning" }] : undefined,
    ))
    if (data.limitReached) items.push({ id: "openai:limited", order: 15, kind: "text", text: "Limited", status: "error" })
    items.push(...quotaItems("primary", 20, data.primary, now))
    if (data.secondary) items.push(...quotaItems("secondary", 50, data.secondary, now))
  }

  const primaryRemaining = data ? openAiRemainingPct(data.primary) : null
  return {
    id: "openai",
    order: PROVIDER_ORDER,
    title: "OpenAI",
    collapsedSummary: primaryRemaining === null ? undefined : {
      kind: "text",
      text: `${Math.round(primaryRemaining)}%`,
      status: primaryRemaining <= 10 ? "error" : primaryRemaining <= 30 ? "warning" : "success",
    },
    groups: [{ id: "openai:quota", order: 10, items }],
  }
}

function unref(timer: ReturnType<typeof setTimeout> | ReturnType<typeof setInterval>): void {
  ;(timer as { unref?: () => void }).unref?.()
}

function freshnessFor(phase: OpenAiPanelPhase): ProviderFreshness {
  return phase
}

export function createOpenAiProvider(api: TuiPluginApi, options: QuotaProviderOptions = {}): QuotaProviderAdapter {
  const refreshIntervalMs = providerRefreshInterval(options)
  return createRoot((dispose) => {
    type PublishedQuota = { data: OpenAiQuotaData; generation: number }
    type GenerationBoundary = { epoch: number; generation: number }

    const [auth, setAuth] = createSignal<OpenAiAuthEntry | null>(null)
    const [quotaState, setQuotaState] = createSignal<PublishedQuota | null>(null)
    const quotaData = () => quotaState()?.data ?? null
    const [phase, setPhase] = createSignal<OpenAiPanelPhase>("loading")
    const [lastSuccessAt, setLastSuccessAt] = createSignal(0)
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
      const currentAuth = auth()
      if (!currentAuth?.access) {
        setPhase("unavailable")
        return Promise.resolve()
      }

      const generation = credentialGeneration
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
      const startedAt = Date.now()
      const request = (async () => {
        const data = await fetchOpenAiQuota(currentAuth, controller.signal)
        if (disposed || generation !== credentialGeneration) return
        if (data) {
          setQuotaState({ data, generation })
          setPhase("ready")
          setLastSuccessAt(Date.now())
        } else if (quotaData()) {
          setPhase("stale")
        } else {
          setPhase("unavailable")
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
      const next = findOpenAiAuthFromProviders(api.state.provider) ?? findOpenAiAuthFromFiles()
      const credential = next?.access
        ? `${next.access}\u0000${next.accountId ?? ""}`
        : null
      if (credential === observedCredential) return
      const replacingCredential = observedCredential !== undefined && observedCredential !== null
      observedCredential = credential
      credentialGeneration += 1
      clearBoundarySchedule()
      cancelActiveRequest()
      setAuth(next)

      if (!credential) {
        setQuotaState(null)
        setLastSuccessAt(0)
        setPhase("unavailable")
        return
      }
      setPhase(replacingCredential && quotaData() ? "stale" : "loading")
      void refresh()
    })

    createEffect(() => {
      if (!auth()?.access) return
      const published = quotaState()
      const exhausted = published?.generation === credentialGeneration
        && openAiRemainingPct(published.data.primary) <= 0
      const timer = setInterval(() => void refresh(), exhausted ? EXHAUSTED_POLL_MS : refreshIntervalMs)
      unref(timer)
      onCleanup(() => clearInterval(timer))
    })

    const tick = setInterval(() => {
      if (disposed) return
      const current = Date.now()
      setNow(current)
      if (lastSuccessAt() && current - lastSuccessAt() > STALE_MAX_MS && quotaData()) {
        setQuotaState(null)
        clearBoundarySchedule()
        setPhase("unavailable")
      }
    }, TICK_MS)
    unref(tick)
    onCleanup(() => clearInterval(tick))

    createEffect(() => {
      const published = quotaState()
      if (!published || published.generation !== credentialGeneration) return
      const generation = published.generation
      const epoch = resetEpochMs(published.data.primary, now())
      const refreshed = refreshedBoundary()
      const pending = pendingBoundary
      if (
        epoch <= 0
        || (refreshed?.generation === generation && refreshed.epoch === epoch)
        || (pending?.generation === generation && pending.epoch === epoch)
      ) return

      const timer = setTimeout(() => {
        if (
          disposed
          || generation !== credentialGeneration
          || quotaState()?.generation !== generation
        ) return
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
      id: "openai",
      order: PROVIDER_ORDER,
      panel: () => mapOpenAiPanelState({ phase: phase(), data: quotaData(), authenticated: Boolean(auth()?.access), now: now() }),
      // The legacy home slot removes unavailable and stale OpenAI data rather than showing cached usage.
      home: () => phase() === "ready" && quotaData() ? openAiHomeQuotaSummary(quotaData()!) : null,
      quotaSummary: () => quotaData() ? openAiHomeQuotaSummary(quotaData()!) : null,
      freshness: () => freshnessFor(phase()),
      refresh,
      setSessionID(sessionID: string): void {
        void sessionID
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
