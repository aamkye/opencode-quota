import type { TuiPluginApi } from "@opencode-ai/plugin/tui"
import { createRoot, createSignal, onCleanup } from "solid-js"

import type { PanelItem, PanelModel } from "../presentation/types.js"
import type { ProviderFreshness, QuotaProviderAdapter, QuotaProviderOptions } from "./types.js"

const DEFAULT_REFRESH_INTERVAL_MS = 10_000
const TICK_MS = 1_000
const FETCH_TIMEOUT_MS = 20_000
const STALE_MAX_MS = 600_000

export type OpenCodeGoOptions = {
  workspaceId?: string
  workspaceToken?: string
}

export type OpenCodeGoConfig = Readonly<{
  workspaceId: string
  workspaceToken: string
}>

export type OpenCodeGoProviderOptions = QuotaProviderOptions & {
  config: OpenCodeGoConfig | null
  fetch?: typeof globalThis.fetch
}

export type OpenCodeGoWindow = {
  usedPct: number
  remainingPct: number
  resetEpoch: number
}

export type OpenCodeGoQuotaData = {
  fiveHour: OpenCodeGoWindow
  weekly: OpenCodeGoWindow
  monthly: OpenCodeGoWindow
}

export type OpenCodeGoFetchResult =
  | { kind: "success"; data: OpenCodeGoQuotaData }
  | { kind: "authentication-required" }
  | { kind: "transient-failure" }
  | { kind: "invalid-response" }

export type OpenCodeGoFetchDependencies = {
  fetch: typeof globalThis.fetch
  now: () => number
}

const WORKSPACE_ID = /^wrk_[A-Za-z0-9]+$/
const OPENCODE_ORIGIN = "https://opencode.ai"
const MAX_HTML_LENGTH = 1_000_000
const MAX_ASSIGNMENT_LENGTH = 4_096
const NUMBER_SOURCE = String.raw`-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?`
const OBJECT_PATTERN = new RegExp(
  String.raw`^\{status:"ok",resetInSec:(?<reset>${NUMBER_SOURCE}),usagePercent:(?<usage>${NUMBER_SOURCE})\}$`,
  "u",
)
const RECORDS = [
  { name: "rollingUsage", output: "fiveHour" },
  { name: "weeklyUsage", output: "weekly" },
  { name: "monthlyUsage", output: "monthly" },
] as const

export function normalizeOpenCodeGoConfig(value: unknown): OpenCodeGoConfig | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  const input = value as OpenCodeGoOptions
  const workspaceId = typeof input.workspaceId === "string" ? input.workspaceId.trim() : ""
  const workspaceToken = typeof input.workspaceToken === "string" ? input.workspaceToken.trim() : ""
  if (!WORKSPACE_ID.test(workspaceId) || !workspaceToken || /[\r\n]/u.test(workspaceToken)) return null
  return Object.freeze({ workspaceId, workspaceToken })
}

const RAW_TEXT_NAMES = new Set(["textarea", "title", "style", "xmp", "iframe", "noembed", "noframes"])
const NOT_A_TAG = Symbol("not-a-tag")

type HtmlTag = { closing: boolean; name: string; end: number; selfClosing: boolean }

function isHtmlSpace(char: string | undefined): boolean {
  return char === " " || char === "\t" || char === "\n" || char === "\f" || char === "\r"
}

function isAsciiAlpha(char: string | undefined): boolean {
  return char !== undefined && /[A-Za-z]/u.test(char)
}

function isTagNameChar(char: string | undefined): boolean {
  return char !== undefined && /[A-Za-z0-9:-]/u.test(char)
}

function startsWithAsciiCaseInsensitive(source: string, value: string, at: number): boolean {
  if (at + value.length > source.length) return false
  for (let offset = 0; offset < value.length; offset += 1) {
    if (source.charCodeAt(at + offset) === value.charCodeAt(offset)) continue
    if (source[at + offset]!.toLowerCase() !== value[offset]!.toLowerCase()) return false
  }
  return true
}

function scanMarkupEnd(html: string, start: number): number | null {
  let quote: "'" | '"' | null = null
  for (let cursor = start; cursor < html.length; cursor += 1) {
    const char = html[cursor]!
    if (quote) {
      if (char === quote) quote = null
      continue
    }
    if (char === "'" || char === '"') quote = char
    else if (char === "<") return null
    else if (char === ">") return cursor + 1
  }
  return null
}

function readDataTag(html: string, start: number): HtmlTag | typeof NOT_A_TAG | null {
  let cursor = start + 1
  let closing = false
  if (html[cursor] === "/") {
    closing = true
    cursor += 1
  }
  if (!isAsciiAlpha(html[cursor])) return NOT_A_TAG

  const nameStart = cursor
  while (isTagNameChar(html[cursor])) cursor += 1
  const name = html.slice(nameStart, cursor).toLowerCase()
  if (!isHtmlSpace(html[cursor]) && html[cursor] !== "/" && html[cursor] !== ">") return null

  if (closing) {
    while (isHtmlSpace(html[cursor])) cursor += 1
    if (html[cursor] !== ">") return null
    return { closing: true, name, end: cursor + 1, selfClosing: false }
  }

  let quote: "'" | '"' | null = null
  let lastNonSpace = cursor - 1
  while (cursor < html.length) {
    const char = html[cursor]!
    if (quote) {
      if (char === quote) quote = null
      cursor += 1
      continue
    }
    if (char === "'" || char === '"') quote = char
    else if (char === "<") return null
    else if (char === ">") {
      return { closing: false, name, end: cursor + 1, selfClosing: html[lastNonSpace] === "/" }
    }
    if (!isHtmlSpace(char)) lastNonSpace = cursor
    cursor += 1
  }
  return null
}

function readRawEnd(html: string, start: number, name: string): number | null | undefined {
  if (html[start] !== "<" || html[start + 1] !== "/"
    || !startsWithAsciiCaseInsensitive(html, name, start + 2)) return undefined
  let cursor = start + 2 + name.length
  const boundary = html[cursor]
  if (boundary !== undefined && !isHtmlSpace(boundary) && boundary !== "/" && boundary !== ">") return undefined
  while (isHtmlSpace(html[cursor])) cursor += 1
  if (html[cursor] !== ">") return null
  return cursor + 1
}

function scanRawElement(html: string, start: number, name: string): { bodyEnd: number; end: number } | null {
  let cursor = start
  while (cursor < html.length) {
    if (html[cursor] !== "<") {
      cursor += 1
      continue
    }
    const end = readRawEnd(html, cursor, name)
    if (end === null) return null
    if (end !== undefined) return { bodyEnd: cursor, end }
    cursor += 1
  }
  return null
}

function scanScriptBodies(html: string): string[] | null {
  const bodies: string[] = []
  let cursor = 0
  while (cursor < html.length) {
    if (html[cursor] !== "<") {
      cursor += 1
      continue
    }
    if (html.startsWith("<!--", cursor)) {
      cursor += 4
      let closed = false
      while (cursor < html.length) {
        if (html.startsWith("-->", cursor)) {
          cursor += 3
          closed = true
          break
        }
        cursor += 1
      }
      if (!closed) return null
      continue
    }
    if (html[cursor + 1] === "!" || html[cursor + 1] === "?") {
      const end = scanMarkupEnd(html, cursor + 2)
      if (end === null) return null
      cursor = end
      continue
    }

    const tag = readDataTag(html, cursor)
    if (tag === null) return null
    if (tag === NOT_A_TAG) {
      cursor += 1
      continue
    }
    cursor = tag.end
    if (tag.closing || (tag.name !== "script" && !RAW_TEXT_NAMES.has(tag.name))) continue
    if (tag.selfClosing) return null

    const raw = scanRawElement(html, cursor, tag.name)
    if (!raw) return null
    if (tag.name === "script") bodies.push(html.slice(cursor, raw.bodyEnd))
    cursor = raw.end
  }
  return bodies
}

type CapturedRecord = { end: number; resetInSec: number; usagePercent: number }
type RecordScan = { candidates: number; markers: number; values: CapturedRecord[] }
type ScriptScan = Map<(typeof RECORDS)[number]["name"], RecordScan>
const MARKER_PREFIXES = ["rollingUsage:$R", "weeklyUsage:$R", "monthlyUsage:$R"] as const

function newScriptScan(): ScriptScan {
  const result: ScriptScan = new Map()
  for (const record of RECORDS) result.set(record.name, { candidates: 0, markers: 0, values: [] })
  return result
}

function hasMarkerCandidate(source: string, start: number, end: number): boolean {
  const boundedStart = Math.max(0, Math.min(source.length, start))
  const boundedEnd = Math.max(boundedStart, Math.min(source.length, end))
  const range = source.slice(boundedStart, boundedEnd)
  return MARKER_PREFIXES.some((prefix) => range.indexOf(prefix) >= 0)
}

function readExactMarker(body: string, start: number, prefix: string): number | null {
  let cursor = start + prefix.length
  if (body[cursor] !== "[") return null
  cursor += 1
  const digitStart = cursor
  while (body[cursor] !== undefined && body.charCodeAt(cursor) >= 48 && body.charCodeAt(cursor) <= 57) cursor += 1
  if (cursor === digitStart || body[cursor] !== "]" || body[cursor + 1] !== "=") return null
  return cursor + 2
}

function captureExactRecord(body: string, start: number): CapturedRecord | null {
  if (body[start] !== "{") return null
  const inspectionEnd = Math.min(body.length, start + MAX_ASSIGNMENT_LENGTH + 1)
  let close = start
  while (close < inspectionEnd && body[close] !== "}") close += 1
  if (close === inspectionEnd || close - start + 1 > MAX_ASSIGNMENT_LENGTH) return null

  const object = OBJECT_PATTERN.exec(body.slice(start, close + 1))
  if (!object?.groups) return null

  let suffix = close + 1
  while (body[suffix] === " " || body[suffix] === "\t") suffix += 1
  if (suffix < body.length && body[suffix] !== "," && body[suffix] !== ";"
    && body[suffix] !== "}" && body[suffix] !== "\r" && body[suffix] !== "\n") return null

  return {
    end: close + 1,
    resetInSec: Number(object.groups.reset),
    usagePercent: Number(object.groups.usage),
  }
}

function scanJavaScriptBody(body: string): ScriptScan | null {
  const found = newScriptScan()
  let state: "code" | "single" | "double" | "template" | "line-comment" | "block-comment" = "code"
  let cursor = 0

  while (cursor < body.length) {
    const char = body[cursor]!
    const next = body[cursor + 1]

    if (state === "single" || state === "double") {
      const quote = state === "single" ? "'" : '"'
      if (char === "\\") {
        if (next === undefined) return null
        cursor += 2
      } else if (char === quote) {
        state = "code"
        cursor += 1
      } else if (char === "\r" || char === "\n") {
        return null
      } else cursor += 1
      continue
    }

    if (state === "template") {
      if (char === "\\") {
        if (next === undefined) return null
        cursor += 2
      } else if (char === "`") {
        state = "code"
        cursor += 1
      } else if (char === "$" && next === "{") {
        if (hasMarkerCandidate(body, cursor + 2, body.length)) return null
        return found
      } else cursor += 1
      continue
    }

    if (state === "line-comment") {
      if (char === "\r" || char === "\n") state = "code"
      cursor += 1
      continue
    }

    if (state === "block-comment") {
      if (char === "*" && next === "/") {
        state = "code"
        cursor += 2
      } else cursor += 1
      continue
    }

    if (char === "'") {
      state = "single"
      cursor += 1
      continue
    }
    if (char === '"') {
      state = "double"
      cursor += 1
      continue
    }
    if (char === "`") {
      state = "template"
      cursor += 1
      continue
    }
    if (char === "/") {
      if (next === "/") {
        state = "line-comment"
        cursor += 2
        continue
      }
      if (next === "*") {
        state = "block-comment"
        cursor += 2
        continue
      }
      let lineEnd = cursor + 1
      while (lineEnd < body.length && body[lineEnd] !== "\r" && body[lineEnd] !== "\n") lineEnd += 1
      if (hasMarkerCandidate(body, cursor, lineEnd)) return null
      cursor = lineEnd
      continue
    }

    let handledCandidate = false
    for (const record of RECORDS) {
      const prefix = `${record.name}:$R`
      if (!body.startsWith(prefix, cursor)) continue
      handledCandidate = true
      const bucket = found.get(record.name)!
      bucket.candidates += 1
      const objectStart = readExactMarker(body, cursor, prefix)
      if (objectStart !== null) {
        bucket.markers += 1
        const value = captureExactRecord(body, objectStart)
        if (value) {
          bucket.values.push(value)
          cursor = value.end
        } else cursor += 1
      } else cursor += 1
      break
    }
    if (!handledCandidate) cursor += 1
  }

  if (state === "single" || state === "double" || state === "template" || state === "block-comment") return null
  return found
}

export function parseOpenCodeGoHydration(html: string, receivedAt: number): OpenCodeGoQuotaData | null {
  if (html.length > MAX_HTML_LENGTH || !Number.isFinite(receivedAt)) return null
  const bodies = scanScriptBodies(html)
  if (!bodies) return null

  const aggregate = newScriptScan()
  for (const body of bodies) {
    const scanned = scanJavaScriptBody(body)
    if (!scanned) return null
    for (const record of RECORDS) {
      const target = aggregate.get(record.name)!
      const source = scanned.get(record.name)!
      target.candidates += source.candidates
      target.markers += source.markers
      target.values.push(...source.values)
    }
  }

  const output: Partial<OpenCodeGoQuotaData> = {}
  for (const record of RECORDS) {
    const result = aggregate.get(record.name)!
    if (result.candidates !== 1 || result.markers !== 1 || result.values.length !== 1) return null
    const { resetInSec, usagePercent } = result.values[0]!
    const resetEpoch = receivedAt + resetInSec * 1_000
    if (!Number.isFinite(resetInSec) || resetInSec < 0
      || !Number.isFinite(usagePercent) || usagePercent < 0 || usagePercent > 100
      || !Number.isFinite(resetEpoch)) return null
    output[record.output] = {
      usedPct: usagePercent,
      remainingPct: Math.min(100, Math.max(0, 100 - usagePercent)),
      resetEpoch,
    }
  }

  return output as OpenCodeGoQuotaData
}

export async function fetchOpenCodeGoQuota(
  config: OpenCodeGoConfig,
  signal: AbortSignal,
  dependencies: OpenCodeGoFetchDependencies,
): Promise<OpenCodeGoFetchResult> {
  const url = `${OPENCODE_ORIGIN}/workspace/${encodeURIComponent(config.workspaceId)}/go`
  let response: Response
  try {
    response = await dependencies.fetch(url, {
      method: "GET",
      headers: { Accept: "text/html", Cookie: `auth=${config.workspaceToken}` },
      redirect: "manual",
      signal,
    })
  } catch {
    return { kind: "transient-failure" }
  }

  if (response.status === 401 || response.status === 403) return { kind: "authentication-required" }
  if (response.status >= 300 && response.status < 400) {
    try {
      const location = new URL(response.headers.get("location") ?? "", OPENCODE_ORIGIN)
      if (location.origin === OPENCODE_ORIGIN
        && (location.pathname.startsWith("/login") || location.pathname.startsWith("/auth"))) {
        return { kind: "authentication-required" }
      }
    } catch {
      return { kind: "invalid-response" }
    }
    return { kind: "invalid-response" }
  }
  if (response.status === 408 || response.status === 429 || (response.status >= 500 && response.status <= 599)) {
    return { kind: "transient-failure" }
  }
  if (response.status !== 200
    || !/^text\/html(?:\s*;|$)/iu.test(response.headers.get("content-type") ?? "")) {
    return { kind: "invalid-response" }
  }

  let html: string
  try {
    html = await response.text()
  } catch {
    return { kind: "transient-failure" }
  }
  const data = parseOpenCodeGoHydration(html, dependencies.now())
  return data ? { kind: "success", data } : { kind: "invalid-response" }
}

export type OpenCodeGoPanelPhase =
  | "configuration-required"
  | "loading"
  | "unavailable"
  | "ready"
  | "stale"

export type OpenCodeGoPanelState = {
  phase: OpenCodeGoPanelPhase
  now: number
  data?: OpenCodeGoQuotaData | null
}

export function openCodeGoHomeQuotaSummary(data: OpenCodeGoQuotaData) {
  return {
    provider: "OpenCode GO" as const,
    plan: "Subscription" as const,
    primaryPct: data.fiveHour.remainingPct,
    secondaryPct: data.weekly.remainingPct,
  }
}

function openCodeGoTimer(window: OpenCodeGoWindow, now: number): "idle" | "countdown" | "expired" {
  if (window.remainingPct >= 100) return "idle"
  return window.resetEpoch > now ? "countdown" : "expired"
}

function openCodeGoWindowItems(
  id: "5h" | "7d" | "1m",
  label: "5H" | "7D" | "1M",
  order: 20 | 40 | 60,
  window: OpenCodeGoWindow,
  now: number,
): PanelItem[] {
  return [
    { id: `opencode-go:${id}`, order, kind: "progress", label, value: window.remainingPct, total: 100 },
    { id: `opencode-go:${id}-reset`, order: order + 10, kind: "timer", label: `${label} reset`, state: openCodeGoTimer(window, now), epoch: window.resetEpoch },
  ]
}

export function mapOpenCodeGoPanelState(state: OpenCodeGoPanelState): PanelModel {
  const items: PanelItem[] = []
  if (!state.data) {
    const detail = state.phase === "configuration-required"
      ? "Configuration required"
      : state.phase === "loading"
        ? "Loading OpenCode GO..."
        : "Usage unavailable"
    items.push({ id: "opencode-go:header", order: 10, kind: "header", title: "OpenCode GO:", detail })
  } else {
    items.push({ id: "opencode-go:header", order: 10, kind: "header", title: "OpenCode GO:" })
    if (state.phase === "stale") {
      items.push({ id: "opencode-go:stale", order: 15, kind: "text", text: "~stale", status: "warning" })
    }
    items.push(...openCodeGoWindowItems("5h", "5H", 20, state.data.fiveHour, state.now))
    items.push(...openCodeGoWindowItems("7d", "7D", 40, state.data.weekly, state.now))
    items.push(...openCodeGoWindowItems("1m", "1M", 60, state.data.monthly, state.now))
  }

  return {
    id: "opencode-go",
    order: 130,
    title: "OpenCode GO",
    collapsedSummary: state.data ? { kind: "text", text: `${Math.round(state.data.fiveHour.remainingPct)}%` } : undefined,
    groups: [{ id: "opencode-go:quota", order: 10, items }],
  }
}

function unref(timer: ReturnType<typeof setTimeout> | ReturnType<typeof setInterval>): void {
  (timer as { unref?: () => void }).unref?.()
}

export function createOpenCodeGoProvider(
  api: TuiPluginApi,
  options: OpenCodeGoProviderOptions,
): QuotaProviderAdapter {
  void api
  const refreshIntervalMs = typeof options.refreshIntervalMs === "number"
    && Number.isFinite(options.refreshIntervalMs)
    && options.refreshIntervalMs > 0
    ? options.refreshIntervalMs
    : DEFAULT_REFRESH_INTERVAL_MS

  return createRoot((disposeRoot) => {
    const [data, setData] = createSignal<OpenCodeGoQuotaData | null>(null)
    const [phase, setPhase] = createSignal<OpenCodeGoPanelPhase>(options.config ? "loading" : "configuration-required")
    const [lastSuccessAt, setLastSuccessAt] = createSignal(0)
    const [now, setNow] = createSignal(Date.now())
    let disposed = false
    let refreshInFlight: Promise<void> | null = null
    let refreshStartedAt = 0
    let pendingBoundary = 0
    let refreshedBoundary = 0
    let activeController: AbortController | null = null
    let activeRequestTimeout: ReturnType<typeof setTimeout> | null = null
    let boundaryTimer: ReturnType<typeof setTimeout> | null = null

    const clearBoundary = (): void => {
      if (!boundaryTimer) return
      clearTimeout(boundaryTimer)
      boundaryTimer = null
    }

    const scheduleBoundary = (snapshot: OpenCodeGoQuotaData): void => {
      if (disposed) return
      clearBoundary()
      const current = Date.now()
      const epochs = [snapshot.fiveHour.resetEpoch, snapshot.weekly.resetEpoch, snapshot.monthly.resetEpoch]
        .filter((epoch) => epoch > current && epoch !== refreshedBoundary)
      if (epochs.length === 0) return
      const epoch = Math.min(...epochs)
      boundaryTimer = setTimeout(() => {
        boundaryTimer = null
        if (disposed) return
        if (refreshInFlight && refreshStartedAt < epoch) {
          pendingBoundary = Math.max(pendingBoundary, epoch)
          return
        }
        refreshedBoundary = epoch
        void refresh()
      }, Math.max(0, epoch - current))
      unref(boundaryTimer)
    }

    const applyResult = (result: OpenCodeGoFetchResult): void => {
      switch (result.kind) {
        case "success":
          setData(result.data)
          setPhase("ready")
          setLastSuccessAt(Date.now())
          scheduleBoundary(result.data)
          break
        case "authentication-required":
          setData(null)
          setPhase("configuration-required")
          clearBoundary()
          break
        case "invalid-response":
          setData(null)
          setPhase("unavailable")
          clearBoundary()
          break
        case "transient-failure":
          setPhase(data() ? "stale" : "unavailable")
          break
      }
    }

    const refresh = (): Promise<void> => {
      if (disposed || !options.config) return Promise.resolve()
      if (refreshInFlight) return refreshInFlight
      const startedAt = Date.now()
      const controller = new AbortController()
      activeController = controller
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
      activeRequestTimeout = timeout
      unref(timeout)
      const request = (async () => {
        const result = await fetchOpenCodeGoQuota(options.config!, controller.signal, {
          fetch: options.fetch ?? globalThis.fetch,
          now: Date.now,
        })
        if (disposed) return
        applyResult(result)
      })().finally(() => {
        clearTimeout(timeout)
        if (activeRequestTimeout === timeout) activeRequestTimeout = null
        if (activeController === controller) activeController = null
      })
      refreshInFlight = request
      refreshStartedAt = startedAt
      const settled = () => {
        if (refreshInFlight !== request) return
        refreshInFlight = null
        refreshStartedAt = 0
        if (disposed || pendingBoundary <= 0) return
        refreshedBoundary = pendingBoundary
        pendingBoundary = 0
        void refresh()
      }
      void request.then(settled, settled)
      return request
    }

    if (options.config) {
      const poll = setInterval(refresh, refreshIntervalMs)
      unref(poll)
      onCleanup(() => clearInterval(poll))

      const tick = setInterval(() => {
        if (disposed) return
        const current = Date.now()
        setNow(current)
        if (lastSuccessAt() && current - lastSuccessAt() > STALE_MAX_MS && data()) {
          setData(null)
          setPhase("unavailable")
          clearBoundary()
        }
      }, TICK_MS)
      unref(tick)
      onCleanup(() => clearInterval(tick))
      onCleanup(clearBoundary)

      void refresh()
    }

    return {
      id: "opencode-go",
      order: 130,
      panel: () => mapOpenCodeGoPanelState({ phase: phase(), data: data(), now: now() }),
      home: () => (phase() === "ready" || phase() === "stale") && data()
        ? openCodeGoHomeQuotaSummary(data()!)
        : null,
      configured: () => options.config !== null,
      freshness: (): ProviderFreshness => {
        const current = phase()
        return current === "configuration-required" ? "unavailable" : current
      },
      refresh,
      setSessionID(sessionID: string): void {
        void sessionID
      },
      dispose(): void {
        if (disposed) return
        disposed = true
        pendingBoundary = 0
        activeController?.abort()
        if (activeRequestTimeout) {
          clearTimeout(activeRequestTimeout)
          activeRequestTimeout = null
        }
        disposeRoot()
      },
    }
  })
}
