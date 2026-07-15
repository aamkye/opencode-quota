export type OpenCodeGoOptions = {
  workspaceId?: string
  workspaceToken?: string
}

export type OpenCodeGoConfig = Readonly<{
  workspaceId: string
  workspaceToken: string
}>

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

function countLiteral(source: string, value: string): number {
  let count = 0
  let cursor = 0
  while (true) {
    const index = source.indexOf(value, cursor)
    if (index < 0) return count
    count += 1
    cursor = index + value.length
  }
}

function scriptBodies(html: string): string[] | null {
  const lower = html.toLowerCase()
  const bodies: string[] = []
  let cursor = 0
  while (cursor < html.length) {
    const open = lower.indexOf("<script", cursor)
    if (open < 0) break
    const afterName = lower[open + 7]
    if (afterName !== ">" && !/\s/u.test(afterName ?? "")) {
      cursor = open + 7
      continue
    }
    const tagEnd = lower.indexOf(">", open + 7)
    const close = tagEnd < 0 ? -1 : lower.indexOf("</script>", tagEnd + 1)
    if (tagEnd < 0 || close < 0) return null
    bodies.push(html.slice(tagEnd + 1, close))
    cursor = close + 9
  }
  return bodies
}

export function parseOpenCodeGoHydration(html: string, receivedAt: number): OpenCodeGoQuotaData | null {
  if (html.length > MAX_HTML_LENGTH || !Number.isFinite(receivedAt)) return null
  const bodies = scriptBodies(html)
  if (!bodies) return null
  const output: Partial<OpenCodeGoQuotaData> = {}

  for (const record of RECORDS) {
    const pattern = () => new RegExp(String.raw`${record.name}:\$R\[(?<index>\d+)\]=`, "gu")
    const allMatches = [...html.matchAll(pattern())]
    const scriptMatches = bodies.flatMap((body) => [...body.matchAll(pattern())].map((match) => ({ body, match })))
    if (countLiteral(html, `${record.name}:$R`) !== 1 || allMatches.length !== 1 || scriptMatches.length !== 1) return null

    const { body, match } = scriptMatches[0]!
    if (match.index === undefined) return null
    const start = match.index + match[0].length
    const bounded = body.slice(start, start + MAX_ASSIGNMENT_LENGTH + 1)
    if (!bounded.startsWith("{")) return null
    const close = bounded.indexOf("}")
    if (close < 0 || close + 1 > MAX_ASSIGNMENT_LENGTH) return null
    const object = OBJECT_PATTERN.exec(bounded.slice(0, close + 1))
    const suffix = body.slice(start + close + 1, start + close + 34)
    if (!object?.groups || !/^[\t ]*(?:[,;}\r\n]|$)/u.test(suffix)) return null

    const resetInSec = Number(object.groups.reset)
    const usagePercent = Number(object.groups.usage)
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
