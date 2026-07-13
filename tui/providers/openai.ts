import { existsSync, readFileSync } from "node:fs"
import type { TuiPluginApi } from "@opencode-ai/plugin/tui"
import { createEffect, createRoot, createSignal, onCleanup } from "solid-js"

import type { PanelItem, PanelModel } from "../presentation/types.js"
import type { HomeQuotaSummary, ProviderFreshness, QuotaProviderAdapter } from "./types.js"

const API_POLL_MS = 60_000
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

export async function fetchOpenAiQuota(auth: OpenAiAuthEntry): Promise<OpenAiQuotaData | null> {
  const accessToken = auth.access
  if (!accessToken) return null
  if (auth.expires && auth.expires < Date.now()) {
    console.error("[quota-openai] Token expired")
    return null
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": USER_AGENT,
    }
    const accountId = auth.accountId || decodeJwtAccountId(accessToken)
    if (accountId) headers["ChatGPT-Account-Id"] = accountId

    const response = await fetch(OPENAI_USAGE_URL, { headers, signal: controller.signal })
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
    console.error("[quota-openai] fetchQuota error:", error)
    return null
  } finally {
    clearTimeout(timeout)
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

function header(title: string, detail?: string): PanelItem {
  return { id: "openai:header", order: 10, kind: "header", title, ...(detail ? { detail } : {}) }
}

function quotaItems(label: "5H" | "7D", id: "5h" | "7d", order: number, window: RateLimitWindow, now: number): PanelItem[] {
  const remainingPct = openAiRemainingPct(window)
  const epoch = resetEpochMs(window, now)
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
    items.push(header(`OpenAI: ${data.planType}`))
    if (data.limitReached) items.push({ id: "openai:limited", order: 15, kind: "text", text: "Limited", status: "error" })
    if (state.phase === "stale") items.push({ id: "openai:stale", order: 16, kind: "text", text: "~stale", status: "warning" })
    items.push(...quotaItems("5H", "5h", 20, data.primary, now))
    if (data.secondary) items.push(...quotaItems("7D", "7d", 50, data.secondary, now))
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

export function createOpenAiProvider(api: TuiPluginApi): QuotaProviderAdapter {
  return createRoot(() => {
    const [auth, setAuth] = createSignal<OpenAiAuthEntry | null>(findOpenAiAuthFromFiles())
    const [quotaData, setQuotaData] = createSignal<OpenAiQuotaData | null>(null)
    const [phase, setPhase] = createSignal<OpenAiPanelPhase>("loading")
    const [lastSuccessAt, setLastSuccessAt] = createSignal(0)
    const [now, setNow] = createSignal(Date.now())
    const [refreshedBoundary, setRefreshedBoundary] = createSignal(0)

    const refresh = async (): Promise<void> => {
      const currentAuth = auth()
      if (!currentAuth?.access) {
        setPhase("unavailable")
        return
      }
      const data = await fetchOpenAiQuota(currentAuth)
      if (data) {
        setQuotaData(data)
        setPhase("ready")
        setLastSuccessAt(Date.now())
      } else if (quotaData()) {
        setPhase("stale")
      } else {
        setPhase("unavailable")
      }
    }

    createEffect(() => {
      const providerAuth = findOpenAiAuthFromProviders(api.state.provider)
      if (providerAuth) setAuth(providerAuth)
    })

    createEffect(() => {
      auth()
      void refresh()
    })

    createEffect(() => {
      if (!auth()?.access) return
      const exhausted = quotaData() ? openAiRemainingPct(quotaData()!.primary) <= 0 : false
      const timer = setInterval(() => void refresh(), exhausted ? EXHAUSTED_POLL_MS : API_POLL_MS)
      unref(timer)
      onCleanup(() => clearInterval(timer))
    })

    const tick = setInterval(() => {
      const current = Date.now()
      setNow(current)
      if (lastSuccessAt() && current - lastSuccessAt() > STALE_MAX_MS && quotaData()) {
        setQuotaData(null)
        setPhase("unavailable")
      }
    }, TICK_MS)
    unref(tick)
    onCleanup(() => clearInterval(tick))

    createEffect(() => {
      const data = quotaData()
      if (!data) return
      const epoch = resetEpochMs(data.primary, now())
      if (epoch <= 0 || epoch === refreshedBoundary()) return
      const timer = setTimeout(() => {
        setRefreshedBoundary(epoch)
        void refresh()
      }, Math.max(0, epoch - Date.now()))
      unref(timer)
      onCleanup(() => clearTimeout(timer))
    })

    return {
      id: "openai",
      order: PROVIDER_ORDER,
      panel: () => mapOpenAiPanelState({ phase: phase(), data: quotaData(), authenticated: Boolean(auth()?.access), now: now() }),
      // The legacy home slot removes unavailable and stale OpenAI data rather than showing cached usage.
      home: () => phase() === "ready" && quotaData() ? openAiHomeQuotaSummary(quotaData()!) : null,
      freshness: () => freshnessFor(phase()),
      refresh,
      setSessionID(sessionID: string): void {
        void sessionID
      },
    }
  })
}
