/** @jsxImportSource @opentui/solid */
import { createEffect, createSignal, onCleanup, Show } from "solid-js"
import type { TuiPlugin, TuiPluginApi, TuiPluginModule } from "@opencode-ai/plugin/tui"
import type { Provider } from "@opencode-ai/sdk/v2"
import { TextAttributes } from "@opentui/core"
import {
  API_POLL_MS, EXHAUSTED_POLL_MS, TICK_MS, FETCH_TIMEOUT_MS, STALE_MAX_MS,
  CREDENTIAL_FILE_PATHS,
  safeNumber, clampPct, formatRemaining,
  BarRow, HomeQuotaLine, type HomeQuotaSummary,
} from "./opencode-quota-shared"
import { readFileSync, existsSync } from "fs"

// --- API response shapes ----------------------------------------------------
// GET https://chatgpt.com/backend-api/wham/usage

export interface RateLimitWindow {
  used_percent: number
  limit_window_seconds: number
  reset_after_seconds: number
  reset_at?: number
}

interface RateLimitGroup {
  allowed?: boolean
  limit_reached?: boolean
  primary_window: RateLimitWindow
  secondary_window?: RateLimitWindow | null
}

interface UsageResponse {
  plan_type?: string
  rate_limit?: RateLimitGroup | null
  code_review_rate_limit?: { primary_window?: RateLimitWindow | null } | null
  credits?: {
    has_credits?: boolean
    unlimited?: boolean
    balance?: string | null
  } | null
}

export interface OpenAiQuotaData {
  planType: string
  primary: RateLimitWindow
  secondary: RateLimitWindow | null
  codeReview: RateLimitWindow | null
  limitReached: boolean
  creditsBalance: string | null
  creditsUnlimited: boolean
}

// --- OpenAI-specific constants ----------------------------------------------

const OPENAI_USAGE_URL = "https://chatgpt.com/backend-api/wham/usage"
const USER_AGENT = "OpenCode-Quota-Toast/1.0"
const AUTH_SOURCE_KEYS = ["openai", "codex", "chatgpt", "opencode"] as const

// --- Helpers ----------------------------------------------------------------

function resetEpochMs(window: RateLimitWindow): number {
  if (typeof window.reset_at === "number" && window.reset_at > 0) {
    return window.reset_at * 1000
  }
  return Date.now() + safeNumber(window.reset_after_seconds, 0) * 1000
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

// --- Auth token discovery ---------------------------------------------------

export interface OpenAiAuthEntry {
  type?: string
  access?: string
  expires?: number
  refresh?: string
  accountId?: string
}

export function findOpenAiAuthFromFiles(): OpenAiAuthEntry | null {
  for (const filePath of CREDENTIAL_FILE_PATHS) {
    try {
      if (!existsSync(filePath)) continue
      const data = JSON.parse(readFileSync(filePath, "utf-8"))
      for (const key of AUTH_SOURCE_KEYS) {
        const entry = data?.[key]
        if (entry && typeof entry === "object" && entry.access) {
          return entry as OpenAiAuthEntry
        }
      }
    } catch (err) {
      console.error("[quota-openai] Failed to read credential file:", err)
    }
  }
  return null
}

export function findOpenAiAuthFromProviders(providers: readonly Provider[]): OpenAiAuthEntry | null {
  for (const key of AUTH_SOURCE_KEYS) {
    const p = providers.find(pr => pr.id === key)
    if (p?.key) return { access: p.key, type: "oauth" }
  }
  return null
}

function decodeJwtAccountId(token: string): string | null {
  try {
    const parts = token.split(".")
    if (parts.length < 2) return null
    const payload = parts[1]
    const b64 = payload.replace(/-/g, "+").replace(/_/g, "/")
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4)
    const json = Buffer.from(padded, "base64").toString("utf-8")
    const data = JSON.parse(json)
    return data?.["https://api.openai.com/auth"]?.chatgpt_account_id ?? null
  } catch {
    return null
  }
}

// --- API --------------------------------------------------------------------

export async function fetchOpenAiQuota(auth: OpenAiAuthEntry): Promise<OpenAiQuotaData | null> {
  const accessToken = auth.access
  if (!accessToken) return null
  if (auth.expires && auth.expires < Date.now()) {
    console.error("[quota-openai] Token expired")
    return null
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
    const headers: Record<string, string> = {
      "Authorization": `Bearer ${accessToken}`,
      "User-Agent": USER_AGENT,
    }
    const accountId = auth.accountId || decodeJwtAccountId(accessToken)
    if (accountId) headers["ChatGPT-Account-Id"] = accountId

    const res = await fetch(OPENAI_USAGE_URL, { headers, signal: controller.signal })
    clearTimeout(timeoutId)
    if (!res.ok) {
      console.error(`[quota-openai] API returned ${res.status}`)
      return null
    }
    const data = (await res.json()) as UsageResponse
    const primary = data.rate_limit?.primary_window ?? null
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
  } catch (err) {
    console.error("[quota-openai] fetchQuota error:", err)
    return null
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

// --- Component --------------------------------------------------------------

function View(props: { api: TuiPluginApi; sessionID: string }) {
  const theme = () => props.api.theme.current

  const [auth, setAuth] = createSignal<OpenAiAuthEntry | null>(findOpenAiAuthFromFiles())
  createEffect(() => {
    const fromProvider = findOpenAiAuthFromProviders(props.api.state.provider)
    if (fromProvider) setAuth(fromProvider)
  })

  const [quotaTrigger, setQuotaTrigger] = createSignal(0)
  const [quotaData, setQuotaData] = createSignal<OpenAiQuotaData | null>(null)
  const [quotaStale, setQuotaStale] = createSignal(false)
  const [lastSuccessAt, setLastSuccessAt] = createSignal(0)
  const [hasFetched, setHasFetched] = createSignal(false)

  createEffect(() => {
    const a = auth()
    quotaTrigger()
    if (!a?.access) {
      setHasFetched(true)
      return
    }
    fetchOpenAiQuota(a).then(data => {
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

  // Re-fetch every 60s (or 5min when the primary window is exhausted).
  createEffect(() => {
    const a = auth()
    if (!a?.access) return
    const data = quotaData()
    const isExhausted = data ? openAiRemainingPct(data.primary) <= 0 : false
    const pollMs = isExhausted ? EXHAUSTED_POLL_MS : API_POLL_MS
    const id = setInterval(() => setQuotaTrigger((x: number) => x + 1), pollMs)
    onCleanup(() => clearInterval(id))
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

  const [open, setOpen] = createSignal(false)

  return (
    <box flexDirection="column">
      {(() => {
        if (!hasFetched()) {
          return (
            <box flexDirection="column">
              <text fg={theme().textMuted}>Loading OpenAI...</text>
            </box>
          )
        }

        const data = quotaData()
        if (!data) {
          return (
            <box flexDirection="column">
              <text fg={theme().text} attributes={TextAttributes.BOLD}>OpenAI</text>
              <Show
                when={auth()?.access}
                fallback={<text fg={theme().textMuted}>  No ChatGPT account linked</text>}
              >
                <text fg={theme().textMuted}>  Usage unavailable</text>
              </Show>
            </box>
          )
        }

        const primaryRem = openAiRemainingPct(data.primary)

        return (
          <box flexDirection="column">
            {/* Header row */}
            <box flexDirection="row" gap={1} onMouseDown={() => setOpen((x: boolean) => !x)}>
              <text fg={theme().text}>{open() ? "▼" : "▶"}</text>
              <text fg={theme().text} attributes={TextAttributes.BOLD}>
                OpenAI: {data.planType}
              </text>
              <Show when={data.limitReached}>
                <text fg={theme().error}>⚠ Limited</text>
              </Show>
              <Show when={quotaStale()}>
                <text fg={theme().warning}>~stale</text>
              </Show>
            </box>

            {/* 1x space below Title */}
            {/* <box height={1} /> */}

            {/* Primary window (5h) - always visible */}
            <BarRow label="5H" remainingPct={primaryRem} theme={theme()} />

            {/* Expanded section */}
            <Show when={open()}>
              <box flexDirection="column">
                {/* 5H reset countdown */}
                <text fg={theme().textMuted}>  Reset in {formatRemaining(resetEpochMs(data.primary) - now())}</text>

                {/* Weekly (7D) limit */}
                <Show when={data.secondary}>
                  {(sec) => (
                    <box flexDirection="column">
                      <BarRow label="7D" remainingPct={openAiRemainingPct(sec())} theme={theme()} />
                      <text fg={theme().textMuted}>  Reset in {formatRemaining(resetEpochMs(sec()) - now())}</text>
                    </box>
                  )}
                </Show>

                {/* Code review limit */}
                {/* <Show when={data.codeReview}>
                  {(cr) => (
                    <box flexDirection="column">
                      <box height={1} />
                      <BarRow label="Review" remainingPct={openAiRemainingPct(cr())} theme={theme()} />
                      <text fg={theme().textMuted}>  Reset in {formatRemaining(resetEpochMs(cr()) - now())}</text>
                    </box>
                  )}
                </Show> */}

                {/* Credits */}
                {/* <Show when={!data.creditsUnlimited && data.creditsBalance}>
                  <box flexDirection="column">
                    <box height={1} />
                    <text fg={theme().textMuted}>  Credits: {data.creditsBalance}</text>
                  </box>
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

  const [auth, setAuth] = createSignal<OpenAiAuthEntry | null>(findOpenAiAuthFromFiles())
  createEffect(() => {
    const fromProvider = findOpenAiAuthFromProviders(props.api.state.provider)
    if (fromProvider) setAuth(fromProvider)
  })

  const [quotaTrigger, setQuotaTrigger] = createSignal(0)
  const [summary, setSummary] = createSignal<HomeQuotaSummary | null>(null)

  createEffect(() => {
    const a = auth()
    quotaTrigger()
    if (!a?.access) {
      setSummary(null)
      return
    }
    fetchOpenAiQuota(a)
      .then(data => setSummary(data ? openAiHomeQuotaSummary(data) : null))
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
    order: 111,
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
  id: "aamkye/opencode-quota-openai",
  tui,
}

export default plugin
