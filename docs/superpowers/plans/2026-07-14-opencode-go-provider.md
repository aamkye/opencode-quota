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
- Only the purpose-built Task 1 sanitizer may read ignored `.opencode/tui.json` credentials programmatically; the credential owner may edit them directly for Task 13 live validation. Credentials, raw HTML, request headers, real identifiers, and real usage/reset values must never be printed, logged, reported, persisted, committed, or included in an exception message.
- The sanitizer fetches the authenticated page once and the unauthenticated redirect once, accepts only exact markers shaped `<name>:$R[<digits>]=` followed by a bounded flat object, replaces hydration indexes and observed numeric data with synthetic values in memory, writes only allowlist-validated minimal fixtures, and self-deletes from the approved temporary directory. Never open, inspect, or reuse the existing unsafe full-HTML temporary capture.
- Exact quota data comes only from exactly one bounded Solid hydration assignment for each of `rollingUsage`, `weeklyUsage`, and `monthlyUsage`: `rollingUsage:$R[digits]=`, `weeklyUsage:$R[digits]=`, and `monthlyUsage:$R[digits]=`. Each assignment must use the observed flat `{status:"ok",resetInSec:<number>,usagePercent:<number>}` shape; the parser validates and discards `status`. Visible text, localized labels, local cost estimates, and broad object searches are forbidden.
- Safe reference evidence is limited to `/Users/aam/.graphify/repos/ridho9/opencode-go-usage/index.js:137-149`, which confirms the three marker shapes. Do not add that external file to this repository, copy its permissive `[^}]+` captures, or copy its object-literal-to-JSON conversion.
- The request is exactly `GET https://opencode.ai/workspace/<encodeURIComponent(workspaceId)>/go` with `Accept: text/html`, `Cookie: auth=<workspaceToken>`, `redirect: "manual"`, no body, and a 20,000ms timeout.
- The origin is a source constant. No option, redirect, response, fixture, or dependency injection point may alter `https://opencode.ai` or forward the cookie to another origin.
- The parser receives only an HTML string and receipt timestamp. It never receives configuration and never uses `eval`, `Function`, DOM/script execution, a JavaScript parser, JSONification of object literals, general object conversion, visible-text scraping, recursive property search, `.*`, or broad `[^}]+` capture.
- Reject the complete response for missing, malformed, or duplicate markers, input over 1,000,000 UTF-16 code units, a record capture over 4,096 code units, additional fields outside the literal allowlist, nested-object/prototype/comment/string tricks, non-finite numbers, `usagePercent` outside `0..100`, negative `resetInSec`, or a non-finite computed reset epoch. Never return a partial snapshot.
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
- Create `tests/provider-opencode-go.test.mjs`: configuration, security, parser, transport, mapper, polling, reset, stale, and disposal tests.
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
| 1.2 | 2 | RED nested-option, fixed-origin, and credential-safety tests |
| 1.3 | 3 | RED bounded parser, transport classification, and semantic mapper tests |
| 1.4 | 4 | RED no-config, polling, serialization, boundary, stale, disposal, alias, and ordering tests |
| 2.1 | 5 | Native `quota.opencodego` normalization |
| 2.2 | 6 | Fixed authenticated page request and strict atomic hydration parser |
| 2.3 | 7 | 5H/7D/1M panel and compact summary mapping |
| 2.4 | 8 | Shared-interval lifecycle with serialized and disposal-safe refreshes |
| 3.1 | 9 | Shared facade exports, adapter construction, and runtime aliases |
| 3.2 | 10 | Three-provider composition and deployment-option regressions |
| 3.3 | 11 | Local secret and undocumented hydration-contract documentation |
| 4.1 | 12 | Focused, typecheck, complete-suite, build, and deployment gates |
| 4.2 | 13 | Local deployment, artifact parity, and live secret-safe validation |

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
  assert.deepEqual(manifest().request, {
    method: "GET",
    url: "https://opencode.ai/workspace/wrk_TESTWORKSPACE/go",
    headers: { Accept: "text/html", Cookie: "auth=TOKEN_TEST_ONLY_DO_NOT_USE" },
    redirect: "manual",
    timeoutMs: 20000,
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

### Task 2: Add RED Native-Option And Secret-Safety Tests

**OpenSpec:** 1.2

**Files:**
- Create: `tests/provider-opencode-go.test.mjs`
- Modify: `tests/compile-presentation.mjs:4-20`
- Modify: `tests/quota-composition.test.mjs`

**Interfaces:**
- Consumes: Task 1 synthetic sentinels and existing `normalizeQuotaOptions(value?: TuiPluginOptions)`.
- Produces tests for `OpenCodeGoOptions`, immutable `OpenCodeGoConfig`, `normalizeOpenCodeGoConfig(value: unknown): OpenCodeGoConfig | null`, and `NormalizedQuotaOptions.openCodeGo`.
- Required native input: `quota.opencodego.{workspaceId, workspaceToken}`; no native `openCodeGo`, `cookie`, origin, URL, or header option exists.

- [ ] **Step 1: Add the provider test bundle entry**

Add `provider-opencode-go` to the cleanup names and this tuple after `provider-openai` in `tests/compile-presentation.mjs`:

```javascript
["tui/providers/opencode-go.ts", ".tmp-test/provider-opencode-go.mjs", ["browser"]],
```

- [ ] **Step 2: Write failing normalization tests**

Create `tests/provider-opencode-go.test.mjs` with imports and focused tests:

```javascript
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const providerModule = await import("../.tmp-test/provider-opencode-go.mjs")
const sentinel = {
  workspaceId: "wrk_TESTWORKSPACE",
  workspaceToken: "TOKEN_TEST_ONLY_DO_NOT_USE",
}

test("OpenCode Go options normalize valid credentials without diagnostics", () => {
  const config = providerModule.normalizeOpenCodeGoConfig({
    workspaceId: " wrk_TESTWORKSPACE ",
    workspaceToken: " TOKEN_TEST_ONLY_DO_NOT_USE ",
  })
  assert.deepEqual(config, sentinel)
  assert.equal(Object.isFrozen(config), true)
})

test("OpenCode Go options reject missing malformed blank and line-bearing values", () => {
  for (const value of [
    undefined,
    {},
    { workspaceId: "workspace", workspaceToken: sentinel.workspaceToken },
    { workspaceId: sentinel.workspaceId, workspaceToken: "" },
    { workspaceId: sentinel.workspaceId, workspaceToken: "x\r\nX-Test: leaked" },
  ]) assert.equal(providerModule.normalizeOpenCodeGoConfig(value), null)
})
```

Add a focused composition test named `OpenCode Go options normalize through native quota options` in `tests/quota-composition.test.mjs`:

```javascript
test("OpenCode Go options normalize through native quota options", () => {
  assert.equal(normalizeQuotaOptions().openCodeGo, null)
  assert.deepEqual(normalizeQuotaOptions({
    quota: { opencodego: sentinel },
  }).openCodeGo, sentinel)
  assert.equal(normalizeQuotaOptions({
    quota: { opencodego: { workspaceId: "bad", workspaceToken: "x" } },
  }).openCodeGo, null)
})
```

- [ ] **Step 3: Write failing fixed-origin and diagnostic-safety tests**

Name these tests with the prefix `OpenCode Go transport`, so Task 5's option-only GREEN gate skips them. Read the synthetic manifest only. Inject a fetch spy and assert the eventual request uses the manifest URL, method, headers, `redirect: "manual"`, and an `AbortSignal`; ensure no API accepts an origin override. For rejected fetch, malformed response, and authentication response cases, capture returned values, thrown messages, and `console.error` arguments, then assert all serialized diagnostics exclude both sentinel fields:

```javascript
for (const secret of Object.values(sentinel)) {
  assert.equal(JSON.stringify({ results, errors, diagnostics }).includes(secret), false)
}
```

- [ ] **Step 4: Run the exact RED gate**

Run: `node tests/compile-presentation.mjs`

Expected: FAIL from esbuild with `Could not resolve "tui/providers/opencode-go.ts"`.

- [ ] **Step 5: Commit the RED tests only**

```bash
git status --short &&
git add tests/compile-presentation.mjs tests/provider-opencode-go.test.mjs tests/quota-composition.test.mjs &&
git commit -m "test(quota): specify OpenCode Go options"
```

### Task 3: Add RED Transport, Parser, And Mapper Tests

**OpenSpec:** 1.3

**Files:**
- Modify: `tests/provider-opencode-go.test.mjs`

**Interfaces:**
- Consumes: Task 1 `success.html` with exact `rollingUsage:$R[0]=`, `weeklyUsage:$R[1]=`, and `monthlyUsage:$R[2]=` synthetic markers, request manifest, and login redirect fixture.
- Produces tests for `parseOpenCodeGoHydration(html: string, receivedAt: number): OpenCodeGoQuotaData | null`, `fetchOpenCodeGoQuota(config: OpenCodeGoConfig, signal: AbortSignal, dependencies: OpenCodeGoFetchDependencies): Promise<OpenCodeGoFetchResult>`, `openCodeGoHomeQuotaSummary(data)`, and `mapOpenCodeGoPanelState(state)`.

- [ ] **Step 1: Add atomic bounded-parser success and rejection cases**

At `const now = Date.UTC(2026, 6, 14, 12, 0, 0)`, assert the synthetic fixture maps exactly to:

```javascript
{
  fiveHour: { usedPct: 12.5, remainingPct: 87.5, resetEpoch: now + 1_800_000 },
  weekly: { usedPct: 34, remainingPct: 66, resetEpoch: now + 172_800_000 },
  monthly: { usedPct: 56.75, remainingPct: 43.25, resetEpoch: now + 1_209_600_000 },
}
```

Start from the three exact synthetic marker lines in Task 1. First replace indexes `0`, `1`, and `2` with other nonempty digit sequences and assert production parsing still succeeds; index values are hydration metadata, not quota data. Reorder the source assignments and assert the returned semantic object still maps rolling/weekly/monthly to 5H/7D/1M. Add a valid variant containing an unrelated `monthlyUsage:` identifier outside the exact marker and assert it is ignored. Add table-driven mutations that independently remove and duplicate each complete assignment and duplicate a valid marker beside a malformed `${name}:$R` candidate for the same record name. Replace `$R[0]` with `$R[x]`, `$R[-1]`, `$R["0"]`, `$R[ 0 ]`, `$R[]`, and `$R [0]`; every malformed marker candidate must reject the complete snapshot. Replace each numeric literal with `NaN`, `Infinity`, `-Infinity`, `-1`, and for percentages `101`; use `1e309` for finite-grammar overflow.

Add inputs over 1,000,000 code units, record captures over 4,096 code units, comments or whitespace between marker/object/fields, quoted numeric values, non-`ok` status strings, marker-shaped strings, nested objects, arrays, getters, methods, spreads, extra fields, `__proto__`, fragments placed only in visible `<div>` text, and a valid script marker duplicated in visible text. Assert every invalid case returns `null`, leaves the input unchanged, and exposes no partial data.

- [ ] **Step 2: Add status/content-type/redirect transport classification tests**

Use real `Response` objects and one non-aborted `AbortController.signal`. Assert this exact matrix:

```text
success                  200 + text/html (parameters allowed) + valid fixture
authentication-required  401; 403; manual same-origin /login or /auth redirect
transient-failure        fetch rejection; AbortError; body-read rejection; 408; 429; every 5xx
invalid-response         other 2xx/4xx; cross-origin or non-login redirect; 200 non-HTML; malformed/oversized HTML; any parser rejection
```

Assert `fetch` receives exactly one call with:

```javascript
[
  "https://opencode.ai/workspace/wrk_TESTWORKSPACE/go",
  {
    method: "GET",
    headers: { Accept: "text/html", Cookie: "auth=TOKEN_TEST_ONLY_DO_NOT_USE" },
    redirect: "manual",
    signal,
  },
]
```

Assert a redirect body is never read, redirects are never followed, and serialized results/diagnostics contain no sentinel credential.

- [ ] **Step 3: Add semantic mapper tests**

Assert stable IDs, orders, labels, values, and timer labels:

```javascript
[
  ["opencode-go:header", 10, "OpenCode GO:"],
  ["opencode-go:5h", 20, "5H", 87.5],
  ["opencode-go:5h-reset", 30, "5H reset"],
  ["opencode-go:7d", 40, "7D", 66],
  ["opencode-go:7d-reset", 50, "7D reset"],
  ["opencode-go:1m", 60, "1M", 43.25],
  ["opencode-go:1m-reset", 70, "1M reset"],
]
```

Cover `idle` at 100% remaining, `countdown` before reset, `expired` at/after reset, stale marker order 15, no rows for `configuration-required` or `unavailable`, details `Configuration required` and `Usage unavailable`, and compact summary `{ provider: "OpenCode GO", plan: "Subscription", primaryPct: 87.5, secondaryPct: 66 }`.

- [ ] **Step 4: Run the exact RED gate**

Run: `node tests/compile-presentation.mjs`

Expected: FAIL with the same missing `tui/providers/opencode-go.ts` resolution error.

- [ ] **Step 5: Commit the RED tests**

```bash
git status --short &&
git add tests/provider-opencode-go.test.mjs &&
git commit -m "test(quota): specify OpenCode Go page parsing"
```

### Task 4: Add RED Lifecycle And Composition Tests

**OpenSpec:** 1.4

**Files:**
- Modify: `tests/provider-opencode-go.test.mjs`
- Modify: `tests/quota-composition.test.mjs`

**Interfaces:**
- Consumes: `createOpenCodeGoProvider(api, options)` and existing `composeQuotaPanel`, `selectedQuotaProviderID`, `selectedSessionQuotaProviderID`, and `createQuotaSelection` functions.
- Produces: fake-clock lifecycle coverage and aggregate alias/refresh/order regression tests.

- [ ] **Step 1: Add the fake-clock provider harness**

Mirror the established OpenAI test clock: intercepted timeout/interval handles expose `active`, `delay`, `callback`, and `unref()`. Construct with this exact options shape:

```javascript
{
  config: {
    workspaceId: "wrk_TESTWORKSPACE",
    workspaceToken: "TOKEN_TEST_ONLY_DO_NOT_USE",
  },
  refreshIntervalMs: 2500,
  fetch: testFetch,
}
```

Each test cleanup disposes the adapter, settles deferred requests, restores globals, and asserts zero active timers.

- [ ] **Step 2: Add failing lifecycle cases**

Add tests prefixed `OpenCode Go lifecycle` that prove:

```text
valid construction refreshes immediately
null configuration sends no request and displays Configuration required
default polling is 10000ms and custom polling is 2500ms
countdown time updates every 1000ms
each request has one 20000ms abort timeout
manual refresh and poll triggers share one in-flight promise
ordinary triggers during a request do not queue another request
a boundary crossed during an older request queues exactly one refresh after settlement
the nearest future 5H/7D/1M boundary is scheduled and later boundaries advance in order
success followed by transient failure retains data as stale
success after stale returns ready
stale data disappears only after more than 600000ms
authentication-required clears data into configuration-required immediately
invalid-response clears data into unavailable immediately
disposal aborts in-flight work and clears poll/tick/boundary/timeout handles
late resolution/rejection after disposal cannot mutate state or start queued work
```

Use this focused missing-configuration case so the acceptance test depends on the adapter implemented in Task 8 rather than Task 5's normalizer:

```javascript
test("OpenCode Go lifecycle sends no request without valid configuration", async (t) => {
  let requests = 0
  const adapter = createTestAdapter(t, {
    config: null,
    fetch: async () => {
      requests += 1
      throw new Error("unexpected request")
    },
  })
  await adapter.refresh()
  assert.equal(requests, 0)
  assert.equal(item(adapter.panel(), "opencode-go:header").detail, "Configuration required")
})
```

- [ ] **Step 3: Add failing aliases, active refresh, and ordering cases**

Create a fake adapter with `id: "opencode-go"`, `order: 130`, 5H/7D/1M rows, and 5H/7D home summary. Assert:

```javascript
assert.equal(selectedQuotaProviderID([{ id: "opencode-go" }], providers), "opencode-go")
assert.equal(selectedQuotaProviderID([{ id: "opencode-go-subscription" }], providers), "opencode-go")
```

Extend the reactive selection test so a latest user message switching to `opencode-go-subscription` performs one immediate OpenCode Go refresh and promotes its quota group. Switching to OpenAI promotes OpenAI while ready/stale OpenCode Go remains in `Other providers`; unavailable OpenCode Go is omitted when it is not selected.

- [ ] **Step 4: Run the exact RED gate**

Run: `node tests/compile-presentation.mjs`

Expected: FAIL because `tui/providers/opencode-go.ts` is absent. After Task 5 creates it, the focused lifecycle and alias tests remain RED until Tasks 8 and 9.

- [ ] **Step 5: Commit the RED tests**

```bash
git status --short &&
git add tests/provider-opencode-go.test.mjs tests/quota-composition.test.mjs &&
git commit -m "test(quota): specify OpenCode Go lifecycle"
```

### Task 5: Implement Native OpenCode Go Configuration

**OpenSpec:** 2.1

**Files:**
- Create: `tui/providers/opencode-go.ts`
- Modify: `shared/opencode-tools-shared.ts`
- Modify: `tui/quota.tsx:7-12,28-48,109-124`

**Interfaces:**
- Produces `OpenCodeGoOptions`, `OpenCodeGoConfig`, and `normalizeOpenCodeGoConfig(value: unknown): OpenCodeGoConfig | null`.
- Produces `QuotaPluginOptions.quota?.opencodego` and `NormalizedQuotaOptions.openCodeGo: OpenCodeGoConfig | null`.

- [ ] **Step 1: Confirm the focused option tests are RED**

Run: `node tests/compile-presentation.mjs`

Expected: FAIL with `Could not resolve "tui/providers/opencode-go.ts"`.

- [ ] **Step 2: Add the minimal immutable configuration boundary**

Start `tui/providers/opencode-go.ts` with:

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
  if (!WORKSPACE_ID.test(workspaceId) || !workspaceToken || /[\r\n]/.test(workspaceToken)) return null
  return Object.freeze({ workspaceId, workspaceToken })
}
```

Do not return validation reasons, rejected values, lengths, hashes, prefixes, or suffixes.

- [ ] **Step 3: Normalize the nested native option**

Export the normalizer and types from `shared/opencode-tools-shared.ts`. Extend `tui/quota.tsx` with:

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

Set `DEFAULT_OPTIONS.openCodeGo` to `null` and return `openCodeGo: normalizeOpenCodeGoConfig(input.quota?.opencodego)` from `normalizeQuotaOptions`.

- [ ] **Step 4: Run the focused GREEN gate**

Run: `node tests/compile-presentation.mjs && node --test --test-name-pattern="OpenCode Go options" tests/provider-opencode-go.test.mjs tests/quota-composition.test.mjs`

Expected: PASS for all matching option-normalization tests with 0 failures. Transport, mapper, lifecycle, and integration tests are skipped; no adapter constructor is required by this gate.

- [ ] **Step 5: Commit**

```bash
git status --short &&
git add tui/providers/opencode-go.ts shared/opencode-tools-shared.ts tui/quota.tsx &&
git commit -m "feat(quota): normalize OpenCode Go options"
```

### Task 6: Implement Fixed Page Transport And Atomic Hydration Parsing

**OpenSpec:** 2.2

**Files:**
- Modify: `tui/providers/opencode-go.ts`
- Test: `tests/provider-opencode-go-contract.test.mjs`
- Test: `tests/provider-opencode-go.test.mjs`

**Interfaces:**
- Consumes: Task 1 exact synthetic assignment syntax and `OpenCodeGoConfig`.
- Produces `OpenCodeGoWindow`, `OpenCodeGoQuotaData`, `OpenCodeGoFetchResult`, `OpenCodeGoFetchDependencies`, `parseOpenCodeGoHydration`, and `fetchOpenCodeGoQuota`.

- [ ] **Step 1: Confirm transport/parser tests are RED**

Run: `node tests/compile-presentation.mjs && node --test --test-name-pattern="OpenCode Go transport|OpenCode Go parser" tests/provider-opencode-go.test.mjs`

Expected: FAIL because `parseOpenCodeGoHydration` and `fetchOpenCodeGoQuota` are absent.

- [ ] **Step 2: Add exact semantic and transport types**

```typescript
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

export function parseOpenCodeGoHydration(html: string, receivedAt: number): OpenCodeGoQuotaData | null

export async function fetchOpenCodeGoQuota(
  config: OpenCodeGoConfig,
  signal: AbortSignal,
  dependencies: OpenCodeGoFetchDependencies,
): Promise<OpenCodeGoFetchResult>
```

- [ ] **Step 3: Implement the strict bounded assignment extractor**

Use constants `MAX_HTML_LENGTH = 1_000_000` and `MAX_ASSIGNMENT_LENGTH = 4_096`. Define three descriptors mapping `rollingUsage -> fiveHour`, `weeklyUsage -> weekly`, and `monthlyUsage -> monthly`. The external reference at `/Users/aam/.graphify/repos/ridho9/opencode-go-usage/index.js:137-149` is evidence only for the marker strings; do not import it, bundle it, or copy its `[^}]+` and JSONification approach.

Use this restricted grammar and bounded extraction shape in `tui/providers/opencode-go.ts`:

```typescript
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
```

Scan `<script>` bodies with bounded `indexOf("<script")`, tag-end, and `indexOf("</script>")` operations rather than a dot-all regex. For each descriptor:

```typescript
const markerPattern = new RegExp(String.raw`${record.name}:\$R\[(?<index>\d+)\]=`, "gu")
```

Require exactly one `${record.name}:$R` marker candidate and exactly one exact marker in the complete HTML, then require that same sole exact marker exactly once across extracted script bodies. An unrelated `${record.name}:` identifier is not a marker candidate and is ignored. This still rejects malformed or duplicate `$R` candidates and visible-text-only exact markers. Starting immediately after the script-body marker, take at most `MAX_ASSIGNMENT_LENGTH + 1` code units. Require the first character to be `{`, find the first `}`, reject when it is absent or makes the capture exceed 4,096 code units, and run only `OBJECT_PATTERN` against the complete bounded slice. After the closing brace, allow only observed assignment terminators from the literal set end-of-script, comma, semicolon, closing brace, CR, or LF, with horizontal whitespace before the terminator.

This deliberately admits no whitespace inside `<name>:$R[digits]=` or the observed flat object; Task 1 evidence shows none there. It validates the exact literal `status:"ok"` and discards it. It rejects malformed `$R` indexes, visible text outside scripts, other strings or status values, comments, nested braces, arrays, computed expressions, methods, accessors, spreads, extra fields, quoted/prototype keys, and any unallowlisted property. If the contract gate discovers another shape, stop unless its literal name, order, and scalar grammar can be explicitly allowlisted in Task 1 and mirrored here; never add `.*`, `[^}]+`, recursive search, or general object conversion.

Validate `Number.isFinite(usagePercent)`, `0 <= usagePercent <= 100`, `Number.isFinite(resetInSec)`, `resetInSec >= 0`, and `Number.isFinite(receivedAt + resetInSec * 1000)`. Build data only after all three records pass:

```typescript
{
  usedPct: usagePercent,
  remainingPct: Math.min(100, Math.max(0, 100 - usagePercent)),
  resetEpoch: receivedAt + resetInSec * 1_000,
}
```

- [ ] **Step 4: Implement fixed transport and static classification**

Use `const OPENCODE_ORIGIN = "https://opencode.ai"`. Construct the URL only as:

```typescript
const url = `${OPENCODE_ORIGIN}/workspace/${encodeURIComponent(config.workspaceId)}/go`
```

Call injected fetch with the exact request init from Task 3. Before reading a body, classify 401/403 and manual redirects whose resolved URL remains on `https://opencode.ai` and whose pathname starts with `/login` or `/auth` as `authentication-required`. Classify network/abort/body-read errors, 408, 429, and 500-599 as `transient-failure`. For status 200, require `Content-Type` media type `text/html` case-insensitively while allowing parameters, read text once, and parse it. Every other status, redirect, content type, or parser result is `invalid-response`.

Return only the four discriminated result shapes. Do not log or attach caught values.

- [ ] **Step 5: Run contract and transport GREEN gates**

Run: `node --test tests/provider-opencode-go-contract.test.mjs`

Expected: PASS with 5 tests and 0 failures.

Run: `node tests/compile-presentation.mjs && node --test --test-name-pattern="OpenCode Go transport|OpenCode Go parser" tests/provider-opencode-go.test.mjs`

Expected: PASS for every matching parser, classification, fixed-request, and secret-safety test with 0 failures.

- [ ] **Step 6: Commit**

```bash
git status --short &&
git add tui/providers/opencode-go.ts &&
git commit -m "feat(quota): parse OpenCode Go hydration"
```

### Task 7: Implement Three-Window Semantic Mapping

**OpenSpec:** 2.3

**Files:**
- Modify: `tui/providers/opencode-go.ts`

**Interfaces:**
- Consumes: `OpenCodeGoQuotaData` and existing `PanelModel`/`PanelItem` types.
- Produces `OpenCodeGoPanelPhase`, `OpenCodeGoPanelState`, `openCodeGoHomeQuotaSummary(data)`, and `mapOpenCodeGoPanelState(state): PanelModel`; Task 9 adds the inferred summary shape to the shared `HomeQuotaSummary` union.

- [ ] **Step 1: Confirm mapper tests are RED**

Run: `node tests/compile-presentation.mjs && node --test --test-name-pattern="OpenCode Go mapper" tests/provider-opencode-go.test.mjs`

Expected: FAIL because mapper exports are absent.

- [ ] **Step 2: Add phase/state contracts and compact summary**

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
```

- [ ] **Step 3: Map the exact semantic panel**

Return panel ID `opencode-go`, provider order `130`, title `OpenCode GO`, and group ID `opencode-go:quota`. Ready/stale data starts with header `{ id: "opencode-go:header", order: 10, kind: "header", title: "OpenCode GO:" }`; stale adds `{ id: "opencode-go:stale", order: 15, kind: "text", text: "~stale", status: "warning" }`.

Add progress/timer pairs for 5H at 20/30, 7D at 40/50, and 1M at 60/70 using Task 3 IDs. Timer state is `idle` when remaining is 100, `countdown` when reset epoch is greater than `now`, and `expired` otherwise. `configuration-required` uses header detail `Configuration required`; `loading` uses `Loading OpenCode GO...`; `unavailable` uses `Usage unavailable`. States without data return no quota rows or collapsed provider summary.

- [ ] **Step 4: Run the mapper GREEN gate**

Run: `node tests/compile-presentation.mjs && node --test --test-name-pattern="OpenCode Go mapper" tests/provider-opencode-go.test.mjs`

Expected: PASS with 0 failures.

- [ ] **Step 5: Commit**

```bash
git status --short &&
git add tui/providers/opencode-go.ts &&
git commit -m "feat(quota): map OpenCode Go windows"
```

### Task 8: Implement Polling And Disposal-Safe Lifecycle

**OpenSpec:** 2.4

**Files:**
- Modify: `tui/providers/opencode-go.ts`

**Interfaces:**
- Consumes: `QuotaProviderOptions`, `QuotaProviderAdapter`, normalized config, transport, and mapper.
- Produces `OpenCodeGoProviderOptions` and `createOpenCodeGoProvider(api, options): QuotaProviderAdapter`.

- [ ] **Step 1: Confirm lifecycle tests are RED**

Run: `node tests/compile-presentation.mjs && node --test --test-name-pattern="OpenCode Go lifecycle" tests/provider-opencode-go.test.mjs`

Expected: FAIL because `createOpenCodeGoProvider` is absent.

- [ ] **Step 2: Add the provider construction interface**

```typescript
export type OpenCodeGoProviderOptions = QuotaProviderOptions & {
  config: OpenCodeGoConfig | null
  fetch?: typeof globalThis.fetch
}

export function createOpenCodeGoProvider(
  _api: TuiPluginApi,
  options: OpenCodeGoProviderOptions,
): QuotaProviderAdapter
```

Use `createRoot`, `createSignal`, `createEffect`, and `onCleanup`. Keep local non-reactive fields for `disposed`, `refreshInFlight`, `refreshStartedAt`, `pendingBoundary`, and `activeController`. `_api` exists only for constructor consistency; do not read provider keys, state, KV, or lifecycle secrets from it.

- [ ] **Step 3: Implement immediate refresh and result transitions**

For `config: null`, initialize `configuration-required`, schedule no polling or boundary work, and make `refresh()` resolve without fetch. For valid config, initialize `loading`, schedule polling/ticks, and call `refresh()` immediately.

Each request creates an `AbortController`, schedules exactly one 20,000ms abort timeout, and calls Task 6 transport with `{ fetch: options.fetch ?? globalThis.fetch, now: Date.now }`. Apply results only while not disposed:

```text
success                 replace data; ready; update lastSuccessAt
authentication-required clear data; configuration-required
invalid-response        clear data; unavailable
transient with data     retain data; stale
transient without data  unavailable
```

- [ ] **Step 4: Implement polling, countdown, stale expiry, and boundaries**

Normalize `refreshIntervalMs` to a finite positive value or 10,000ms. Use one interval for polling and one 1,000ms interval to update `now` and expire data when `current - lastSuccessAt > 600_000`. Do not add exhausted backoff.

After each success, schedule one timeout for the minimum reset epoch strictly greater than `Date.now()` across all three windows. Track the last refreshed boundary so a past epoch cannot loop. If a boundary fires while a request started before that boundary remains in flight, retain only the latest pending boundary epoch and start one follow-up refresh after settlement. Manual, polling, and active-selection refresh calls during an in-flight request return the same promise and queue nothing.

- [ ] **Step 5: Make disposal final**

`dispose()` sets `disposed`, clears pending boundary state, aborts the active controller, and disposes the Solid root. Every asynchronous continuation checks `disposed` before state mutation, rescheduling, or queued refresh. `setSessionID` is a no-op. Return home summary for ready or stale data, and map `configuration-required` freshness to `unavailable` so selected state remains renderable while unselected unavailable state is omitted by composition.

- [ ] **Step 6: Run the lifecycle GREEN gate**

Run: `node tests/compile-presentation.mjs && node --test --test-name-pattern="OpenCode Go lifecycle" tests/provider-opencode-go.test.mjs`

Expected: PASS with 0 failures, one request maximum in flight, and no active fake timers after cleanup.

- [ ] **Step 7: Commit**

```bash
git status --short &&
git add tui/providers/opencode-go.ts &&
git commit -m "feat(quota): schedule OpenCode Go refreshes"
```

### Task 9: Integrate The Provider Through The Shared Boundary

**OpenSpec:** 3.1

**Files:**
- Modify: `tui/providers/types.ts:5-21`
- Modify: `shared/opencode-tools-shared.ts`
- Modify: `tui/quota.tsx:7-12,63-69,342-348`
- Modify: `tests/shared-boundary.test.mjs`
- Modify: `tests/plugin-build.test.mjs`
- Modify: `tsconfig.json:21-31`

**Interfaces:**
- Consumes: `createOpenCodeGoProvider` and normalized `openCodeGo` config.
- Produces: public shared exports, adapter construction, and aliases `opencode-go -> opencode-go` and `opencode-go-subscription -> opencode-go`.

- [ ] **Step 1: Confirm integration tests are RED**

Run: `node tests/compile-presentation.mjs && node --test --test-name-pattern="OpenCode Go integration|shared owns computation|artifacts expose" tests/quota-composition.test.mjs tests/shared-boundary.test.mjs tests/plugin-build.test.mjs`

Expected: FAIL because aliases, adapter construction, summary union, and build assertions are incomplete.

- [ ] **Step 2: Add the summary union member**

In `tui/providers/types.ts` add:

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

- [ ] **Step 3: Complete shared exports and quota-only construction**

Export the constructor, normalizer, options/config/window/data/result/dependency/panel/summary types, parser, fetcher, mapper, and summary helper from `shared/opencode-tools-shared.ts`.

Add to `ADAPTER_ID_BY_PROVIDER_ID` in `tui/quota.tsx`:

```typescript
"opencode-go": "opencode-go",
"opencode-go-subscription": "opencode-go",
```

Append after OpenAI construction:

```typescript
providers.push(createOpenCodeGoProvider(api, {
  config: options.openCodeGo,
  refreshIntervalMs: options.refreshIntervalMs,
}))
```

Do not instantiate OpenCode Go in `tui/home.tsx`, add a renderer branch, or change `QuotaProviderAdapter`.

- [ ] **Step 4: Extend boundary/build/typecheck assertions**

In `tests/shared-boundary.test.mjs`, assert the shared facade directly exports `createOpenCodeGoProvider`, and quota/home/token loadable sources do not import `tui/providers/opencode-go.ts` except through the shared facade. In `tests/plugin-build.test.mjs`, assert shared build inputs include `/tui/providers/opencode-go.ts`, quota/tokens inputs exclude provider implementation modules, the built shared module exports the constructor, host Solid remains external, and built result keys remain exactly `shared`, `quota`, and `tokens`.

Add `tui/providers/opencode-go.ts` to `tsconfig.json` immediately after `tui/providers/openai.ts`.

- [ ] **Step 5: Run the integration GREEN gate**

Run: `node tests/compile-presentation.mjs && node --test --test-name-pattern="OpenCode Go integration|shared owns computation|artifacts expose" tests/quota-composition.test.mjs tests/shared-boundary.test.mjs tests/plugin-build.test.mjs`

Expected: PASS with 0 failures and exactly the existing three build results.

- [ ] **Step 6: Commit**

```bash
git status --short &&
git add tui/providers/types.ts shared/opencode-tools-shared.ts tui/quota.tsx tests/shared-boundary.test.mjs tests/plugin-build.test.mjs tsconfig.json &&
git commit -m "feat(quota): integrate OpenCode Go provider"
```

### Task 10: Verify Three-Provider Aggregate Behavior

**OpenSpec:** 3.2

**Files:**
- Modify: `tests/quota-composition.test.mjs`
- Modify: `tests/plugin-deploy.test.mjs`
- Modify only if a test proves necessary: `tui/quota.tsx`

**Interfaces:**
- Consumes: integrated adapter and unchanged generic composition functions.
- Produces: provider priority/retention, compact summary, remaining/used conversion, color threshold, sorting, max-width, native option forwarding, and deployment-option coverage.

- [ ] **Step 1: Add aggregate assertions before production changes**

Add `three providers preserve OpenCode Go aggregate semantics` using Z.AI, OpenAI, and OpenCode Go adapters. Assert:

```text
selected OpenCode Go quota group is first
ready/stale Z.AI and OpenAI remain under Other providers
switching selection moves only the selected provider
collapsed remaining summary is 88%/66%
collapsed used summary is 13%/34%
expanded used 5H/7D/1M rows are 12.5/34/56.75
progress status still derives from remaining percentage in used mode
1M remains expanded-only
secondary sorting follows configured metric and direction
rendered extended/semi-collapsed/collapsed layouts remain within 37 cells
```

Extend the existing normalized polling test to three adapters and assert OpenCode Go receives the shared `refreshIntervalMs`. Serve Task 1 HTML only for the fixed URL and exact synthetic cookie.

- [ ] **Step 2: Run the composition RED/GREEN diagnostic gate**

Run: `node tests/compile-presentation.mjs && node --test --test-name-pattern="OpenCode Go|three providers|forwards normalized|max-width" tests/quota-composition.test.mjs tests/presentation-layout.test.mjs`

Expected: PASS if Task 9 uses generic composition correctly. A failure must identify a missing alias/forwarding/composition detail; make only that minimal correction in `tui/quota.tsx`, never the renderer or generic polling code.

- [ ] **Step 3: Add deployment option preservation coverage**

Extend `localOptions` in `tests/plugin-deploy.test.mjs`:

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

Assert local/global cleanup preserves the nested options on the selected `./opencode-tools-quota.js` entry, remains idempotent, and copies exactly the same three artifacts.

- [ ] **Step 4: Run composition/deployment GREEN gates**

Run: `node tests/compile-presentation.mjs && node --test tests/quota-composition.test.mjs tests/presentation-layout.test.mjs tests/plugin-deploy.test.mjs`

Expected: PASS with 0 failures and no renderer snapshot changes outside existing width behavior.

- [ ] **Step 5: Commit**

```bash
git status --short &&
git add tests/quota-composition.test.mjs tests/plugin-deploy.test.mjs tui/quota.tsx &&
git commit -m "test(quota): verify three-provider composition"
```

### Task 11: Document Local Secret Configuration And Limitations

**OpenSpec:** 3.3

**Files:**
- Modify: `README.md:8-10,29-99,152-202`
- Modify: `tests/plugin-wiring.test.mjs`

**Interfaces:**
- Consumes: final nested option names and behavior.
- Produces: user instructions containing only the synthetic workspace/token values.

- [ ] **Step 1: Write the documentation regression assertions**

Extend `tests/plugin-wiring.test.mjs` with a test named `documents secret-safe OpenCode Go configuration` that reads `README.md` and requires these literal strings:

```text
quota.opencodego.workspaceId
quota.opencodego.workspaceToken
workspaceToken is the plaintext auth cookie value
https://opencode.ai
rolling 5H
weekly 7D
subscription month 1M
undocumented Solid hydration contract
```

Use this exact assertion shape so the documentation describes only the authenticated page contract and cannot acquire an unsafe credential example:

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
  ]) assert.equal(readme.includes(text), true, `missing README text: ${text}`)

  assert.doesNotMatch(readme, /private (?:JSON|query) endpoint/i)
  assert.doesNotMatch(readme, /[".]openCodeGo[".]/)
  assert.doesNotMatch(readme, /(?:copy|save|export).{0,40}(?:full HTML|response body|HAR)/i)
  const tokenValues = [...readme.matchAll(/"workspaceToken"\s*:\s*"([^"]+)"/g)].map((match) => match[1])
  assert.deepEqual(tokenValues, ["TOKEN_TEST_ONLY_DO_NOT_USE"])
})
```

- [ ] **Step 2: Run the documentation test to verify it fails**

Run: `node --test tests/plugin-wiring.test.mjs tests/provider-opencode-go-contract.test.mjs`

Expected: FAIL because the README does not yet document OpenCode Go.

- [ ] **Step 3: Add exact local configuration and safety guidance**

Extend the JSON plugin options example with:

```json
"quota": {
  "opencodego": {
    "workspaceId": "wrk_TESTWORKSPACE",
    "workspaceToken": "TOKEN_TEST_ONLY_DO_NOT_USE"
  }
}
```

Document that `workspaceToken` is the plaintext `auth` cookie value stored only in local `.opencode/tui.json`; it must never be committed or shared and must be replaced when the console session expires or is revoked. State that requests are fixed to `https://opencode.ai`, the values do not replace the inference API key, exact remaining usage covers rolling 5H/weekly 7D/subscription-month 1M windows, and the provider fails closed if the undocumented Solid hydration contract changes. Explicitly state there is no visible-text scraper or local-estimate fallback.

Update the provider/source tables and polling description without claiming the OpenCode Go adapter uses exhausted backoff.

- [ ] **Step 4: Run documentation GREEN and secret-safety gates**

Run: `node --test tests/plugin-wiring.test.mjs tests/provider-opencode-go-contract.test.mjs`

Expected: PASS with 0 failures.

Run: `git diff --check -- README.md tests/plugin-wiring.test.mjs tests/provider-opencode-go-contract.test.mjs`

Expected: exit 0. Inspect only the tracked diff; it contains synthetic values and no private local config.

- [ ] **Step 5: Commit**

```bash
git status --short &&
git add README.md tests/plugin-wiring.test.mjs &&
git commit -m "docs(quota): document OpenCode Go setup"
```

### Task 12: Run Automated Release Gates

**OpenSpec:** 4.1

**Files:**
- Verify only; do not modify source, tests, generated artifacts, OpenSpec artifacts, Comet state, or unrelated deleted reports.

**Interfaces:**
- Consumes: Tasks 1-11.
- Produces: command evidence for focused tests, strict typechecking, complete tests, production builds, deployment tests, and diff safety.

- [ ] **Step 1: Run focused OpenCode Go and composition tests**

Run: `node --test tests/provider-opencode-go-contract.test.mjs`

Expected: PASS with 5 tests and 0 failures.

Run: `node tests/compile-presentation.mjs && node --test tests/provider-opencode-go.test.mjs tests/quota-composition.test.mjs tests/presentation-layout.test.mjs tests/shared-boundary.test.mjs`

Expected: all focused tests PASS with 0 failures.

- [ ] **Step 2: Run strict typechecking**

Run: `npm run typecheck`

Expected: exit 0 from `tsc --noEmit` with no diagnostics.

- [ ] **Step 3: Run the complete automated suite**

Run: `npm test`

Expected: compile steps and every `tests/*.test.mjs` test PASS with 0 failures.

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

Expected: PASS with idempotent local/global fixtures and exact three-artifact parity.

- [ ] **Step 6: Verify diff and secret-safe scope**

Run: `git diff --check && git diff --name-status f94168f...HEAD && git status --short`

Expected: committed implementation changes are limited to paths named in this plan. The only unrelated worktree entries are the three pre-existing deleted reports. No `.opencode/tui.json`, temporary HTML, HAR, screenshot, log, or credential-bearing report is tracked.

**Commit checkpoint:** No commit. `dist/` and `.tmp-test/` are ignored verification outputs.

### Task 13: Deploy Locally And Perform Live Secret-Safe Validation

**OpenSpec:** 4.2

**Files:**
- Local ignored configuration only: `.opencode/tui.json`
- Generated ignored deployment: `.opencode/opencode-tools-shared.js`
- Generated ignored deployment: `.opencode/opencode-tools-quota.js`
- Generated ignored deployment: `.opencode/plugins/opencode-tools-tokens.js`
- Never modify tracked `tui.json` with a live secret.

**Interfaces:**
- Consumes: a real workspace ID and auth-cookie value entered manually into ignored local config without agent inspection.
- Produces: byte-for-byte deployment parity and manual behavioral evidence; no credential-bearing report or capture is created.

- [ ] **Step 1: Verify the local config path is ignored before manual configuration**

Run: `git check-ignore -v .opencode/tui.json && git status --short --untracked-files=all`

Expected: `.opencode/tui.json` is ignored and absent from status; only intended branch changes and the three unrelated deletions appear. Do not read or print the file.

Have the credential owner edit `.opencode/tui.json` directly in a local editor and add `quota.opencodego.workspaceId` plus `quota.opencodego.workspaceToken` to the quota plugin options. The implementation worker must not open, read, diff, copy, or quote those values.

- [ ] **Step 2: Deploy locally**

Run: `npm run deploy:local`

Expected: `Deployed opencode-tools plugins to .../.opencode` and exactly three deployed artifacts. The command must not print plugin options.

- [ ] **Step 3: Verify byte-for-byte artifact parity**

Run: `cmp -s dist/opencode-tools-shared.js .opencode/opencode-tools-shared.js && cmp -s dist/opencode-tools-quota.js .opencode/opencode-tools-quota.js && cmp -s dist/plugins/opencode-tools-tokens.js .opencode/plugins/opencode-tools-tokens.js`

Expected: exit 0.

- [ ] **Step 4: Restart OpenCode and validate manually without logging requests**

The credential owner, not an automated capture, verifies:

```text
sidebar 5H/7D/1M percentages and reset durations match the authenticated Go page
countdowns update once per second
default polling and a temporary custom refreshIntervalSeconds are observable
opencode-go and opencode-go-subscription selection promote and immediately refresh one adapter
switching providers retains ready/stale OpenCode Go under Other providers
remaining and used modes are complementary while colors follow remaining quota
a temporary network interruption marks bounded data ~stale and later success restores ready
removing or expiring workspaceToken clears rows and shows Configuration required
malformed hydration fails closed as Usage unavailable
extended, semi-collapsed, and collapsed quota layouts remain within 37 columns
no terminal output, report, screenshot, capture, or shell history contains either credential
```

- [ ] **Step 5: Remove live values and confirm repository safety**

Have the credential owner remove the live `opencodego` object or restore their prior ignored local configuration in an editor. Rotate the console session if it was exposed anywhere outside that file.

Run: `git status --short --untracked-files=all && git diff --name-status f94168f...HEAD`

Expected: no local config, full HTML, HAR, screenshot, log, or secret-bearing path is tracked; unrelated deleted reports remain unstaged and absent from implementation commits.

**Commit checkpoint:** No commit. Deployment output and live credentials remain ignored and local.

## Final Acceptance Checklist

- [ ] Task 1 passed before production transport/parser work and contains only minimal synthetic page-contract data.
- [ ] OpenSpec tasks 1.1 through 4.2 map one-to-one to Tasks 1 through 13.
- [ ] Native configuration is exactly `quota.opencodego.{workspaceId, workspaceToken}` and no redirectable origin exists.
- [ ] Transport is fixed GET HTML with `Accept`, `auth` cookie, manual redirects, and a 20-second timeout.
- [ ] Task 1 fixture lines are exactly `rollingUsage:$R[0]=...`, `weeklyUsage:$R[1]=...`, and `monthlyUsage:$R[2]=...` in order, with only the observed static `status:"ok"` and synthetic numeric fields.
- [ ] Production parsing requires exactly one `<name>:$R[digits]=` marker and the literal `{status:"ok",resetInSec:<number>,usagePercent:<number>}` shape per record, bounds each capture to 4,096 code units, and rejects the entire snapshot for malformed/duplicate/trick/oversized cases.
- [ ] No `.*`, broad `[^}]+`, script execution, object-literal JSONification, general object conversion, visible-text scraping, local estimate, partial snapshot, or credential-bearing diagnostic exists.
- [ ] `/Users/aam/.graphify/repos/ridho9/opencode-go-usage/index.js:137-149` remains evidence only and is neither imported nor copied into repository artifacts.
- [ ] OpenCode Go displays `OpenCode GO:`, 5H, 7D, and 1M in order; compact summary contains only 5H/7D.
- [ ] Authentication, protocol drift, transient failure, stale expiry, reset boundaries, serialization, and disposal match the canonical spec.
- [ ] Both runtime aliases select and refresh one adapter while other ready/stale providers remain visible.
- [ ] Renderer, max-width behavior, generic provider interface, legacy home construction, and three-artifact deployment remain unchanged.
- [ ] Focused tests, typecheck, complete suite, production build, deployment tests, local parity, and live checks pass.
- [ ] No real workspace ID, token, usage value, full HTML, or temporary capture is committed or printed.
- [ ] `task-7-report.md`, `task-9-report.md`, and `task-10-report.md` are never restored, staged, edited, or committed.
