---
change: add-opencode-go-provider
design-doc: docs/superpowers/specs/2026-07-14-opencode-go-provider-design.md
base-ref: f94168f
---

# OpenCode Go Quota Provider Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an optional, secret-safe OpenCode Go quota adapter that obtains exact 5H, 7D, and 1M usage from the authenticated Go workspace HTML hydration contract and composes it into the existing quota sidebar.

**Architecture:** Keep configuration validation, fixed-origin HTML transport, bounded hydration extraction, semantic mapping, and reactive lifecycle in `tui/providers/opencode-go.ts`. Export provider computation through `shared/opencode-tools-shared.ts`, then let the existing `tui/quota.tsx` selection and composition flow consume the adapter without changing the renderer, `QuotaProviderAdapter`, legacy home plugin, or generic polling architecture.

**Tech Stack:** TypeScript 6, SolidJS reactive primitives, native `fetch`/`AbortController`, Node test runner, esbuild test bundles, and the existing three-artifact ESM build/deployment scripts.

## Global Constraints

- The first deliverable is a sanitized, minimal page-contract fixture. Do not start production parser or transport code until its fixture-only contract test passes.
- Only the purpose-built Task 1 sanitizer may read ignored `.opencode/tui.json` credentials programmatically; the credential owner may edit them directly for Task 10 live validation. Credentials, raw HTML, request headers, real identifiers, and real usage/reset values must never be printed, logged, reported, persisted, committed, or included in an exception message.
- The sanitizer fetches the authenticated page once and the unauthenticated redirect once, accepts only exact markers shaped `<name>:$R[<digits>]=` followed by a bounded flat object, replaces hydration indexes and observed numeric data with synthetic values in memory, writes only allowlist-validated minimal fixtures, and self-deletes from the approved temporary directory. Never open, inspect, or reuse the existing unsafe full-HTML temporary capture.
- Exact quota data comes only from exactly one bounded Solid hydration assignment in unambiguous JavaScript code context for each of `rollingUsage`, `weeklyUsage`, and `monthlyUsage`: `rollingUsage:$R[digits]=`, `weeklyUsage:$R[digits]=`, and `monthlyUsage:$R[digits]=`. Each assignment must use the observed flat `{status:"ok",resetInSec:<number>,usagePercent:<number>}` shape; the parser validates and discards `status`. Visible text, localized labels, HTML comments/attributes/raw-text, JavaScript strings/templates/comments, local cost estimates, and broad object searches are forbidden.
- Safe reference evidence is limited to `/Users/aam/.graphify/repos/ridho9/opencode-go-usage/index.js:137-149`, which confirms the three marker shapes. Do not add that external file to this repository, copy its permissive `[^}]+` captures, or copy its object-literal-to-JSON conversion.
- The request is exactly `GET https://opencode.ai/workspace/<encodeURIComponent(workspaceId)>/go` with `Accept: text/html`, `Cookie: auth=<workspaceToken>`, `redirect: "manual"`, no body, and a 20,000ms timeout.
- The origin is a source constant. No option, redirect, response, fixture, or dependency injection point may alter `https://opencode.ai` or forward the cookie to another origin.
- The parser receives only an HTML string and receipt timestamp. It uses one deterministic HTML lexical pass over at most 1,000,000 UTF-16 code units and one deterministic JavaScript lexical pass per disjoint actual script body. It never receives configuration and never uses `eval`, `Function`, DOM/script execution, an HTML or JavaScript parser dependency, JSONification of object literals, general object conversion, visible-text scraping, recursive property search, `.*`, or broad `[^}]+` capture.
- The HTML pass recognizes tags only outside comments, honors single/double attribute quotes, skips script-like text in `textarea`, `title`, `style`, `xmp`, `iframe`, `noembed`, and `noframes`, and emits only actual `script` bodies. The JavaScript pass tracks code, single/double strings, no-substitution templates, line comments, and block comments with escapes. Markers count only in code. A shared bounded `hasMarkerCandidate(source, start, end)` helper may use `indexOf` at most once per fixed `${name}:$R` prefix, but no broad regex or unrestricted raw-HTML search.
- On template `${`, reject only when the remaining current script body contains a marker candidate; otherwise stop that body and retain markers already found. On a code-state `/` other than `//` or `/*`, reject only when the remainder through the next CR, LF, or body end contains a marker candidate; otherwise skip that line remainder and resume at the next line. Unrelated regex, division, and template-expression scripts without marker candidates must not invalidate valid markers in another script body.
- Reject the complete response for missing, malformed, or duplicate code-state markers, malformed/unclosed relevant HTML or JavaScript lexical constructs, input over 1,000,000 UTF-16 code units, a record capture over 4,096 code units, additional fields outside the literal allowlist, nested-object/prototype/comment/string tricks, non-finite numbers, `usagePercent` outside `0..100`, negative `resetInSec`, or a non-finite computed reset epoch. Suffix checks walk real remaining body whitespace and require an actual delimiter or actual script-body end. Never return a partial snapshot.
- `quota.opencodego.workspaceId` must match `^wrk_[A-Za-z0-9]+$`. `quota.opencodego.workspaceToken` must be non-empty after trimming and contain neither CR nor LF.
- Error values and diagnostics are static classifications only. They never include URL strings, response bodies, headers, status text, caught exceptions, workspace IDs, tokens, or derived credential fragments.
- Preserve the existing 10,000ms default polling interval, normalized custom interval, 1,000ms countdown tick, 600,000ms stale horizon, provider selection refresh, request serialization, and reset-boundary behavior. Do not add exhausted backoff or a generic polling refactor.
- Preserve `QuotaProviderAdapter`, `PanelModel`, `PanelRenderer`, `tui/home.tsx`, max-width 37 behavior, and the existing three deployed artifacts. OpenCode Go is instantiated only by the quota sidebar because the legacy home entry has no safe native-options path.
- Provider panel data always stores remaining percentage. Existing composition performs used-mode conversion and evaluates progress colors from remaining values.
- Use only the synthetic credential values `wrk_TESTWORKSPACE` and `TOKEN_TEST_ONLY_DO_NOT_USE` in tracked files.
- Keep host-owned `solid-js`, `@opentui/*`, `@opencode-ai/plugin`, SDK modules, and runtime built-ins external.
- The pre-existing deletions `task-7-report.md`, `task-9-report.md`, and `task-10-report.md` are unrelated. Never restore, edit, stage, or commit them.
- Every commit uses explicit path-based `git add`; never use `git add .` or `git add -A`. Run `git status --short` before each commit and stage only files named by that task.

## File Structure

- Create `tests/fixtures/opencode-go/request-manifest.json`: synthetic fixed request, timeout, response-status, content-type, and named-record contract.
- Create `tests/fixtures/opencode-go/success.html`: minimal sanitized HTML containing only the observed bounded Solid assignment shapes with synthetic values.
- Create `tests/fixtures/opencode-go/login-redirect.json`: synthetic observed manual login redirect metadata.
- Create `tests/provider-opencode-go-contract.test.mjs`: fixture-only hard gate that imports no production code.
- Create `tests/provider-opencode-go.test.mjs`: configuration, security, parser, transport, mapper, polling, reset, stale, and disposal tests, added in the same GREEN task as each minimal implementation.
- Create `tui/providers/opencode-go.ts`: OpenCode Go options, transport, hydration extraction, semantic mapping, and adapter lifecycle.
- Modify `tests/compile-presentation.mjs`: compile `.tmp-test/provider-opencode-go.mjs` with browser-compatible conditions.
- Modify `tui/providers/types.ts`: add `OpenCodeGoHomeQuotaSummary` to `HomeQuotaSummary`.
- Modify `shared/opencode-tools-shared.ts`: export the OpenCode Go constructor, helpers, and semantic types.
- Modify `tui/quota.tsx`: normalize nested native options, construct the adapter, and map both runtime aliases.
- Modify `tests/quota-composition.test.mjs`: cover native options, aliases, active refresh, provider retention, summaries, modes, colors, and ordering.
- Modify `tests/shared-boundary.test.mjs`: enforce shared ownership of OpenCode Go computation.
- Modify `tests/plugin-build.test.mjs`: assert the third provider is bundled into the shared artifact while artifact names remain unchanged.
- Modify `tests/plugin-deploy.test.mjs`: verify nested OpenCode Go options survive local/global deployment without adding artifacts.
- Modify `tsconfig.json`: typecheck `tui/providers/opencode-go.ts`.
- Modify `README.md`: document local plaintext auth-cookie configuration, supported windows, rotation, and hydration-contract limits.

## OpenSpec Coverage

| OpenSpec task | Plan task | Reviewable deliverable |
| --- | ---: | --- |
| 1.1 | 1 | Sanitized HTML request/hydration/authentication contract and fixture-only gate |
| 1.2 | 2 | Native-option and credential-safety tests paired with immutable configuration normalization |
| 2.1 | 2 | Native `quota.opencodego` normalization and quota-option wiring |
| 1.3 | 3 (partial), 4 (complete) | Transport/bounded-parser coverage first, then mapper coverage |
| 2.2 | 3 | Fixed authenticated page request and strict atomic hydration parser |
| 2.3 | 4 | 5H/7D/1M panel and compact summary mapping |
| 1.4 | 5 (partial), 6 (complete) | Lifecycle coverage first, then construction, aliases, active refresh, and ordering integration |
| 2.4 | 5 | Shared-interval lifecycle with serialized and disposal-safe refreshes |
| 3.1 | 6 | Shared facade/types, quota-only construction, runtime aliases, and build boundary |
| 3.2 | 7 | Three-provider composition, max-width, and deployment-option regressions |
| 3.3 | 8 | Local secret and undocumented hydration-contract documentation |
| 4.1 | 9 | Focused, typecheck, complete-suite, build, and deployment gates |
| 4.2 | 10 | Local deployment, artifact parity, and live secret-safe validation |

---

### Task 1: Sanitize And Freeze The Authenticated Page Contract

**OpenSpec:** 1.1

**Files:**
- Create: `tests/fixtures/opencode-go/request-manifest.json`
- Create: `tests/fixtures/opencode-go/success.html`
- Create: `tests/fixtures/opencode-go/login-redirect.json`
- Create: `tests/provider-opencode-go-contract.test.mjs`

**Interfaces:**
- Consumes: ignored local `quota.opencodego` credentials through a temporary in-memory sanitizer and the live page response fetched with manual redirects; it never consumes the existing unsafe full-HTML capture.
- Produces: a synthetic request manifest and minimal HTML fixture that Tasks 3 and 6 treat as the only page-contract authority.
- Produces fixture values: rolling `{ status: "ok", resetInSec: 1800, usagePercent: 12.5 }`, weekly `{ status: "ok", resetInSec: 172800, usagePercent: 34 }`, monthly `{ status: "ok", resetInSec: 1209600, usagePercent: 56.75 }`.

- [x] **Step 1: Write the fixture-only contract test before creating fixtures**

Create `tests/provider-opencode-go-contract.test.mjs`. This decoder is intentionally independent of production code. Based only on the marker evidence in `/Users/aam/.graphify/repos/ridho9/opencode-go-usage/index.js:137-149`, it accepts exactly three lines shaped `<name>:$R[<synthetic index>]=<restricted flat object>` inside one minimal script. It requires deterministic indexes `0`, `1`, and `2`, exact-one semantics, and rolling/weekly/monthly order; it does not import or reproduce the reference parser.

```javascript
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const fixture = (name) => readFileSync(`tests/fixtures/opencode-go/${name}`, "utf8")
const manifest = () => JSON.parse(fixture("request-manifest.json"))
const html = () => fixture("success.html")

const EXPECTED = {
  rollingUsage: { usagePercent: 12.5, resetInSec: 1800 },
  weeklyUsage: { usagePercent: 34, resetInSec: 172800 },
  monthlyUsage: { usagePercent: 56.75, resetInSec: 1209600 },
}

const RECORDS = [
  { name: "rollingUsage", syntheticIndex: 0 },
  { name: "weeklyUsage", syntheticIndex: 1 },
  { name: "monthlyUsage", syntheticIndex: 2 },
]
const NUMBER_SOURCE = String.raw`-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?`

function assignmentPattern(name, syntheticIndex) {
  return new RegExp(
    String.raw`^${name}:\$R\[${syntheticIndex}\]=\{status:"ok",resetInSec:(?<reset>${NUMBER_SOURCE}),usagePercent:(?<usage>${NUMBER_SOURCE})\}$`,
    "u",
  )
}

function fixtureLines(source) {
  const open = "<script>\n"
  const close = "\n</script>\n"
  assert.equal(source.startsWith(open), true)
  assert.equal(source.endsWith(close), true)
  const lines = source.slice(open.length, -close.length).split("\n")
  assert.equal(lines.length, 3)
  return lines
}

function decodeSyntheticFixture(source) {
  assert.ok(source.length <= 1_000_000)
  const lines = fixtureLines(source)
  const decoded = {}

  for (const [index, { name, syntheticIndex }] of RECORDS.entries()) {
    const matches = lines
      .map((line, lineIndex) => ({ lineIndex, match: assignmentPattern(name, syntheticIndex).exec(line) }))
      .filter((candidate) => candidate.match)
    assert.equal(matches.length, 1, `${name} assignment count`)
    assert.equal(matches[0].lineIndex, index, `${name} assignment order`)
    assert.ok(matches[0].match[0].length <= 4_096)
    const usagePercent = Number(matches[0].match.groups.usage)
    const resetInSec = Number(matches[0].match.groups.reset)
    assert.deepEqual({ usagePercent, resetInSec }, EXPECTED[name])
    decoded[name] = { usagePercent, resetInSec }
  }

  return decoded
}

function wrap(lines) {
  return `<script>\n${lines.join("\n")}\n</script>\n`
}

test("OpenCode Go contract records the fixed authenticated page request", () => {
  assert.deepEqual(manifest(), {
    request: {
      method: "GET",
      url: "https://opencode.ai/workspace/wrk_TESTWORKSPACE/go",
      headers: { Accept: "text/html", Cookie: "auth=TOKEN_TEST_ONLY_DO_NOT_USE" },
      redirect: "manual",
      timeoutMs: 20000,
    },
    success: {
      status: 200,
      contentType: "text/html; charset=utf-8",
      records: ["rollingUsage", "weeklyUsage", "monthlyUsage"],
    },
    authenticationStatuses: [401, 403],
    transientStatuses: [408, 429, 500, 503],
  })
})

test("OpenCode Go contract contains one bounded assignment for every usage record", () => {
  assert.deepEqual(decodeSyntheticFixture(html()), EXPECTED)
})

test("OpenCode Go contract grammar rejects duplicate malformed and trick assignments", () => {
  const lines = fixtureLines(html())
  const replaceUsage = (replacement) => lines[0].replace(/(usagePercent:)12\.5/, `$1${replacement}`)
  const invalid = [
    wrap([lines[0], lines[0], lines[1], lines[2]]),
    wrap([lines[1], lines[0], lines[2]]),
    wrap([lines[0].replace("={", "=/* hidden */{"), lines[1], lines[2]]),
    wrap([lines[0].replace("={", "={/* hidden */"), lines[1], lines[2]]),
    wrap([`"${lines[0]}"`, lines[1], lines[2]]),
    wrap([replaceUsage("{ value: 12.5 }"), lines[1], lines[2]]),
    wrap([replaceUsage("\"12.5\""), lines[1], lines[2]]),
    wrap([lines[0].replace('status:"ok"', 'status:"other"'), lines[1], lines[2]]),
    wrap([lines[0].replace("}", ",otherField:1}"), lines[1], lines[2]]),
    wrap([lines[0].replace("}", ",__proto__:null}"), lines[1], lines[2]]),
    wrap([lines[0].replace("$R[0]", "$R[x]"), lines[1], lines[2]]),
    wrap([lines[0].replace("$R[0]", "$R[-1]"), lines[1], lines[2]]),
    wrap([lines[0].replace("$R[0]", "$R[\"0\"]"), lines[1], lines[2]]),
    wrap([lines[0].replace("$R[0]", "$R[ 0 ]"), lines[1], lines[2]]),
    wrap([lines[0].replace("$R[0]", "$R[]"), lines[1], lines[2]]),
    wrap([lines[0].replace("$R[0]", "$R [0]"), lines[1], lines[2]]),
    wrap([lines[0].replace("$R[0]", "$R[9]"), lines[1], lines[2]]),
    `<div>${lines[0]}</div>\n`,
  ]
  for (const source of invalid) assert.throws(() => decodeSyntheticFixture(source))
})

test("OpenCode Go contract contains only synthetic identity and usage data", () => {
  const committed = `${fixture("request-manifest.json")}\n${html()}\n${fixture("login-redirect.json")}`
  assert.doesNotMatch(committed, /(?:@|bearer|set-cookie|authorization)/i)
  const workspaces = [...committed.matchAll(/wrk_[A-Za-z0-9]+/g)].map(([value]) => value)
  assert.ok(workspaces.length > 0)
  assert.ok(workspaces.every((value) => value === "wrk_TESTWORKSPACE"))
  assert.equal(committed.includes("TOKEN_TEST_ONLY_DO_NOT_USE"), true)
})

test("OpenCode Go contract records manual same-origin login redirection", () => {
  assert.deepEqual(JSON.parse(fixture("login-redirect.json")), {
    status: 302,
    location: "/auth/authorize",
  })
})
```

- [x] **Step 2: Run the contract test to verify it fails**

Run: `node --test tests/provider-opencode-go-contract.test.mjs`

Expected: FAIL with `ENOENT` for `tests/fixtures/opencode-go/request-manifest.json`; no production module is imported.

- [x] **Step 3: Create the temporary one-shot sanitizer outside the repository**

First verify the approved temporary parent and ignored config path without reading the config:

Run: `test -d "/var/folders/vh/srpy49dj1cld13b3wq7hjnw80000gn/T/opencode" && git check-ignore -q ".opencode/tui.json"`

Expected: exit 0 and no output.

Create `/var/folders/vh/srpy49dj1cld13b3wq7hjnw80000gn/T/opencode/opencode-go-contract-sanitize.mjs` in an editor outside the repository with the implementation below. The script has no logging calls, catches every failure as a static exit code, holds credentials/raw HTML only in memory, writes only synthetic output after every check passes, and deletes itself in `finally`:

```javascript
import { mkdir, readFile, rm, writeFile } from "node:fs/promises"
import { resolve } from "node:path"
import { fileURLToPath } from "node:url"

const SELF = fileURLToPath(import.meta.url)
const ROOT = process.cwd()
const FIXTURES = resolve(ROOT, "tests/fixtures/opencode-go")
const NUMBER = String.raw`-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?`
const RECORDS = [
  { name: "rollingUsage", syntheticIndex: 0, syntheticUsage: 12.5, syntheticReset: 1800 },
  { name: "weeklyUsage", syntheticIndex: 1, syntheticUsage: 34, syntheticReset: 172800 },
  { name: "monthlyUsage", syntheticIndex: 2, syntheticUsage: 56.75, syntheticReset: 1209600 },
]
const OBJECT_PATTERN = new RegExp(
  String.raw`^\{status:"ok",resetInSec:(?<reset>${NUMBER}),usagePercent:(?<usage>${NUMBER})\}$`,
  "u",
)

function reject() {
  throw new Error("contract rejected")
}

function scriptBodies(html) {
  const lower = html.toLowerCase()
  const bodies = []
  let cursor = 0
  while (cursor < html.length) {
    const open = lower.indexOf("<script", cursor)
    if (open < 0) break
    const afterName = lower[open + 7]
    if (afterName !== ">" && !/\s/u.test(afterName || "")) {
      cursor = open + 7
      continue
    }
    const tagEnd = lower.indexOf(">", open + 7)
    const close = tagEnd < 0 ? -1 : lower.indexOf("</script>", tagEnd + 1)
    if (tagEnd < 0 || close < 0) reject()
    bodies.push(html.slice(tagEnd + 1, close))
    cursor = close + 9
  }
  return bodies
}

function countLiteral(source, value) {
  let count = 0
  let cursor = 0
  while (true) {
    const index = source.indexOf(value, cursor)
    if (index < 0) return count
    count += 1
    cursor = index + value.length
  }
}

function recordFromMarker(body, marker) {
  const objectStart = marker.index + marker[0].length
  const bounded = body.slice(objectStart, objectStart + 4_097)
  if (!bounded.startsWith("{")) reject()
  const objectEnd = bounded.indexOf("}")
  if (objectEnd < 0 || objectEnd + 1 > 4_096) reject()
  const objectSource = bounded.slice(0, objectEnd + 1)
  const suffix = body.slice(objectStart + objectEnd + 1, objectStart + objectEnd + 34)
  if (!/^[\t ]*(?:[,;}\r\n]|$)/u.test(suffix)) reject()
  const object = OBJECT_PATTERN.exec(objectSource)
  if (!object) reject()
  return { usage: Number(object.groups.usage), reset: Number(object.groups.reset) }
}

function localCredentials(config) {
  const entries = Array.isArray(config.plugin) ? config.plugin : []
  const entry = entries.find((candidate) => Array.isArray(candidate)
    && candidate[1]?.quota?.opencodego)
  const value = entry?.[1]?.quota?.opencodego
  const workspaceId = typeof value?.workspaceId === "string" ? value.workspaceId.trim() : ""
  const workspaceToken = typeof value?.workspaceToken === "string" ? value.workspaceToken.trim() : ""
  if (!/^wrk_[A-Za-z0-9]+$/.test(workspaceId) || !workspaceToken || /[\r\n]/.test(workspaceToken)) reject()
  return { workspaceId, workspaceToken }
}

function sanitizedAssignments(raw) {
  if (raw.length > 1_000_000) reject()
  const bodies = scriptBodies(raw)
  const lines = RECORDS.map(({ name, syntheticIndex, syntheticUsage, syntheticReset }) => {
    const markerPattern = () => new RegExp(String.raw`${name}:\$R\[(?<index>\d+)\]=`, "gu")
    const rawMarkers = [...raw.matchAll(markerPattern())]
    const markers = bodies.flatMap((body) => [...body.matchAll(markerPattern())].map((marker) => ({ body, marker })))
    if (countLiteral(raw, `${name}:$R`) !== 1 || rawMarkers.length !== 1 || markers.length !== 1) reject()
    const { usage, reset } = recordFromMarker(markers[0].body, markers[0].marker)
    if (!Number.isFinite(usage) || usage < 0 || usage > 100 || !Number.isFinite(reset) || reset < 0) reject()
    return `${name}:$R[${syntheticIndex}]={status:"ok",resetInSec:${syntheticReset},usagePercent:${syntheticUsage}}`
  })
  return `<script>\n${lines.join("\n")}\n</script>\n`
}

async function main() {
  const config = JSON.parse(await readFile(resolve(ROOT, ".opencode/tui.json"), "utf8"))
  const { workspaceId, workspaceToken } = localCredentials(config)
  const url = `https://opencode.ai/workspace/${encodeURIComponent(workspaceId)}/go`
  const response = await fetch(url, {
    method: "GET",
    headers: { Accept: "text/html", Cookie: `auth=${workspaceToken}` },
    redirect: "manual",
    signal: AbortSignal.timeout(20_000),
  })
  if (response.status !== 200 || !/^text\/html(?:\s*;|$)/i.test(response.headers.get("content-type") || "")) reject()
  const success = sanitizedAssignments(await response.text())

  const unauthenticated = await fetch(url, {
    method: "GET",
    headers: { Accept: "text/html" },
    redirect: "manual",
    signal: AbortSignal.timeout(20_000),
  })
  const redirect = new URL(unauthenticated.headers.get("location") || "", "https://opencode.ai")
  if (unauthenticated.status !== 302 || redirect.origin !== "https://opencode.ai" || redirect.pathname !== "/auth/authorize") reject()

  const manifest = `${JSON.stringify({
    request: {
      method: "GET",
      url: "https://opencode.ai/workspace/wrk_TESTWORKSPACE/go",
      headers: { Accept: "text/html", Cookie: "auth=TOKEN_TEST_ONLY_DO_NOT_USE" },
      redirect: "manual",
      timeoutMs: 20000,
    },
    success: {
      status: 200,
      contentType: "text/html; charset=utf-8",
      records: RECORDS.map(({ name }) => name),
    },
    authenticationStatuses: [401, 403],
    transientStatuses: [408, 429, 500, 503],
  }, null, 2)}\n`
  const login = `${JSON.stringify({ status: 302, location: "/auth/authorize" }, null, 2)}\n`
  const outputs = `${manifest}\n${success}\n${login}`
  if (outputs.includes(workspaceId) || outputs.includes(workspaceToken)) reject()
  const expectedSuccess = `<script>\n${RECORDS.map(({ name, syntheticIndex, syntheticUsage, syntheticReset }) =>
    `${name}:$R[${syntheticIndex}]={status:"ok",resetInSec:${syntheticReset},usagePercent:${syntheticUsage}}`).join("\n")}\n</script>\n`
  if (success !== expectedSuccess) reject()

  await mkdir(FIXTURES, { recursive: true })
  await Promise.all([
    writeFile(resolve(FIXTURES, "request-manifest.json"), manifest, { flag: "wx" }),
    writeFile(resolve(FIXTURES, "success.html"), success, { flag: "wx" }),
    writeFile(resolve(FIXTURES, "login-redirect.json"), login, { flag: "wx" }),
  ])
}

try {
  await main()
} catch {
  process.exitCode = 1
} finally {
  await rm(SELF, { force: true })
}
```

Do not add debug output if the sanitizer exits 1. Fix only static code/fixture-shape assumptions after reviewing the approved design; never print the config, request, response, headers, caught error, or unsafe capture.

- [x] **Step 4: Run the sanitizer and prove the temporary script self-deleted**

Run: `node "/var/folders/vh/srpy49dj1cld13b3wq7hjnw80000gn/T/opencode/opencode-go-contract-sanitize.mjs" && test ! -e "/var/folders/vh/srpy49dj1cld13b3wq7hjnw80000gn/T/opencode/opencode-go-contract-sanitize.mjs" || (rm -f "/var/folders/vh/srpy49dj1cld13b3wq7hjnw80000gn/T/opencode/opencode-go-contract-sanitize.mjs" && exit 1)`

Expected: exit 0 and no output. Only the three minimal synthetic fixture files are created; no raw page, request, header, credential, real identifier, or real usage/reset value is written anywhere.

- [x] **Step 5: Verify the synthetic manifest and redirect fixture shapes**

The generated `request-manifest.json` must contain exactly this synthetic request and these static classifications:

```json
{
  "request": {
    "method": "GET",
    "url": "https://opencode.ai/workspace/wrk_TESTWORKSPACE/go",
    "headers": {
      "Accept": "text/html",
      "Cookie": "auth=TOKEN_TEST_ONLY_DO_NOT_USE"
    },
    "redirect": "manual",
    "timeoutMs": 20000
  },
  "success": {
    "status": 200,
    "contentType": "text/html; charset=utf-8",
    "records": ["rollingUsage", "weeklyUsage", "monthlyUsage"]
  },
  "authenticationStatuses": [401, 403],
  "transientStatuses": [408, 429, 500, 503]
}
```

The generated `success.html` must contain one minimal `<script>` wrapper and exactly these three assignment shapes in rolling/weekly/monthly order:

```html
<script>
rollingUsage:$R[0]={status:"ok",resetInSec:1800,usagePercent:12.5}
weeklyUsage:$R[1]={status:"ok",resetInSec:172800,usagePercent:34}
monthlyUsage:$R[2]={status:"ok",resetInSec:1209600,usagePercent:56.75}
</script>
```

The sanitizer preserves the confirmed `<name>:$R[digits]=` structure, normalizes hydration indexes to `0`, `1`, and `2`, requires and preserves only the static `status:"ok"` field, and replaces both numeric fields with the synthetic values from **Interfaces**. The allowlist contains exactly unquoted `status`, `resetInSec`, and `usagePercent` in that order with no whitespace or trailing comma. If the live flat object changes, the sanitizer blocks; broaden it only by adding literal field names/types proven safe from the observed contract, never a wildcard, broad brace capture, or general object parser. No unrelated script, visible element, raw identifier, string value, or field survives.

The generated `login-redirect.json` must contain only the observed synthetic status and same-origin pathname:

```json
{
  "status": 302,
  "location": "/auth/authorize"
}
```

Do not manually edit `success.html`; it must be the sanitizer's assignment-only synthetic output. If the sanitizer cannot validate exactly one assignment for every record without broadening the restricted grammar, stop with `BLOCKED: bounded OpenCode Go hydration assignments could not be sanitized` and do not continue to Task 2.

- [x] **Step 6: Run the hard gate and inspect only synthetic file metadata**

Run: `node --test tests/provider-opencode-go-contract.test.mjs`

Expected: PASS with 5 tests and 0 failures.

Run: `git diff --check -- tests/fixtures/opencode-go tests/provider-opencode-go-contract.test.mjs && git status --short`

Expected: the test and three synthetic fixtures are new; the only unrelated entries are the three pre-existing deleted reports. Do not print `success.html` or any local configuration to the terminal.

- [x] **Step 7: Commit the contract gate atomically**

```bash
git status --short &&
git add tests/fixtures/opencode-go/request-manifest.json tests/fixtures/opencode-go/success.html tests/fixtures/opencode-go/login-redirect.json tests/provider-opencode-go-contract.test.mjs &&
git commit -m "test(quota): capture OpenCode Go page contract"
```

### Task 2: Configuration TDD

**OpenSpec:** 1.2 + 2.1

**Files:**
- Create: `tests/provider-opencode-go.test.mjs`
- Create: `tui/providers/opencode-go.ts`
- Modify: `tests/compile-presentation.mjs:4-20`
- Modify: `tests/quota-composition.test.mjs`
- Modify: `shared/opencode-tools-shared.ts`
- Modify: `tui/quota.tsx:7-12,28-48,57-62,109-124`
- Modify: `tsconfig.json:21-31`

**Interfaces:**
- Consumes: Task 1 synthetic sentinels and `normalizeQuotaOptions(value?: TuiPluginOptions)`.
- Produces: `OpenCodeGoOptions`, immutable `OpenCodeGoConfig`, and `normalizeOpenCodeGoConfig(value: unknown): OpenCodeGoConfig | null`.
- Produces: `QuotaPluginOptions.quota?.opencodego?: OpenCodeGoOptions` and `NormalizedQuotaOptions.openCodeGo: OpenCodeGoConfig | null`.
- Does not produce or import `createOpenCodeGoProvider`; that constructor first exists in Task 5 and quota construction first consumes it in Task 6.

- [x] **Step 1: Add the compile entry and focused failing tests**

Add `provider-opencode-go` to the cleanup array in `tests/compile-presentation.mjs`, then add this tuple immediately after `provider-openai`:

```javascript
["tui/providers/opencode-go.ts", ".tmp-test/provider-opencode-go.mjs", ["browser"]],
```

Create `tests/provider-opencode-go.test.mjs` exactly with the configuration boundary tests below. These tests import only the normalizer; they do not name an adapter constructor.

```javascript
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const providerModule = await import("../.tmp-test/provider-opencode-go.mjs")
const { normalizeOpenCodeGoConfig } = providerModule
const sentinel = {
  workspaceId: "wrk_TESTWORKSPACE",
  workspaceToken: "TOKEN_TEST_ONLY_DO_NOT_USE",
}

test("OpenCode Go options normalize valid credentials without diagnostics", () => {
  const diagnostics = []
  const original = console.error
  console.error = (...args) => diagnostics.push(args)
  try {
    const config = normalizeOpenCodeGoConfig({
      workspaceId: ` ${sentinel.workspaceId} `,
      workspaceToken: ` ${sentinel.workspaceToken} `,
    })
    assert.deepEqual(config, sentinel)
    assert.equal(Object.isFrozen(config), true)
    assert.deepEqual(Object.keys(config), ["workspaceId", "workspaceToken"])
    assert.deepEqual(diagnostics, [])
  } finally {
    console.error = original
  }
})

test("OpenCode Go options reject invalid credentials without secret-derived output", () => {
  const diagnostics = []
  const errors = []
  const original = console.error
  console.error = (...args) => diagnostics.push(args)
  try {
    for (const value of [
      undefined,
      null,
      [],
      {},
      { workspaceId: "workspace", workspaceToken: sentinel.workspaceToken },
      { workspaceId: sentinel.workspaceId, workspaceToken: "" },
      { workspaceId: sentinel.workspaceId, workspaceToken: "   " },
      { workspaceId: sentinel.workspaceId, workspaceToken: "x\rX-Test: leaked" },
      { workspaceId: sentinel.workspaceId, workspaceToken: "x\nX-Test: leaked" },
    ]) {
      try {
        assert.equal(normalizeOpenCodeGoConfig(value), null)
      } catch (error) {
        errors.push(error instanceof Error ? error.message : String(error))
      }
    }
  } finally {
    console.error = original
  }
  const serialized = JSON.stringify({ diagnostics, errors })
  assert.deepEqual(errors, [])
  for (const secret of Object.values(sentinel)) assert.equal(serialized.includes(secret), false)
})

test("OpenCode Go options expose no redirectable transport control", () => {
  const source = readFileSync("tui/providers/opencode-go.ts", "utf8")
  for (const forbidden of ["origin?:", "url?:", "headers?:", "cookie?:"]) {
    assert.equal(source.includes(forbidden), false)
  }
})
```

In `tests/quota-composition.test.mjs`, add the same `sentinel` object and this test beside the existing option-normalization tests:

```javascript
test("OpenCode Go options normalize through native quota options", () => {
  assert.equal(normalizeQuotaOptions().openCodeGo, null)
  assert.deepEqual(normalizeQuotaOptions({ quota: { opencodego: sentinel } }).openCodeGo, sentinel)
  assert.equal(normalizeQuotaOptions({
    quota: { opencodego: { workspaceId: "bad", workspaceToken: "x" } },
  }).openCodeGo, null)
  assert.equal(normalizeQuotaOptions({ openCodeGo: sentinel }).openCodeGo, null)
})
```

- [x] **Step 2: Run the exact configuration RED gate**

Run: `node tests/compile-presentation.mjs`

Expected: FAIL from esbuild with `Could not resolve "tui/providers/opencode-go.ts"`; no test or broken build is committed.

- [x] **Step 3: Add the minimal immutable configuration module**

Create `tui/providers/opencode-go.ts` with exactly this initial API:

```typescript
export type OpenCodeGoOptions = {
  workspaceId?: string
  workspaceToken?: string
}

export type OpenCodeGoConfig = Readonly<{
  workspaceId: string
  workspaceToken: string
}>

const WORKSPACE_ID = /^wrk_[A-Za-z0-9]+$/

export function normalizeOpenCodeGoConfig(value: unknown): OpenCodeGoConfig | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  const input = value as OpenCodeGoOptions
  const workspaceId = typeof input.workspaceId === "string" ? input.workspaceId.trim() : ""
  const workspaceToken = typeof input.workspaceToken === "string" ? input.workspaceToken.trim() : ""
  if (!WORKSPACE_ID.test(workspaceId) || !workspaceToken || /[\r\n]/u.test(workspaceToken)) return null
  return Object.freeze({ workspaceId, workspaceToken })
}
```

Do not return validation reasons, rejected values, lengths, hashes, prefixes, or suffixes.

- [x] **Step 4: Wire only the normalized native option**

Add this narrow export to `shared/opencode-tools-shared.ts`; Task 6 expands the same facade with the constructor and all semantic types:

```typescript
export { normalizeOpenCodeGoConfig } from "../tui/providers/opencode-go.js";
export type { OpenCodeGoConfig, OpenCodeGoOptions } from "../tui/providers/opencode-go.js";
```

Import those three names from the shared facade in `tui/quota.tsx`, then use these exact option types:

```typescript
export type QuotaPluginOptions = {
  refreshIntervalSeconds?: number
  progressColors?: ProgressColorOptions
  otherProviders?: Pick<QuotaCompositionOptions, "percentageMode" | "sortDirection">
  quota?: {
    opencodego?: OpenCodeGoOptions
  }
}

export type NormalizedQuotaOptions = NormalizedCompositionOptions & {
  refreshIntervalMs: number
  openCodeGo: OpenCodeGoConfig | null
}
```

Add `openCodeGo: null` to `DEFAULT_OPTIONS`, and add exactly this property to the object returned by `normalizeQuotaOptions`:

```typescript
openCodeGo: normalizeOpenCodeGoConfig(input.quota?.opencodego),
```

Add `openCodeGo: null` to each existing expected object in `normalizes native polling and progress color defaults` and `normalizes custom thresholds and rejects invalid native options`; this keeps all pre-existing normalization assertions GREEN after the return type gains the field.

Add `"tui/providers/opencode-go.ts"` after `"tui/providers/openai.ts"` in `tsconfig.json` so the new interface is typechecked before later tasks import it.

- [x] **Step 5: Run the exact configuration GREEN gates**

Run: `node tests/compile-presentation.mjs && node --test --test-name-pattern="OpenCode Go options" tests/provider-opencode-go.test.mjs tests/quota-composition.test.mjs`

Expected: PASS for every matching configuration/security test with 0 failures; no adapter constructor is imported.

Run: `npm run typecheck && node --test tests/shared-boundary.test.mjs`

Expected: PASS with no TypeScript diagnostics and no loadable entry bypassing the shared facade.

- [x] **Step 6: Commit the GREEN configuration unit atomically**

```bash
git status --short &&
git add tests/compile-presentation.mjs tests/provider-opencode-go.test.mjs tests/quota-composition.test.mjs tui/providers/opencode-go.ts shared/opencode-tools-shared.ts tui/quota.tsx tsconfig.json &&
git commit -m "feat(quota): normalize OpenCode Go options"
```

### Task 3: Page Transport And Bounded Parser TDD

**OpenSpec:** 1.3 (partial) + 2.2

**Files:**
- Modify: `tests/provider-opencode-go.test.mjs`
- Modify: `tui/providers/opencode-go.ts`

**Interfaces:**
- Consumes: Task 1 `success.html`, `request-manifest.json`, `login-redirect.json`, and Task 2 `OpenCodeGoConfig`.
- Produces: `OpenCodeGoWindow`, `OpenCodeGoQuotaData`, `OpenCodeGoFetchResult`, `OpenCodeGoFetchDependencies`, `parseOpenCodeGoHydration(html: string, receivedAt: number): OpenCodeGoQuotaData | null`, and `fetchOpenCodeGoQuota(config, signal, dependencies): Promise<OpenCodeGoFetchResult>`.
- Task 4 is the only owner of panel mapper tests and implementation.
- Starting point: commit `29a102d` contains the rejected Task 3 transport and parser. Preserve its exported types, exact object grammar, numeric validation, atomic output mapping, and fixed transport. Replace only parser scanning/context helpers and parser internals described below.

- [x] **Step 1: Append lexical-context and exact-boundary parser regressions**

Append the following helpers and nine tests to `tests/provider-opencode-go.test.mjs` after the two existing parser tests and before `const config = ...`. Do not rewrite or delete the existing Task 3 tests except to remove the stale invalid-matrix entry that expected a valid script plus a visible duplicate to reject. These cases isolate each review bypass, prove that hidden candidates do not affect code-state uniqueness, scope ambiguity to marker-bearing remainders, and pin both meaningful size boundaries:

```javascript
const fixtureScript = fixture("success.html").trimEnd()
const recordLines = fixtureScript
  .slice("<script>\n".length, -"\n</script>".length)
  .split("\n")
const [rollingRecord, weeklyRecord, monthlyRecord] = recordLines
const script = (...lines) => `<script>\n${lines.join("\n")}\n</script>`
const rawTextNames = ["textarea", "title", "style", "xmp", "iframe", "noembed", "noframes"]
const rollingObject = rollingRecord.slice(rollingRecord.indexOf("=") + 1)

test("OpenCode Go parser ignores unique records in visible comment attribute and raw-text HTML contexts", () => {
  const hiddenRollingContexts = [
    `<div>${rollingRecord};</div>`,
    `<!-- <script>${rollingRecord};</script> -->`,
    `<div data-record='<script>${rollingRecord};</script>'></div>`,
    ...rawTextNames.map((name) => `<${name}><script>${rollingRecord};</script></${name}>`),
  ]
  for (const hidden of hiddenRollingContexts) {
    assert.equal(parseOpenCodeGoHydration(`${hidden}\n${script(weeklyRecord, monthlyRecord)}`, now), null)
  }
})

test("OpenCode Go parser accepts actual script records while HTML ignored contexts contain duplicates", () => {
  const duplicateRecords = recordLines.map((line) => `${line};`).join("\n")
  const hiddenDuplicateContexts = [
    `<div>${duplicateRecords}</div>`,
    `<!-- <script>${duplicateRecords}</script> -->`,
    `<div data-record='<script>${duplicateRecords}</script>'></div>`,
    ...rawTextNames.map((name) => `<${name}><script>${duplicateRecords}</script></${name}>`),
  ]
  for (const hidden of hiddenDuplicateContexts) {
    assert.deepEqual(parseOpenCodeGoHydration(`${hidden}\n${fixtureScript}`, now), expectedQuota)
  }
})

test("OpenCode Go parser rejects pages whose three records exist only outside actual scripts", () => {
  const allRecords = recordLines.map((line) => `${line};`).join("\n")
  for (const source of [
    `<!-- <script>${allRecords}</script> -->`,
    `<div data-record='<script>${allRecords}</script>'></div>`,
    `<textarea><script>${allRecords}</script></textarea>`,
  ]) assert.equal(parseOpenCodeGoHydration(source, now), null)
})

test("OpenCode Go parser ignores markers in JavaScript strings templates and comments", () => {
  const hiddenRollingContexts = [
    `'${rollingRecord};';`,
    `${JSON.stringify(`${rollingRecord};`)};`,
    `\`${rollingRecord};\`;`,
    `// ${rollingRecord};`,
    `/* ${rollingRecord}; */`,
  ]
  for (const hidden of hiddenRollingContexts) {
    assert.equal(parseOpenCodeGoHydration(script(hidden, weeklyRecord, monthlyRecord), now), null)
  }
})

test("OpenCode Go parser accepts actual code markers while ignored JavaScript contexts contain duplicates", () => {
  const source = script(
    rollingRecord,
    weeklyRecord,
    monthlyRecord,
    `'${rollingRecord};';`,
    `${JSON.stringify(`${weeklyRecord};`)};`,
    `\`${monthlyRecord};\`;`,
    `// ${rollingRecord};`,
    `/* ${weeklyRecord}; */`,
  )
  assert.deepEqual(parseOpenCodeGoHydration(source, now), expectedQuota)
})

test("OpenCode Go parser fails closed on malformed HTML and unclosed JavaScript lexical state", () => {
  const malformedHtml = [
    `<!-- ${fixtureScript}`,
    `<div data-record='${fixtureScript}`,
    ...rawTextNames.map((name) => `<${name}>${fixtureScript}`),
    fixtureScript.replace("</script>", ""),
  ]
  const malformedJavaScript = [
    script(...recordLines, "const value='unterminated"),
    script(...recordLines, 'const value="unterminated'),
    script(...recordLines, "const value=`unterminated"),
    script(...recordLines, "/* unterminated"),
  ]
  for (const source of [...malformedHtml, ...malformedJavaScript]) {
    assert.equal(parseOpenCodeGoHydration(source, now), null)
  }
})

test("OpenCode Go parser scopes slash and template-expression ambiguity to marker-bearing remainders", () => {
  const unrelatedBodies = [
    "const ratio=1/2",
    "const pattern=/safe/",
    "const text=`before ${answer}`",
  ]
  for (const unrelated of unrelatedBodies) {
    assert.deepEqual(parseOpenCodeGoHydration(`${script(unrelated)}\n${fixtureScript}`, now), expectedQuota)
  }

  assert.deepEqual(parseOpenCodeGoHydration(script("const ratio=1/2", ...recordLines), now), expectedQuota)
  assert.deepEqual(parseOpenCodeGoHydration(script("const pattern=/safe/", ...recordLines), now), expectedQuota)
  assert.deepEqual(parseOpenCodeGoHydration(script(...recordLines, "const text=`before ${answer}`"), now), expectedQuota)

  for (const ambiguousLine of [
    `const ratio=1/2; ${rollingRecord};`,
    `const pattern=/safe/; ${rollingRecord};`,
  ]) {
    assert.equal(parseOpenCodeGoHydration(script(weeklyRecord, monthlyRecord, ambiguousLine), now), null)
  }
  assert.equal(parseOpenCodeGoHydration(
    script(weeklyRecord, monthlyRecord, "const text=`before ${answer}`", rollingRecord),
    now,
  ), null)
  assert.equal(parseOpenCodeGoHydration(
    script(weeklyRecord, monthlyRecord, "const text=`before ${answer}`", `'${rollingRecord};';`),
    now,
  ), null)
})

test("OpenCode Go parser validates suffixes against the real script-body remainder", () => {
  const source = fixtureScript.replace(rollingRecord, `${rollingRecord}${" ".repeat(64)}x`)
  assert.equal(parseOpenCodeGoHydration(source, now), null)
})

test("OpenCode Go parser enforces exact HTML and record code-unit boundaries", () => {
  const htmlAtLimit = fixtureScript.padEnd(1_000_000, " ")
  assert.equal(htmlAtLimit.length, 1_000_000)
  assert.deepEqual(parseOpenCodeGoHydration(htmlAtLimit, now), expectedQuota)
  assert.equal(parseOpenCodeGoHydration(`${htmlAtLimit} `, now), null)

  const objectAtLength = (length) => {
    const prefix = '{status:"ok",resetInSec:0.'
    const suffix = ",usagePercent:12.5}"
    const zeros = length - prefix.length - suffix.length
    assert.ok(zeros > 0)
    return `${prefix}${"0".repeat(zeros)}${suffix}`
  }
  const exactObject = objectAtLength(4_096)
  const oversizedObject = objectAtLength(4_097)
  assert.equal(exactObject.length, 4_096)
  assert.equal(oversizedObject.length, 4_097)
  assert.deepEqual(
    parseOpenCodeGoHydration(fixtureScript.replace(rollingObject, exactObject), now),
    { ...expectedQuota, fiveHour: { usedPct: 12.5, remainingPct: 87.5, resetEpoch: now } },
  )
  assert.equal(parseOpenCodeGoHydration(fixtureScript.replace(rollingObject, oversizedObject), now), null)
})
```

- [x] **Step 2: Run the lexical-scanner RED gate against rejected commit 29a102d**

Run: `node tests/compile-presentation.mjs && node --test --test-name-pattern="OpenCode Go parser|OpenCode Go transport" tests/provider-opencode-go.test.mjs`

Expected: exit 1 against `29a102d`. Existing transport tests, the original valid parser test, and candidate-free unrelated slash/template-expression cases remain green. At minimum, failures show that the old parser returns quota for script-like records in an HTML comment/raw-text/quoted-attribute context, returns quota when a required marker exists only in a JavaScript string/template/comment, returns `null` when valid code markers have ignored-context duplicates, accepts malformed/unclosed lexical state after valid records, accepts marker candidates after an ambiguous slash or template `${`, and accepts the 64-space suffix followed by `x`. The exact boundary assertions may already pass; they are regression locks, not required RED causes.

- [x] **Step 3: Replace raw HTML index searches with one deterministic lexical pass**

In `tui/providers/opencode-go.ts`, delete `scriptBodies` and replace it with the following concrete scanner shape. Keep ranges or strings internally; no scanner helper is exported. The pseudocode is TypeScript-complete in behavior: helper names may be adjusted, but every state, boundary, and failure below is mandatory.

```typescript
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
```

This is a single monotonic HTML pass: the outer cursor never moves backward, comment/tag scanners advance from that cursor, and raw-text/script scanners consume disjoint ranges before returning control. Do not lowercase the full page, use raw `<script`/`</script>` `indexOf`, or inspect markers during this pass. In raw-text and script state, only the corresponding case-insensitive end tag is markup; all other `<` text is consumed as body data. Any unclosed comment, declaration, attribute quote, relevant raw-text element, or script rejects the page.

- [x] **Step 4: Replace raw marker searches with bounded JavaScript lexical scanning**

Delete `countLiteral`, marker `RegExp`/`matchAll` calls, the 33-character suffix slice, and the old body loop inside `parseOpenCodeGoHydration`. Keep `NUMBER_SOURCE`, `OBJECT_PATTERN`, `RECORDS`, `MAX_HTML_LENGTH`, and `MAX_ASSIGNMENT_LENGTH`. Implement the following scanner and aggregate flow:

```typescript
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
```

The scoped ambiguity rule is exact. `hasMarkerCandidate` creates one bounded slice and calls `indexOf` at most once for each of the three fixed public prefixes; it is the only approved marker pre-scan and is shared by both ambiguity branches. It never searches raw HTML, never decides code context, and never uses a broad regex.

In code state, `//` and `/*` enter comments. Any other `/` starts an unsupported regex-versus-division remainder: scan monotonically to the next actual CR, LF, or body end. A JavaScript regex literal cannot contain an unescaped line terminator, so ambiguity cannot extend beyond that boundary. Reject if the bounded line remainder contains a marker candidate. Otherwise set the cursor to the line boundary and resume normal code scanning, so a marker on the next line remains eligible. A division expression followed by a real marker on the same line is conservatively rejected.

A no-substitution template consumes escapes until its closing backtick and then resumes code scanning. On an unescaped `${`, reject if the rest of that actual script body contains any marker candidate. If none exists, return `found` immediately for that body; no later quota candidate can be skipped because the bounded remainder search proved none exists. Other actual script bodies continue to scan and can supply all three records. Do not add regex-literal recognition, division parsing, template-expression brace tracking, automatic semicolon insertion, or general JavaScript parsing. A line comment may end at the actual script-body end; single/double strings, no-substitution templates, and block comments may not.

The object capture checks at most 4,097 code units so an object of exactly 4,096 is accepted and 4,097 is rejected. The suffix loop walks the actual body, regardless of whitespace length, and accepts only an actual delimiter or `suffix === body.length`; it never applies `$` to a temporary slice.

- [x] **Step 5: Run contract and focused scanner GREEN gates**

Run: `node --test tests/provider-opencode-go-contract.test.mjs && node tests/compile-presentation.mjs && node --test --test-name-pattern="OpenCode Go parser|OpenCode Go transport" tests/provider-opencode-go.test.mjs`

Expected: exit 0. The fixture-only contract gate passes 5/5. The focused provider file passes 15/15 matching tests: eleven parser tests (the original two plus nine regressions) and four unchanged transport tests, with 0 failures. Candidate-free `1/2`, `/safe/`, and `` `before ${answer}` `` scripts do not invalidate records in another script body; slash lines resume at the next line; marker-bearing ambiguous remainders reject.

- [x] **Step 6: Run type and diff-scope GREEN gates**

Run: `npm run typecheck`

Expected: exit 0 with no TypeScript diagnostics. The existing unrelated npm `allow-scripts` deprecation warning may appear.

Run: `git diff --check -- tests/provider-opencode-go.test.mjs tui/providers/opencode-go.ts && git status --short`

Expected: `git diff --check` exits 0. Status shows only the Task 3 test/provider modifications plus the three pre-existing deleted report paths and any already-approved documentation corrections; no implementation file other than `tui/providers/opencode-go.ts` and no test file other than `tests/provider-opencode-go.test.mjs` is changed.

- [x] **Step 7: Commit the GREEN lexical-scanner fix atomically**

```bash
git status --short &&
git add tests/provider-opencode-go.test.mjs tui/providers/opencode-go.ts &&
git diff --cached --check &&
git commit -m "fix(quota): harden OpenCode Go hydration scanning"
```

Expected: one fix commit containing only `tests/provider-opencode-go.test.mjs` and `tui/providers/opencode-go.ts`. Never stage the three deleted report files or the design/plan correction documents as part of the implementation fix commit.

The review gate for Task 3 must confirm: actual-tag HTML context, code-state-only marker uniqueness, scoped fixed-prefix ambiguity checks, acceptance of unrelated candidate-free slash/template-expression scripts, rejection of marker-bearing ambiguous remainders, real-remainder suffix validation, exact size boundaries, atomic three-record acceptance, unchanged fixed transport, and no DOM/parser dependency, execution, broad regex, or unbounded loop.

### Task 4: Three-Window Semantic Mapper TDD

**OpenSpec:** 1.3 (complete) + 2.3

**Files:**
- Modify: `tests/provider-opencode-go.test.mjs`
- Modify: `tui/providers/opencode-go.ts`

**Interfaces:**
- Consumes: Task 3 `OpenCodeGoQuotaData` and existing `PanelItem`/`PanelModel`.
- Produces: `OpenCodeGoPanelPhase`, `OpenCodeGoPanelState`, `openCodeGoHomeQuotaSummary(data)`, and `mapOpenCodeGoPanelState(state): PanelModel`.
- Owns mapper tests and implementation only; no timers, fetches, aliases, or construction are introduced.

- [x] **Step 1: Add focused mapper tests**

Replace Task 3's provider-module destructuring with the expanded binding below, then append the mapper tests:

```javascript
const {
  fetchOpenCodeGoQuota,
  mapOpenCodeGoPanelState,
  normalizeOpenCodeGoConfig,
  openCodeGoHomeQuotaSummary,
  parseOpenCodeGoHydration,
} = providerModule
```

```javascript
function item(model, id) {
  return model.groups.flatMap((group) => group.items).find((candidate) => candidate.id === id)
}

test("OpenCode Go mapper emits stable 5H 7D and 1M remaining windows", () => {
  const model = mapOpenCodeGoPanelState({ phase: "ready", data: expectedQuota, now })
  assert.equal(model.id, "opencode-go")
  assert.equal(model.order, 130)
  assert.equal(model.title, "OpenCode GO")
  assert.equal(model.groups[0].id, "opencode-go:quota")
  assert.deepEqual(model.groups[0].items.map((entry) => [
    entry.id,
    entry.order,
    entry.kind === "header" ? entry.title : entry.label,
    entry.kind === "progress" ? entry.value : undefined,
  ]), [
    ["opencode-go:header", 10, "OpenCode GO:", undefined],
    ["opencode-go:5h", 20, "5H", 87.5],
    ["opencode-go:5h-reset", 30, "5H reset", undefined],
    ["opencode-go:7d", 40, "7D", 66],
    ["opencode-go:7d-reset", 50, "7D reset", undefined],
    ["opencode-go:1m", 60, "1M", 43.25],
    ["opencode-go:1m-reset", 70, "1M reset", undefined],
  ])
  assert.deepEqual(openCodeGoHomeQuotaSummary(expectedQuota), {
    provider: "OpenCode GO",
    plan: "Subscription",
    primaryPct: 87.5,
    secondaryPct: 66,
  })
})

test("OpenCode Go mapper covers timer stale and unavailable states", () => {
  const full = structuredClone(expectedQuota)
  full.fiveHour.remainingPct = 100
  assert.equal(item(mapOpenCodeGoPanelState({ phase: "ready", data: full, now }), "opencode-go:5h-reset").state, "idle")
  assert.equal(item(mapOpenCodeGoPanelState({ phase: "ready", data: expectedQuota, now }), "opencode-go:5h-reset").state, "countdown")
  assert.equal(item(mapOpenCodeGoPanelState({ phase: "ready", data: expectedQuota, now: expectedQuota.fiveHour.resetEpoch }), "opencode-go:5h-reset").state, "expired")
  assert.deepEqual(item(mapOpenCodeGoPanelState({ phase: "stale", data: expectedQuota, now }), "opencode-go:stale"), {
    id: "opencode-go:stale",
    order: 15,
    kind: "text",
    text: "~stale",
    status: "warning",
  })
  for (const [phase, detail] of [["configuration-required", "Configuration required"], ["unavailable", "Usage unavailable"]]) {
    const model = mapOpenCodeGoPanelState({ phase, now })
    const header = item(model, "opencode-go:header")
    assert.equal(header.title, "OpenCode GO:")
    assert.equal(header.detail, detail)
    assert.equal(model.groups[0].items.some((entry) => entry.kind === "progress"), false)
    assert.equal(model.collapsedSummary, undefined)
  }
})
```

- [x] **Step 2: Run the exact mapper RED gate**

Run: `node tests/compile-presentation.mjs && node --test --test-name-pattern="OpenCode Go mapper" tests/provider-opencode-go.test.mjs`

Expected: FAIL in the focused test callbacks with `TypeError: mapOpenCodeGoPanelState is not a function`, which is the first missing binding invoked. Dynamic-import object destructuring binds both mapper properties to `undefined` without failing module import.

- [x] **Step 3: Add the exact mapper contracts and implementation**

Add `import type { PanelItem, PanelModel } from "../presentation/types.js"` at the top of `tui/providers/opencode-go.ts`, then append:

```typescript
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
```

- [x] **Step 4: Run the exact mapper GREEN gates**

Run: `node tests/compile-presentation.mjs && node --test --test-name-pattern="OpenCode Go mapper" tests/provider-opencode-go.test.mjs`

Expected: every mapper test PASS with 0 failures.

Run: `npm run typecheck`

Expected: exit 0 with no diagnostics.

- [x] **Step 5: Commit the GREEN mapper unit atomically**

```bash
git status --short &&
git add tests/provider-opencode-go.test.mjs tui/providers/opencode-go.ts &&
git commit -m "feat(quota): map OpenCode Go windows"
```

### Task 5: Reactive Lifecycle TDD

**OpenSpec:** 1.4 (partial) + 2.4

**Files:**
- Modify: `tests/provider-opencode-go.test.mjs`
- Modify: `tui/providers/opencode-go.ts`

**Interfaces:**
- Consumes: Tasks 3-4 parser, transport, mapper, `QuotaProviderOptions`, and `QuotaProviderAdapter`.
- Produces: `OpenCodeGoProviderOptions` and `createOpenCodeGoProvider(api: TuiPluginApi, options: OpenCodeGoProviderOptions): QuotaProviderAdapter`.
- Owns lifecycle behavior only. Task 6 owns quota construction, aliases, selection, shared type exports, and build boundary tests.

- [x] **Step 1: Add the deterministic fake-clock lifecycle harness**

Replace Task 4's provider-module destructuring with the expanded binding below. Add a fake clock whose timeout/interval records are `{ active, callback, delay, kind, unref() {} }`, replaces `Date.now`, `setTimeout`, `clearTimeout`, `setInterval`, and `clearInterval`, and exposes:

```javascript
const {
  createOpenCodeGoProvider,
  fetchOpenCodeGoQuota,
  mapOpenCodeGoPanelState,
  normalizeOpenCodeGoConfig,
  openCodeGoHomeQuotaSummary,
  parseOpenCodeGoHydration,
} = providerModule
```

```javascript
{
  advance(ms) {
    current += ms
    for (const timer of timers.filter((entry) => entry.active && entry.delay <= ms)) timer.callback()
  },
  active(kind, delay) {
    return timers.filter((entry) => entry.active && entry.kind === kind && entry.delay === delay)
  },
  restore() {
    Date.now = originals.now
    globalThis.setTimeout = originals.setTimeout
    globalThis.clearTimeout = originals.clearTimeout
    globalThis.setInterval = originals.setInterval
    globalThis.clearInterval = originals.clearInterval
  },
}
```

Use a `deferred()` helper returning `{ promise, resolve, reject }`. Construct every configured adapter with:

```javascript
createOpenCodeGoProvider({}, {
  config: sentinel,
  refreshIntervalMs: 2_500,
  fetch: testFetch,
})
```

Each test registers `t.after()` that disposes the adapter, settles deferred responses, restores globals, and asserts no fake timer remains active.

- [x] **Step 2: Add focused lifecycle tests**

Add tests prefixed `OpenCode Go lifecycle` for these exact transitions and timer counts:

```text
valid construction starts one request immediately
null configuration starts zero requests and renders Configuration required
omitted refreshIntervalMs creates a 10000ms poll; 2500 creates a 2500ms poll
configured construction creates one 1000ms countdown/stale tick
each request owns one 20000ms abort timeout and clears it after settlement
two manual refreshes plus a poll while pending return the same promise and keep one request
ordinary triggers while pending queue no follow-up request
the nearest future reset creates one boundary timeout
a boundary crossed by an older request queues exactly one post-settlement refresh
later 7D and 1M boundaries become nearest after earlier resets
success then transient failure retains rows and adds ~stale; later success returns ready
stale rows remain at exactly 600000ms and disappear after 600001ms
authentication-required clears rows and renders Configuration required
invalid-response clears rows and renders Usage unavailable
dispose aborts the request and clears poll, tick, boundary, and request timeout
late fulfillment or rejection after dispose cannot mutate panel state or start work
```

Use `fixture("success.html")` for success responses, `response(503)` for transient failure, `response(403)` for authentication failure, and `response(200, "invalid", { "content-type": "text/html" })` for protocol failure. The missing-configuration assertion is exactly:

```javascript
test("OpenCode Go lifecycle sends no request without valid configuration", async (t) => {
  let requests = 0
  const adapter = createOpenCodeGoProvider({}, {
    config: null,
    fetch: async () => {
      requests += 1
      throw new Error("unexpected request")
    },
  })
  t.after(() => adapter.dispose())
  await adapter.refresh()
  assert.equal(requests, 0)
  assert.equal(item(adapter.panel(), "opencode-go:header").detail, "Configuration required")
})
```

For serialization, retain the three returned promises and assert strict identity. For boundary serialization, begin a request before `expectedQuota.fiveHour.resetEpoch`, fire that boundary, resolve the request, await two microtask turns, and assert the request count advances from 1 to exactly 2. For stale expiry, advance the fake wall clock by 600,000 then 1 milliseconds and invoke the 1,000ms tick after each advance.

- [x] **Step 3: Run the exact lifecycle RED gate**

Run: `node tests/compile-presentation.mjs && node --test --test-name-pattern="OpenCode Go lifecycle" tests/provider-opencode-go.test.mjs`

Expected: FAIL in the focused test callbacks with `TypeError: createOpenCodeGoProvider is not a function`. Dynamic-import object destructuring binds the missing constructor to `undefined`; importing the compiled module still succeeds.

- [x] **Step 4: Add lifecycle imports, contracts, and scheduling constants**

At the top of `tui/providers/opencode-go.ts`, add:

```typescript
import type { TuiPluginApi } from "@opencode-ai/plugin/tui"
import { createRoot, createSignal, onCleanup } from "solid-js"
import type { ProviderFreshness, QuotaProviderAdapter, QuotaProviderOptions } from "./types.js"

const DEFAULT_REFRESH_INTERVAL_MS = 10_000
const TICK_MS = 1_000
const FETCH_TIMEOUT_MS = 20_000
const STALE_MAX_MS = 600_000

export type OpenCodeGoProviderOptions = QuotaProviderOptions & {
  config: OpenCodeGoConfig | null
  fetch?: typeof globalThis.fetch
}
```

- [x] **Step 5: Implement one serialized request and all result transitions**

Implement `createOpenCodeGoProvider` as one `createRoot`. Use signals `data`, `phase`, `lastSuccessAt`, and `now`; mutable fields `disposed`, `refreshInFlight`, `refreshStartedAt`, `pendingBoundary`, `refreshedBoundary`, `activeController`, and `boundaryTimer`; and these exact result transitions:

```typescript
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
```

The request body must be exactly:

```typescript
const refresh = (): Promise<void> => {
  if (disposed || !options.config) return Promise.resolve()
  if (refreshInFlight) return refreshInFlight
  const startedAt = Date.now()
  const controller = new AbortController()
  activeController = controller
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
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
```

Define `unref(timer)` as `(timer as { unref?: () => void }).unref?.()` without a leading empty statement.

- [x] **Step 6: Implement poll, tick, nearest-boundary, and final disposal behavior**

Normalize `options.refreshIntervalMs` to a finite positive value or 10,000. For valid configuration only, create one poll interval and one 1,000ms tick. The tick sets `now` and, only when `current - lastSuccessAt() > STALE_MAX_MS`, clears stale data, sets `unavailable`, and clears the boundary timer.

`scheduleBoundary(snapshot)` computes the minimum of the three reset epochs strictly greater than `Date.now()` and different from `refreshedBoundary`; it clears the old boundary timer before setting one timeout. Its callback uses exactly this serialization rule:

```typescript
if (refreshInFlight && refreshStartedAt < epoch) {
  pendingBoundary = Math.max(pendingBoundary, epoch)
  return
}
refreshedBoundary = epoch
void refresh()
```

Call `void refresh()` once after valid construction. Return this adapter shape:

```typescript
return {
  id: "opencode-go",
  order: 130,
  panel: () => mapOpenCodeGoPanelState({ phase: phase(), data: data(), now: now() }),
  home: () => null,
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
    disposeRoot()
  },
}
```

The temporary `home: () => null` keeps Task 5 type-correct before `OpenCodeGoHomeQuotaSummary` joins the shared union. Task 6 owns that type and replaces this one line with the ready/stale summary accessor during integration. Register `onCleanup` to clear poll, tick, and boundary timers. Every asynchronous continuation checks `disposed` before state mutation, timer creation, or queued work. Do not add exhausted backoff or refactor generic polling.

- [x] **Step 7: Run the exact lifecycle GREEN gates**

Run: `node tests/compile-presentation.mjs && node --test --test-name-pattern="OpenCode Go lifecycle" tests/provider-opencode-go.test.mjs`

Expected: every lifecycle test PASS, request concurrency never exceeds one, and every cleanup reports zero active timers.

Run: `npm run typecheck`

Expected: exit 0 with no diagnostics.

- [x] **Step 8: Commit the GREEN lifecycle unit atomically**

```bash
git status --short &&
git add tests/provider-opencode-go.test.mjs tui/providers/opencode-go.ts &&
git commit -m "feat(quota): schedule OpenCode Go refreshes"
```

### Task 6: Shared Integration And Selection TDD

**OpenSpec:** 1.4 (complete) + 3.1

**Files:**
- Modify: `tests/quota-composition.test.mjs`
- Modify: `tests/shared-boundary.test.mjs`
- Modify: `tests/plugin-build.test.mjs`
- Modify: `tui/providers/opencode-go.ts`
- Modify: `tui/providers/types.ts:5-21`
- Modify: `shared/opencode-tools-shared.ts`
- Modify: `tui/quota.tsx:7-12,63-69,342-348`

**Interfaces:**
- Consumes: Task 5 `createOpenCodeGoProvider`, Task 2 `NormalizedQuotaOptions.openCodeGo`, and existing selection/composition functions.
- Produces: `OpenCodeGoHomeQuotaSummary`, complete shared exports, quota-only adapter construction, and aliases `opencode-go -> opencode-go` plus `opencode-go-subscription -> opencode-go`.
- Leaves `QuotaProviderAdapter`, `PanelModel`, `PanelRenderer`, `tui/home.tsx`, generic polling, and renderer width logic unchanged.

- [x] **Step 1: Add failing alias, active-refresh, and construction tests**

In `tests/quota-composition.test.mjs`, add a fake adapter with `id: "opencode-go"`, `order: 130`, freshness accessor, `refreshCalls`, 5H/7D/1M progress rows, and a 5H/7D home summary. Add:

```javascript
test("OpenCode Go integration resolves both runtime aliases", () => {
  const providers = [provider({ id: "opencode-go", title: "OpenCode GO", order: 130, primaryPct: 87.5, secondaryPct: 66 })]
  assert.equal(selectedQuotaProviderID([{ id: "opencode-go" }], providers), "opencode-go")
  assert.equal(selectedQuotaProviderID([{ id: "opencode-go-subscription" }], providers), "opencode-go")
  assert.equal(selectedSessionQuotaProviderID([
    { role: "user", model: { providerID: "opencode-go-subscription" } },
  ], providers), "opencode-go")
})
```

Extend the existing reactive selection fixture with a latest user message using `opencode-go-subscription`; after the effect flush, assert OpenCode Go `refreshCalls === 1`, its selected group precedes `Other providers`, switching to OpenAI refreshes OpenAI and retains ready/stale OpenCode Go under `Other providers`, and an unavailable unselected OpenCode Go group is omitted.

Extend the plugin construction test by passing:

```javascript
{
  refreshIntervalSeconds: 2.5,
  quota: { opencodego: sentinel },
}
```

Import `readFileSync` alongside the existing `mkdtempSync`/`rmSync`, define `openCodeGoManifest` and `openCodeGoHtml` from Task 1 fixtures, and add this exact branch to the `aggregatePanel` fetch stub before its unexpected-URL error:

```javascript
if (url === openCodeGoManifest.request.url) {
  assert.deepEqual(requestOptions, {
    method: "GET",
    headers: openCodeGoManifest.request.headers,
    redirect: "manual",
    signal: requestOptions.signal,
  })
  assert.equal(requestOptions.signal instanceof AbortSignal, true)
  observations.requests.push({ provider: "opencode-go", authorization: undefined })
  return new Response(openCodeGoHtml, { status: 200, headers: { "content-type": "text/html; charset=utf-8" } })
}
```

Assert the first OpenCode Go request matches the Task 1 manifest, the active 2,500ms poll count is three, polling each timer produces exactly one request from `openai`, `opencode-go`, and `zai`, and disposal runs through the registered lifecycle callback. This is the first quota test that requires adapter construction.

- [x] **Step 2: Add failing shared-boundary, type, and build assertions**

In `tests/shared-boundary.test.mjs`, extend `shared facade exports computation without plugin registration or JSX` with:

```javascript
assert.match(shared, /createOpenCodeGoProvider/)
assert.doesNotMatch(source("tui/quota.tsx"), /from ["']\.\/providers\/opencode-go/)
assert.doesNotMatch(source("tui/home.tsx"), /opencode-go/)
```

In `tests/plugin-build.test.mjs`, add a test named `artifacts expose OpenCode Go only through shared computation` that asserts:

```javascript
assert.deepEqual(Object.keys(buildResults).sort(), ["quota", "shared", "tokens"])
assert.equal(Object.keys(buildResults.shared.metafile.inputs).some((path) => path.endsWith("/tui/providers/opencode-go.ts") || path === "tui/providers/opencode-go.ts"), true)
assert.equal(Object.keys(buildResults.quota.metafile.inputs).some((path) => path.endsWith("tui/providers/opencode-go.ts")), false)
assert.equal(Object.keys(buildResults.tokens.metafile.inputs).some((path) => path.endsWith("tui/providers/opencode-go.ts")), false)
const sharedModule = await import(`${pathToFileURL(resolve(root, "dist/opencode-tools-shared.js")).href}?opencode-go`)
assert.equal(typeof sharedModule.createOpenCodeGoProvider, "function")
```

Keep the existing host-runtime assertions for `solid-js`, `@opentui/*`, `@opencode-ai/plugin`, SDK modules, and runtime built-ins external.

- [x] **Step 3: Run the exact integration RED gate**

Run: `node tests/compile-presentation.mjs && node --test --test-name-pattern="OpenCode Go integration|shared facade exports|artifacts expose OpenCode Go" tests/quota-composition.test.mjs tests/shared-boundary.test.mjs tests/plugin-build.test.mjs`

Expected: FAIL because `selectedQuotaProviderID` returns `undefined` for both OpenCode Go IDs, the shared facade does not export `createOpenCodeGoProvider`, and quota construction has only Z.AI/OpenAI.

- [x] **Step 4: Add the summary union before shared imports consume it**

In `tui/providers/types.ts`, add:

```typescript
export type OpenCodeGoHomeQuotaSummary = {
  provider: "OpenCode GO"
  plan: "Subscription"
  primaryPct: number
  secondaryPct: number
}

export type HomeQuotaSummary =
  | ZaiHomeQuotaSummary
  | OpenAiHomeQuotaSummary
  | OpenCodeGoHomeQuotaSummary
```

Do not change `QuotaProviderAdapter` or `ProviderFreshness`.

- [x] **Step 5: Complete shared exports and quota-only construction**

Replace the narrow Task 2 OpenCode Go facade export with this complete block in `shared/opencode-tools-shared.ts`:

```typescript
export {
  createOpenCodeGoProvider,
  fetchOpenCodeGoQuota,
  mapOpenCodeGoPanelState,
  normalizeOpenCodeGoConfig,
  openCodeGoHomeQuotaSummary,
  parseOpenCodeGoHydration,
} from "../tui/providers/opencode-go.js";
export type {
  OpenCodeGoConfig,
  OpenCodeGoFetchDependencies,
  OpenCodeGoFetchResult,
  OpenCodeGoOptions,
  OpenCodeGoPanelPhase,
  OpenCodeGoPanelState,
  OpenCodeGoProviderOptions,
  OpenCodeGoQuotaData,
  OpenCodeGoWindow,
} from "../tui/providers/opencode-go.js";
```

Add `OpenCodeGoHomeQuotaSummary` to the existing type export from `tui/providers/types.ts`.

Now that the union accepts the OpenCode Go summary, replace Task 5's temporary `home: () => null` in `createOpenCodeGoProvider` with:

```typescript
home: () => (phase() === "ready" || phase() === "stale") && data()
  ? openCodeGoHomeQuotaSummary(data()!)
  : null,
```

Import `createOpenCodeGoProvider` in the existing shared-facade import in `tui/quota.tsx`. Add exactly these aliases:

```typescript
"opencode-go": "opencode-go",
"opencode-go-subscription": "opencode-go",
```

Append exactly this construction after OpenAI construction:

```typescript
providers.push(createOpenCodeGoProvider(api, {
  config: options.openCodeGo,
  refreshIntervalMs: options.refreshIntervalMs,
}))
```

Do not instantiate OpenCode Go in `tui/home.tsx` because that legacy entry has no native options path.

- [x] **Step 6: Run the exact integration GREEN gates**

Run: `node tests/compile-presentation.mjs && node --test --test-name-pattern="OpenCode Go integration|shared facade exports|artifacts expose OpenCode Go" tests/quota-composition.test.mjs tests/shared-boundary.test.mjs tests/plugin-build.test.mjs`

Expected: every matching integration/boundary/build test PASS, both aliases select one adapter, active selection refreshes once, and build result keys remain exactly `quota`, `shared`, and `tokens`.

Run: `npm run typecheck && npm run build:plugins`

Expected: both commands exit 0; exactly the existing three artifacts are built.

- [x] **Step 7: Commit the GREEN integration unit atomically**

```bash
git status --short &&
git add tests/quota-composition.test.mjs tests/shared-boundary.test.mjs tests/plugin-build.test.mjs tui/providers/opencode-go.ts tui/providers/types.ts shared/opencode-tools-shared.ts tui/quota.tsx &&
git commit -m "feat(quota): integrate OpenCode Go provider"
```

### Task 7: Three-Provider Aggregate And Deployment Regressions

**OpenSpec:** 3.2

**Files:**
- Modify: `tests/quota-composition.test.mjs`
- Modify: `tests/plugin-deploy.test.mjs`

**Interfaces:**
- Consumes: Task 6 integrated adapter and unchanged generic composition/layout functions.
- Produces: regression coverage for three-provider priority/retention, collapsed summary, remaining/used conversion, color thresholds, sorting, 37-column layouts, nested option deployment, idempotence, and three-artifact parity.
- Makes no production-code change; the minimal GREEN implementation is concrete three-provider test data plus nested deployment fixture data.

- [ ] **Step 1: Add aggregate assertions before adding the third-provider fixture**

Add a test named `three providers preserve OpenCode Go aggregate semantics` that calls `openCodeGoRegressionProvider()` together with existing Z.AI/OpenAI fake adapters and asserts:

```javascript
const zai = provider({ id: "zai", title: "Z.AI", order: 110, primaryPct: 75, secondaryPct: 60 })
const openai = provider({ id: "openai", title: "OpenAI", order: 120, primaryPct: 70, secondaryPct: 55 })
const openCodeGo = openCodeGoRegressionProvider()
const remaining = composeQuotaPanel("opencode-go", [zai, openai, openCodeGo], {
  percentageMode: "remaining",
  sortDirection: "desc",
  progressColors: { enabled: true, errorBelow: 10, warningBelow: 30 },
})
const used = composeQuotaPanel("opencode-go", [zai, openai, openCodeGo], {
  percentageMode: "used",
  sortDirection: "asc",
  progressColors: { enabled: true, errorBelow: 10, warningBelow: 30 },
})
assert.equal(remaining.groups[0].id, "opencode-go:quota")
assert.equal(remaining.groups.some((group) => group.header?.title === "Other providers"), true)
assert.deepEqual(remaining.collapsedSummary, { kind: "text", text: "88%/66%", status: "success" })
assert.deepEqual(used.collapsedSummary, { kind: "text", text: "13%/34%", status: "success" })
assert.deepEqual(used.groups.flatMap((group) => group.items)
  .filter((entry) => ["opencode-go:5h", "opencode-go:7d", "opencode-go:1m"].includes(entry.id))
  .map((entry) => entry.value), [12.5, 34, 56.75])
assert.equal(used.groups.flatMap((group) => group.items).find((entry) => entry.id === "opencode-go:5h").status, "success")
assert.equal(String(used.collapsedSummary.text).includes("1M"), false)
```

Render extended, semi-collapsed, and collapsed layouts with `availableCells: 37`; flatten each rendered row to its total cell width and assert every value is `<= 37`. Assert selecting OpenAI moves only OpenAI first while ready/stale OpenCode Go remains in `Other providers`, and assert ascending/descending secondary ordering uses the configured displayed metric.

Extend the compiled renderer import to:

```javascript
const { normalizePanelModel, renderPanelLayout } = await import("../.tmp-test/presentation-renderer.mjs")
```

Call `renderPanelLayout(remaining, { availableCells: 37 })` for extended content, with `collapsed: new Set(["other-providers"])` for semi-collapsed content, and with `collapsed: new Set(["quota"])` for collapsed content. For each layout, sum every header/progress/table row's declared cell widths and compare plain text/timer row string lengths; assert every measured row is at most 37 cells.

Before `openCodeGoRegressionProvider` exists, run the focused command in Step 2.

- [ ] **Step 2: Run the exact aggregate RED gate**

Run: `node tests/compile-presentation.mjs && node --test --test-name-pattern="three providers preserve" tests/quota-composition.test.mjs`

Expected: FAIL with `ReferenceError: openCodeGoRegressionProvider is not defined`.

- [ ] **Step 3: Add the minimal synthetic third-provider fixture**

Add this helper above the aggregate test:

```javascript
function openCodeGoRegressionProvider(freshness = "ready") {
  const resetBase = Date.UTC(2026, 6, 14, 12, 0, 0)
  const panel = {
    id: "opencode-go",
    order: 130,
    title: "OpenCode GO",
    groups: [{
      id: "opencode-go:quota",
      order: 10,
      items: [
        { id: "opencode-go:header", order: 10, kind: "header", title: "OpenCode GO:" },
        ...(freshness === "stale" ? [{ id: "opencode-go:stale", order: 15, kind: "text", text: "~stale", status: "warning" }] : []),
        { id: "opencode-go:5h", order: 20, kind: "progress", label: "5H", value: 87.5, total: 100 },
        { id: "opencode-go:5h-reset", order: 30, kind: "timer", label: "5H reset", state: "countdown", epoch: resetBase + 1_800_000 },
        { id: "opencode-go:7d", order: 40, kind: "progress", label: "7D", value: 66, total: 100 },
        { id: "opencode-go:7d-reset", order: 50, kind: "timer", label: "7D reset", state: "countdown", epoch: resetBase + 172_800_000 },
        { id: "opencode-go:1m", order: 60, kind: "progress", label: "1M", value: 43.25, total: 100 },
        { id: "opencode-go:1m-reset", order: 70, kind: "timer", label: "1M reset", state: "countdown", epoch: resetBase + 1_209_600_000 },
      ],
    }],
  }
  return {
    id: "opencode-go",
    order: 130,
    panel: () => panel,
    home: () => ({ provider: "OpenCode GO", plan: "Subscription", primaryPct: 87.5, secondaryPct: 66 }),
    freshness: () => freshness,
    refresh: async () => {},
    setSessionID: () => {},
    dispose: () => {},
  }
}
```

- [ ] **Step 4: Add deployment assertions before extending deployment options**

In `tests/plugin-deploy.test.mjs`, add assertions that the selected `./opencode-tools-quota.js` entry options equal:

```javascript
{
  otherProviders: { percentageMode: "used", sortDirection: "asc" },
  quota: {
    opencodego: {
      workspaceId: "wrk_TESTWORKSPACE",
      workspaceToken: "TOKEN_TEST_ONLY_DO_NOT_USE",
    },
  },
}
```

- [ ] **Step 5: Run the exact deployment RED gate**

Run: `node --test tests/plugin-deploy.test.mjs`

Expected: FAIL with a deep-equality difference because `localOptions` still contains only `otherProviders`.

- [ ] **Step 6: Add the minimal nested deployment fixture**

Replace `localOptions` with:

```javascript
const localOptions = {
  otherProviders: { percentageMode: "used", sortDirection: "asc" },
  quota: {
    opencodego: {
      workspaceId: "wrk_TESTWORKSPACE",
      workspaceToken: "TOKEN_TEST_ONLY_DO_NOT_USE",
    },
  },
}
```

Keep assertions that two local deploys are byte-for-byte idempotent, project-to-global option migration preserves the nested object, unrelated entries remain unchanged, and artifact paths remain exactly `opencode-tools-shared.js`, `opencode-tools-quota.js`, and `plugins/opencode-tools-tokens.js`.

- [ ] **Step 7: Run the exact aggregate/deployment GREEN gates**

Run: `node tests/compile-presentation.mjs && node --test tests/quota-composition.test.mjs tests/presentation-layout.test.mjs tests/plugin-deploy.test.mjs`

Expected: all composition, max-width, and deployment tests PASS with 0 failures; no renderer snapshot or generic polling source changes.

- [ ] **Step 8: Commit the GREEN regression unit atomically**

```bash
git status --short &&
git add tests/quota-composition.test.mjs tests/plugin-deploy.test.mjs &&
git commit -m "test(quota): verify three-provider composition"
```

### Task 8: Documentation TDD

**OpenSpec:** 3.3

**Files:**
- Modify: `tests/plugin-wiring.test.mjs`
- Modify: `README.md`

**Interfaces:**
- Consumes: final nested option names and behavior from Tasks 2-7.
- Produces: local secret-handling, supported-window, polling, rotation, fixed-origin, and undocumented-contract guidance containing only synthetic values.

- [ ] **Step 1: Add the exact documentation regression test**

Ensure `tests/plugin-wiring.test.mjs` imports `readFileSync`, then append:

```javascript
test("documents secret-safe OpenCode Go configuration", () => {
  const readme = readFileSync("README.md", "utf8")
  for (const text of [
    "quota.opencodego.workspaceId",
    "quota.opencodego.workspaceToken",
    "workspaceToken is the plaintext auth cookie value",
    "https://opencode.ai",
    "rolling 5H",
    "weekly 7D",
    "subscription month 1M",
    "undocumented Solid hydration contract",
    "must not be committed",
    "rotate",
  ]) assert.equal(readme.includes(text), true, `missing README text: ${text}`)

  assert.doesNotMatch(readme, /private (?:JSON|query) endpoint/iu)
  assert.doesNotMatch(readme, /[".]openCodeGo[".]/u)
  assert.doesNotMatch(readme, /(?:copy|save|export).{0,40}(?:full HTML|response body|HAR)/iu)
  const tokenValues = [...readme.matchAll(/"workspaceToken"\s*:\s*"([^"]+)"/gu)].map((match) => match[1])
  assert.deepEqual(tokenValues, ["TOKEN_TEST_ONLY_DO_NOT_USE"])
})
```

- [ ] **Step 2: Run the exact documentation RED gate**

Run: `node --test --test-name-pattern="documents secret-safe OpenCode Go" tests/plugin-wiring.test.mjs`

Expected: FAIL with `missing README text: quota.opencodego.workspaceId`.

- [ ] **Step 3: Add exact local configuration and safety guidance**

Extend the quota plugin JSON example in `README.md` with:

```json
"quota": {
  "opencodego": {
    "workspaceId": "wrk_TESTWORKSPACE",
    "workspaceToken": "TOKEN_TEST_ONLY_DO_NOT_USE"
  }
}
```

Add prose containing these exact statements:

```text
`quota.opencodego.workspaceId` identifies the OpenCode Go workspace. `quota.opencodego.workspaceToken` authenticates the console request; workspaceToken is the plaintext auth cookie value. Keep both values only in local `.opencode/tui.json`: they must not be committed or shared, and you must rotate the console session when it expires, is revoked, or is exposed.

Requests are fixed to `https://opencode.ai`; these values do not replace the OpenCode-managed inference API key. The sidebar reports exact remaining usage for rolling 5H, weekly 7D, and subscription month 1M windows. OpenCode Go uses the undocumented Solid hydration contract from the authenticated page and fails closed if that contract changes. It does not scrape visible text, save page HTML, or estimate quota from local cost.
```

Add OpenCode Go to the provider/source table and state that it uses the shared default/custom polling interval, one-second countdowns, reset-boundary refresh, and ten-minute stale horizon without exhausted backoff.

- [ ] **Step 4: Run the exact documentation GREEN gates**

Run: `node --test tests/plugin-wiring.test.mjs tests/provider-opencode-go-contract.test.mjs`

Expected: all documentation and contract tests PASS with 0 failures.

Run: `git diff --check -- README.md tests/plugin-wiring.test.mjs`

Expected: exit 0; the tracked diff contains only synthetic credential values and no raw page content.

- [ ] **Step 5: Commit the GREEN documentation unit atomically**

```bash
git status --short &&
git add README.md tests/plugin-wiring.test.mjs &&
git commit -m "docs(quota): document OpenCode Go setup"
```

### Task 9: Run Automated Release Gates

**OpenSpec:** 4.1

**Files:**
- Verify only; do not modify or commit source, tests, generated artifacts, OpenSpec artifacts, Comet state, or unrelated deleted reports.

**Interfaces:**
- Consumes: Tasks 1-8.
- Produces: command evidence for focused tests, strict typechecking, complete tests, production builds, deployment tests, diff safety, and secret-safe scope.

- [ ] **Step 1: Run focused OpenCode Go and composition tests**

Run: `node --test tests/provider-opencode-go-contract.test.mjs && node tests/compile-presentation.mjs && node --test tests/provider-opencode-go.test.mjs tests/quota-composition.test.mjs tests/presentation-layout.test.mjs tests/shared-boundary.test.mjs`

Expected: contract gate PASS with 5 tests and every focused test PASS with 0 failures.

- [ ] **Step 2: Run strict typechecking**

Run: `npm run typecheck`

Expected: exit 0 from `tsc --noEmit` with no diagnostics.

- [ ] **Step 3: Run the complete automated suite**

Run: `npm test`

Expected: both compile steps and every `tests/*.test.mjs` test PASS with 0 failures.

- [ ] **Step 4: Run production build and build tests**

Run: `npm run build:plugins && node --test tests/plugin-build.test.mjs`

Expected: PASS and exactly these non-empty minified ESM artifacts:

```text
dist/opencode-tools-shared.js
dist/opencode-tools-quota.js
dist/plugins/opencode-tools-tokens.js
```

- [ ] **Step 5: Run deployment tests**

Run: `node --test tests/plugin-deploy.test.mjs`

Expected: PASS with idempotent local/global fixtures, nested option preservation, and exact three-artifact parity.

- [ ] **Step 6: Verify diff and secret-safe scope**

Run: `git diff --check && git diff --name-status f94168f...HEAD && git status --short`

Expected: implementation changes are limited to paths named in Tasks 1-8. The only unrelated worktree entries are deleted `task-7-report.md`, `task-9-report.md`, and `task-10-report.md`. No `.opencode/tui.json`, temporary HTML, HAR, screenshot, log, or credential-bearing report is tracked.

**Commit checkpoint:** No commit. `dist/` and `.tmp-test/` are ignored verification outputs. Task 9 ends GREEN only when every command above passes.

### Task 10: Deploy Locally And Perform Live Secret-Safe Validation

**OpenSpec:** 4.2

**Files:**
- Local ignored configuration only: `.opencode/tui.json`
- Generated ignored deployment: `.opencode/opencode-tools-shared.js`
- Generated ignored deployment: `.opencode/opencode-tools-quota.js`
- Generated ignored deployment: `.opencode/plugins/opencode-tools-tokens.js`
- Never modify tracked `tui.json` with a live secret.

**Interfaces:**
- Consumes: a real workspace ID and auth-cookie value entered manually by the credential owner without agent inspection.
- Produces: byte-for-byte deployment parity and manual behavioral evidence; no credential-bearing report, capture, screenshot, or commit is created.

- [ ] **Step 1: Verify the local config path is ignored before manual configuration**

Run: `git check-ignore -v .opencode/tui.json && git status --short --untracked-files=all`

Expected: `.opencode/tui.json` is ignored and absent from status; only intended branch changes and the three unrelated report deletions appear. Do not read or print the file.

The credential owner edits `.opencode/tui.json` directly in a local editor and adds `quota.opencodego.workspaceId` plus `quota.opencodego.workspaceToken` to the quota plugin options. The implementation worker must not open, read, diff, copy, quote, or shell-expand those values.

- [ ] **Step 2: Deploy locally from the GREEN build**

Run: `npm run deploy:local`

Expected: `Deployed opencode-tools plugins to .../.opencode`; the command prints no options or credentials and deploys exactly three artifacts.

- [ ] **Step 3: Verify byte-for-byte artifact parity**

Run: `cmp -s dist/opencode-tools-shared.js .opencode/opencode-tools-shared.js && cmp -s dist/opencode-tools-quota.js .opencode/opencode-tools-quota.js && cmp -s dist/plugins/opencode-tools-tokens.js .opencode/plugins/opencode-tools-tokens.js`

Expected: exit 0.

- [ ] **Step 4: Restart OpenCode and validate without request logging**

The credential owner verifies each item manually:

```text
sidebar 5H/7D/1M percentages and reset durations match the authenticated Go page
countdowns update once per second
default polling and a temporary custom refreshIntervalSeconds are observable
opencode-go and opencode-go-subscription promote and immediately refresh one adapter
switching providers retains ready/stale OpenCode Go under Other providers
remaining and used modes are complementary while colors follow remaining quota
a temporary network interruption marks bounded data ~stale and later success restores ready
removing or expiring workspaceToken clears rows and shows Configuration required
malformed hydration fails closed as Usage unavailable
extended, semi-collapsed, and collapsed quota layouts remain within 37 columns
no terminal output, report, screenshot, capture, or shell history contains either credential
```

- [ ] **Step 5: Remove live values and confirm repository safety**

The credential owner removes the live `opencodego` object or restores the prior ignored local configuration in an editor. Rotate the console session if it was exposed anywhere outside that ignored file.

Run: `git status --short --untracked-files=all && git diff --name-status f94168f...HEAD`

Expected: no local config, full HTML, HAR, screenshot, log, or secret-bearing path is tracked; the three unrelated report deletions remain unstaged and absent from implementation commits.

**Commit checkpoint:** No commit. Deployment outputs and live credentials remain ignored and local. Task 10 ends GREEN only after parity and every live checklist item passes.

## Final Acceptance Checklist

- [ ] Completed Task 1 remains unchanged, passed before production transport/parser work, and contains only minimal synthetic page-contract data.
- [ ] All 13 OpenSpec checkboxes map across Tasks 1-10; OpenSpec 1.3 is partial in Task 3 and complete in Task 4, while OpenSpec 1.4 is partial in Task 5 and complete in Task 6.
- [ ] Every implementation task records an exact RED failure, adds only the minimal paired implementation, runs exact GREEN gates, and commits no failing test or build state.
- [ ] Native configuration is exactly `quota.opencodego.{workspaceId, workspaceToken}` and no redirectable origin, URL, header, or cookie option exists.
- [ ] Transport is fixed GET HTML with `Accept`, `auth` cookie, manual redirects, and one 20-second abort timeout per request.
- [ ] Task 1 fixture lines remain exactly `rollingUsage:$R[0]=...`, `weeklyUsage:$R[1]=...`, and `monthlyUsage:$R[2]=...` in order, with only `status:"ok"` and synthetic numeric fields.
- [ ] Production parsing uses one bounded HTML lexical pass and bounded per-script JavaScript lexical passes; only actual script bodies and unambiguous code-state `${name}:$R` candidates participate in the exactly-one `<name>:$R[digits]=` and literal `{status:"ok",resetInSec:<number>,usagePercent:<number>}` checks.
- [ ] HTML comments, quoted attributes, visible/raw-text elements, JavaScript strings/templates/comments, truncated suffix slices, malformed/unclosed constructs, malformed/duplicate markers, overflow, and captures over 4,096 code units all reject or remain ignored as specified; exact 1,000,000/1,000,001 HTML and 4,096/4,097 record boundaries are covered.
- [ ] Candidate-free division, regex, and template-expression scripts do not invalidate quota markers in another actual script body; ambiguous slash-line or post-`${` remainders reject only when bounded `hasMarkerCandidate` finds one of the three fixed prefixes, with same-line post-division markers documented as a scoped false-negative rejection.
- [ ] No `.*`, broad `[^}]+`, DOM or parser dependency, script execution, object-literal JSONification, general object conversion, visible-text scraping, local estimate, partial snapshot, or credential-bearing diagnostic exists.
- [ ] `/Users/aam/.graphify/repos/ridho9/opencode-go-usage/index.js:137-149` remains evidence only and is neither imported nor copied into repository artifacts.
- [ ] OpenCode Go displays `OpenCode GO:`, 5H, 7D, and 1M in order; compact summary contains only 5H/7D.
- [ ] Authentication, protocol drift, transient failure, stale expiry, reset boundaries, request serialization, one-second countdowns, and disposal match the canonical spec.
- [ ] Both runtime aliases select and refresh one quota-sidebar adapter while other ready/stale providers remain visible.
- [ ] Renderer, 37-column max-width behavior, generic provider interface, legacy home construction, generic polling architecture, and three-artifact deployment remain unchanged.
- [ ] Focused tests, typecheck, complete suite, production build, deployment tests, local parity, and live checks pass.
- [ ] No real workspace ID, token, usage/reset value, full HTML, or temporary capture is committed, printed, or persisted.
- [ ] `task-7-report.md`, `task-9-report.md`, and `task-10-report.md` are never restored, staged, edited, or committed.
