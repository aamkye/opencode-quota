---
change: add-opencode-go-provider
design-doc: docs/superpowers/specs/2026-07-14-opencode-go-provider-design.md
base-ref: b02cc28142ec45db24587d8fe84da493057e8c19
---

# OpenCode Go Quota Provider Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an optional, secret-safe OpenCode Go quota adapter that retrieves exact 5H, 7D, and 1M usage from the authenticated private `lite.subscription.get` query and participates in the existing quota sidebar.

**Architecture:** Capture and freeze the private structured-query wire contract before writing transport code. Keep configuration validation, transport classification, strict atomic parsing, semantic mapping, and reactive lifecycle in `tui/providers/opencode-go.ts`; expose computation through the shared facade and let `tui/quota.tsx` only normalize options, select adapters, and compose semantic panel data.

**Tech Stack:** TypeScript 6, SolidJS reactive primitives, Node test runner, esbuild test bundles, minified ESM plugin artifacts, native `fetch`/`AbortController`.

## Global Constraints

- Exact usage must come from the structured `lite.subscription.get` console query; HTML extraction and local usage/cost reconstruction are forbidden.
- The contract-capture gate in Task 1 is blocking. If the authenticated structured request cannot be replayed and all three records decoded, report `BLOCKED: lite.subscription.get structured contract could not be reproduced` and stop without starting Task 2.
- The request origin is exactly `https://opencode.ai`; no option may override it.
- `openCodeGo.workspaceId` must match `^wrk_[A-Za-z0-9]+$` and `openCodeGo.cookie` must be non-empty after trimming and contain neither CR nor LF.
- The full Cookie header is a plaintext local secret. Never print, log, snapshot, report, commit, or embed a real cookie, workspace ID, account identifier, or usage value.
- Use `wrk_TESTWORKSPACE`, `session=TEST_SESSION_COOKIE; other=TEST_OTHER_COOKIE`, and synthetic percentages/reset durations in committed fixtures and tests.
- Preserve the three unrelated root deletions exactly as found: `task-7-report.md`, `task-9-report.md`, and `task-10-report.md`. Never restore, stage, or commit them.
- Keep `QuotaProviderAdapter`, the renderer, the legacy `tui/home.tsx` plugin entry, token reporting, and the three-artifact deployment layout unchanged.
- Use remaining percentages inside provider panel data. Aggregate used mode remains `100 - remaining`; threshold colors continue to use remaining values.
- Keep host-owned Solid and OpenTUI dependencies external.
- Every file-changing task uses explicit path-based `git add`; never use `git add .`, `git add -A`, or a command that stages the unrelated deleted reports.
- Before every commit run `git status --short` and verify the only ` D` entries are the three unrelated reports plus the files named by that task.

## File Structure

- Create `tests/fixtures/opencode-go/request-manifest.json`: sanitized observed method, fixed-origin URL shape, required non-secret headers, request body, redirect mode, and JSON pointers into the observed SolidStart success envelope.
- Create `tests/fixtures/opencode-go/success.json`: sanitized raw structured success body with rolling, weekly, and monthly records.
- Create `tests/fixtures/opencode-go/authentication-401.json`: sanitized authentication-failure response metadata/body.
- Create `tests/fixtures/opencode-go/authentication-403.json`: sanitized forbidden response metadata/body.
- Create `tests/fixtures/opencode-go/login-redirect.json`: sanitized login redirect status and `Location` header.
- Create `tests/provider-opencode-go-contract.test.mjs`: capture gate that checks fixture sanitation, exact request metadata, response envelope pointers, and all three usage records without importing production code.
- Create `tests/provider-opencode-go.test.mjs`: configuration, transport, parser, mapper, polling, reset, stale, and disposal behavior.
- Create `tui/providers/opencode-go.ts`: the sole OpenCode Go configuration, transport, semantic mapping, and adapter-lifecycle module.
- Modify `tests/compile-presentation.mjs`: build `.tmp-test/provider-opencode-go.mjs` under browser-compatible conditions.
- Modify `tui/providers/types.ts`: add `OpenCodeGoHomeQuotaSummary` to `HomeQuotaSummary`.
- Modify `shared/opencode-tools-shared.ts`: export OpenCode Go normalization, constructor, and public semantic types.
- Modify `tui/quota.tsx`: accept native options, instantiate the adapter, and map both runtime provider IDs.
- Modify `tests/quota-composition.test.mjs`: cover options, aliases, selection refresh, three-provider retention, summaries, modes, colors, and polling forwarding.
- Modify `tests/shared-boundary.test.mjs`: enforce shared ownership of the third provider.
- Modify `tests/plugin-build.test.mjs`: assert the provider is bundled only into the shared artifact and exported there.
- Modify `tests/plugin-deploy.test.mjs`: preserve `openCodeGo` options through local/global deployment while retaining exactly three artifacts.
- Modify `tsconfig.json`: typecheck `tui/providers/opencode-go.ts`.
- Modify `README.md`: document supported windows, local plaintext-cookie configuration, rotation, non-commit rules, and private-contract limitations.

## OpenSpec Coverage

| OpenSpec task | Plan task | Deliverable |
| --- | ---: | --- |
| 1.1 | 1 | Replayed and sanitized private-query contract plus passing capture gate |
| 1.2 | 2 | RED native-option and secret-safety tests |
| 1.3 | 3 | RED transport, parser, and mapper tests |
| 1.4 | 4 | RED lifecycle and composition tests |
| 2.1 | 5 | Native option normalization and fixed, secret-safe config object |
| 2.2 | 6 | Fixed-origin transport and atomic parser |
| 2.3 | 7 | 5H/7D/1M semantic panel and summary mapping |
| 2.4 | 8 | Polling, serialization, boundary, stale, countdown, and disposal lifecycle |
| 3.1 | 9 | Shared exports, aggregate construction, aliases, and package boundary |
| 3.2 | 10 | Three-provider aggregate behavior verification |
| 3.3 | 11 | Local secret and private-contract documentation |
| 4.1 | 12 | Focused, typecheck, full-suite, build, and deployment-test gates |
| 4.2 | 13 | Local deployment, artifact parity, and live validation |

---

### Task 1: Capture And Freeze The Private Structured Contract

**OpenSpec:** 1.1

**Files:**
- Create: `tests/fixtures/opencode-go/request-manifest.json`
- Create: `tests/fixtures/opencode-go/success.json`
- Create: `tests/fixtures/opencode-go/authentication-401.json`
- Create: `tests/fixtures/opencode-go/authentication-403.json`
- Create: `tests/fixtures/opencode-go/login-redirect.json`
- Create: `tests/provider-opencode-go-contract.test.mjs`

**Interfaces:**
- Consumes: an authenticated browser session at `https://opencode.ai` and the console request named `lite.subscription.get`.
- Produces: sanitized raw fixtures and a manifest with `request.url`, `request.method`, `request.headers`, `request.body`, `request.redirect`, and `responsePointers.fiveHour|weekly|monthly`. Tasks 3 and 6 treat these files as the only wire-contract authority.

- [ ] **Step 1: Capture the request outside the repository**

Open the authenticated OpenCode console, open browser DevTools Network, enable Preserve log, filter for `lite.subscription.get`, and reload the subscription usage view. Select the request that returns rolling, weekly, and monthly records.

Record only the following in a temporary file outside the repository, such as `/var/folders/vh/srpy49dj1cld13b3wq7hjnw80000gn/T/opencode/opencode-go-contract.har`:

```text
HTTP method
full URL and query-string shape
required non-secret request headers
request body bytes and Content-Type
raw structured success response body
401 response behavior
403 response behavior
login redirect status and Location shape
```

Do not copy unrelated browser headers. Do not paste the Cookie header, HAR content, or raw response into chat, terminal output, a report, or any repository path.

- [ ] **Step 2: Reproduce the structured query**

Use DevTools Replay XHR/fetch on the captured request while authenticated. Confirm the replay returns a structured response and that its raw body contains all three records corresponding to `rollingUsage`, `weeklyUsage`, and `monthlyUsage`, each with finite `usagePercent` and finite non-negative `resetInSec`.

Then repeat with authentication removed or expired and record whether the server returns 401, 403, or a manual login redirect. Do not infer behavior from rendered HTML.

If replay returns a page, omits any required usage record, or cannot be made reproducible, stop immediately and report:

```text
BLOCKED: lite.subscription.get structured contract could not be reproduced
```

Do not create a scraping parser, balance fallback, or local estimate.

- [ ] **Step 3: Create sanitized fixtures**

Build `request-manifest.json` from the observed request, preserving the exact path, method, serialization body, required header names/values, and `redirect: "manual"`. Replace the observed workspace everywhere with `wrk_TESTWORKSPACE`; replace the Cookie value with `session=TEST_SESSION_COOKIE; other=TEST_OTHER_COOKIE`; omit user agent, browser tracing, and unrelated headers.

Build the response fixtures from the observed raw envelopes. Preserve object/array/envelope structure and discriminators, but replace identifiers and values with these deterministic test values:

```json
{
  "rollingUsage": { "usagePercent": 12.5, "resetInSec": 1800 },
  "weeklyUsage": { "usagePercent": 34, "resetInSec": 172800 },
  "monthlyUsage": { "usagePercent": 56.75, "resetInSec": 1209600 }
}
```

The records must remain at their observed positions inside the raw SolidStart envelope. Store their exact RFC 6901 JSON pointers in `responsePointers` in the manifest. Replace all account/user/workspace fields with obvious `TEST_...` values or remove unknown fields that are not needed to preserve the envelope.

- [ ] **Step 4: Add the fixture-only contract gate**

Implement `tests/provider-opencode-go-contract.test.mjs` with no production imports. It must:

```javascript
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const fixture = (name) => JSON.parse(readFileSync(`tests/fixtures/opencode-go/${name}`, "utf8"))
const manifest = fixture("request-manifest.json")
const success = fixture("success.json")
const authentication401 = fixture("authentication-401.json")
const authentication403 = fixture("authentication-403.json")
const loginRedirect = fixture("login-redirect.json")

function jsonPointer(value, pointer) {
  return pointer.split("/").slice(1).reduce((current, token) => {
    const key = token.replaceAll("~1", "/").replaceAll("~0", "~")
    return current?.[key]
  }, value)
}

test("captures a fixed-origin manual-redirect lite.subscription.get request", async () => {
  const init = {
    method: manifest.request.method,
    headers: manifest.request.headers,
    redirect: manifest.request.redirect,
    ...(manifest.request.body === null ? {} : { body: manifest.request.body }),
  }
  const request = new Request(manifest.request.url, init)

  assert.equal(new URL(request.url).origin, "https://opencode.ai")
  assert.match(JSON.stringify(manifest.request), /lite\.subscription\.get/)
  assert.equal(request.redirect, "manual")
  assert.ok(["GET", "POST"].includes(request.method))
  assert.equal(request.headers.get("cookie"), "session=TEST_SESSION_COOKIE; other=TEST_OTHER_COOKIE")
  assert.equal(manifest.request.body === null ? null : await request.text(), manifest.request.body)
})

test("decodes all three captured structured usage records", () => {
  assert.deepEqual(jsonPointer(success, manifest.responsePointers.fiveHour), {
    usagePercent: 12.5,
    resetInSec: 1800,
  })
  assert.deepEqual(jsonPointer(success, manifest.responsePointers.weekly), {
    usagePercent: 34,
    resetInSec: 172800,
  })
  assert.deepEqual(jsonPointer(success, manifest.responsePointers.monthly), {
    usagePercent: 56.75,
    resetInSec: 1209600,
  })
})

test("contains only committed sentinel identity and cookie values", () => {
  const committed = JSON.stringify({ manifest, success, authentication401, authentication403, loginRedirect })
  assert.doesNotMatch(committed, /(?:email|authorization|set-cookie)/i)
  const workspaces = [...committed.matchAll(/wrk_[A-Za-z0-9]+/g)].map(([value]) => value)
  assert.ok(workspaces.length > 0)
  assert.ok(workspaces.every((value) => value === "wrk_TESTWORKSPACE"))
  assert.equal(committed.includes("TEST_SESSION_COOKIE"), true)
})

test("captures authentication and login redirect classifications", () => {
  assert.equal(authentication401.status, 401)
  assert.equal(authentication403.status, 403)
  assert.ok(loginRedirect.status >= 300 && loginRedirect.status < 400)
  assert.match(new URL(loginRedirect.location, "https://opencode.ai").pathname, /login|auth/)
})
```

Adjust only the manifest's observed method/header/body fields and its three exact JSON pointers. Do not broaden the decoder to search arbitrary nested objects.

- [ ] **Step 5: Run the hard gate**

Run:

```bash
node --test tests/provider-opencode-go-contract.test.mjs
```

Expected: PASS with 4 tests and 0 failures. Any failure is `BLOCKED`; Tasks 2-13 must not run.

- [ ] **Step 6: Remove raw capture material and inspect the staged data**

Delete the temporary HAR through the browser/OS after the sanitized fixtures pass. Confirm secrets do not appear in the repository diff:

```bash
git diff -- tests/fixtures/opencode-go tests/provider-opencode-go-contract.test.mjs
git status --short
```

Expected: only the six new test/fixture paths plus the pre-existing three root deletions. Read every staged fixture before committing.

- [ ] **Step 7: Commit the passing contract gate**

```bash
git add tests/fixtures/opencode-go/request-manifest.json tests/fixtures/opencode-go/success.json tests/fixtures/opencode-go/authentication-401.json tests/fixtures/opencode-go/authentication-403.json tests/fixtures/opencode-go/login-redirect.json tests/provider-opencode-go-contract.test.mjs
git commit -m "test(quota): capture OpenCode Go contract"
```

### Task 2: Add RED Native-Option And Secret-Safety Tests

**OpenSpec:** 1.2

**Files:**
- Create: `tests/provider-opencode-go.test.mjs`
- Modify: `tests/compile-presentation.mjs:4-20`
- Modify: `tests/quota-composition.test.mjs:17,81-111`

**Interfaces:**
- Consumes: Task 1 manifest and sentinels.
- Produces: tests for `normalizeOpenCodeGoConfig(value): OpenCodeGoConfig | null`, `NormalizedQuotaOptions.openCodeGo`, and a request that cannot change origin or leak the cookie.

- [ ] **Step 1: Add the provider test bundle entry**

Add `provider-opencode-go` to cleanup and this build tuple beside the other providers:

```javascript
["tui/providers/opencode-go.ts", ".tmp-test/provider-opencode-go.mjs", ["browser"]],
```

- [ ] **Step 2: Write failing configuration tests**

In `tests/provider-opencode-go.test.mjs`, import the bundle as a module object so later RED exports can remain absent without failing test discovery:

```javascript
const providerModule = await import("../.tmp-test/provider-opencode-go.mjs")
```

Add tests whose names begin with `OpenCode Go options`; for example:

```javascript
test("OpenCode Go options normalize a valid workspace and full cookie", () => {
  const { normalizeOpenCodeGoConfig } = providerModule
  assert.deepEqual(normalizeOpenCodeGoConfig({
    workspaceId: " wrk_TESTWORKSPACE ",
    cookie: " session=TEST_SESSION_COOKIE; other=TEST_OTHER_COOKIE ",
  }), {
    workspaceId: "wrk_TESTWORKSPACE",
    cookie: "session=TEST_SESSION_COOKIE; other=TEST_OTHER_COOKIE",
  })
})

test("OpenCode Go options reject missing malformed blank and line-bearing configuration", () => {
  const { normalizeOpenCodeGoConfig } = providerModule
  for (const value of [
    undefined,
    {},
    { workspaceId: "workspace", cookie: "session=TEST_SESSION_COOKIE" },
    { workspaceId: "wrk_TESTWORKSPACE", cookie: "" },
    { workspaceId: "wrk_TESTWORKSPACE", cookie: "session=x\r\nX-Test: leaked" },
  ]) assert.equal(normalizeOpenCodeGoConfig(value), null)
})
```

Extend the two existing `normalizeQuotaOptions` tests so defaults include `openCodeGo: null`, valid input includes the normalized object above, and malformed input remains `null`. Add one focused composition test named `OpenCode Go options normalize through native quota options` so Task 5 can run only this behavior while later RED tests remain skipped.

- [ ] **Step 3: Write failing request and diagnostic safety tests**

Use the contract manifest to add tests named `OpenCode Go transport uses the fixed origin`, `OpenCode Go transport keeps diagnostics secret-safe`, and `OpenCode Go lifecycle does not request without configuration`. Assert the eventual fetch call uses exactly the captured URL/method/body/header set, `redirect: "manual"`, and no configurable origin. Capture `console.error`, thrown messages, and serialized results using the sentinel cookie; assert none contains `TEST_SESSION_COOKIE` or `TEST_OTHER_COOKIE`. Assert no fetch occurs when config is `null`.

- [ ] **Step 4: Run the exact RED gate**

Run:

```bash
node tests/compile-presentation.mjs
```

Expected: FAIL from esbuild with `Could not resolve "tui/providers/opencode-go.ts"`. This is the intended RED result before Task 5.

- [ ] **Step 5: Commit the RED tests only**

```bash
git status --short
git add tests/compile-presentation.mjs tests/provider-opencode-go.test.mjs tests/quota-composition.test.mjs
git commit -m "test(quota): specify OpenCode Go options"
```

### Task 3: Add RED Transport, Parser, And Mapper Tests

**OpenSpec:** 1.3

**Files:**
- Modify: `tests/provider-opencode-go.test.mjs`

**Interfaces:**
- Consumes: Task 1 raw fixtures and the signatures defined below.
- Produces: tests for `parseOpenCodeGoResponse(value, receivedAt)`, `fetchOpenCodeGoQuota(config, signal, dependencies)`, `openCodeGoHomeQuotaSummary(data)`, and `mapOpenCodeGoPanelState(state)`.

- [ ] **Step 1: Add atomic parser success and rejection cases**

Name every test in this task with the prefix `OpenCode Go transport` or `OpenCode Go mapper`. At fixed receipt time `Date.UTC(2026, 6, 14, 12, 0, 0)`, assert the success fixture maps to:

```javascript
{
  fiveHour: { usedPct: 12.5, remainingPct: 87.5, resetEpoch: now + 1_800_000 },
  weekly: { usedPct: 34, remainingPct: 66, resetEpoch: now + 172_800_000 },
  monthly: { usedPct: 56.75, remainingPct: 43.25, resetEpoch: now + 1_209_600_000 },
}
```

For each required record, mutate a fresh fixture copy to remove the record and then replace `usagePercent` with `NaN`, `Infinity`, `-1`, and `101`, and `resetInSec` with `NaN`, `Infinity`, and `-1`. Every mutation must return `null`; no partial object is accepted. Add one unknown field and assert the valid snapshot is unchanged.

- [ ] **Step 2: Add response-classification tests**

Assert `fetchOpenCodeGoQuota` returns:

```text
success                 valid captured success fixture
authentication-required 401, 403, captured login redirect, authenticated HTML page fallback
transient-failure       rejected fetch, AbortError, 408, 429, 500, 503
invalid-response        other non-success status, malformed JSON, partial envelope, invalid number
```

For every case, stringify the returned value and all captured diagnostics and assert the cookie sent in config does not occur.

- [ ] **Step 3: Add semantic mapping tests**

Assert stable items and orders:

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

Cover idle at 100% remaining, countdown before an epoch, expired at/after an epoch, stale marker before the first progress row, `Configuration required`, `Usage unavailable`, and compact `{ provider: "OpenCode GO", plan: "Subscription", primaryPct: 87.5, secondaryPct: 66 }`.

- [ ] **Step 4: Run the exact RED gate**

Run:

```bash
node tests/compile-presentation.mjs
```

Expected: FAIL with the same missing `tui/providers/opencode-go.ts` resolution error. The new parser/mapper assertions remain unimplemented until Tasks 6 and 7.

- [ ] **Step 5: Commit the RED tests**

```bash
git status --short
git add tests/provider-opencode-go.test.mjs
git commit -m "test(quota): specify OpenCode Go transport"
```

### Task 4: Add RED Lifecycle And Composition Tests

**OpenSpec:** 1.4

**Files:**
- Modify: `tests/provider-opencode-go.test.mjs`
- Modify: `tests/quota-composition.test.mjs`

**Interfaces:**
- Consumes: `createOpenCodeGoProvider(api, options)` and existing `composeQuotaPanel`, `selectedQuotaProviderID`, `selectedSessionQuotaProviderID`, and `createQuotaSelection` interfaces.
- Produces: fake-clock lifecycle coverage and failing aggregate alias/refresh/order assertions.

- [ ] **Step 1: Add a fake clock and provider harness**

Follow the existing OpenAI harness with fake timeout/interval objects that expose `active`, `delay`, `callback`, and `unref()`. Construct the adapter with:

```javascript
{
  config: {
    workspaceId: "wrk_TESTWORKSPACE",
    cookie: "session=TEST_SESSION_COOKIE; other=TEST_OTHER_COOKIE",
  },
  refreshIntervalMs: 2_500,
  fetch: testFetch,
}
```

Cleanup must dispose the adapter before restoring timers/fetch and assert zero active timers.

- [ ] **Step 2: Add failing lifecycle cases**

Add tests whose names all begin with `OpenCode Go lifecycle` for:

```text
refreshes immediately after valid construction
uses default and custom polling plus one-second countdown ticks
starts no request when configuration is absent
serializes overlapping immediate and poll refreshes
queues at most one reset-boundary refresh behind an older request
schedules the nearest of 5H 7D and 1M boundaries then advances to the next
retains a successful snapshot as stale after a transient failure
expires stale data after 10 minutes
clears data immediately after authentication-required and invalid-response results
restores ready state after a later success
clears polling countdown boundary and pending work on disposal
ignores a fetch resolution or rejection after disposal
```

- [ ] **Step 3: Add failing alias and active-selection cases**

Create a fake adapter with `id: "opencode-go"`, order `130`, 5H/7D/1M rows, and a compact 5H/7D summary. Name the alias and active-selection tests with the prefix `OpenCode Go integration`. Assert both IDs resolve to it:

```javascript
assert.equal(selectedQuotaProviderID([{ id: "opencode-go" }], providers), "opencode-go")
assert.equal(selectedQuotaProviderID([{ id: "opencode-go-subscription" }], providers), "opencode-go")
```

Extend the reactive selection test so switching the latest user message from OpenAI to `opencode-go-subscription` causes exactly one OpenCode Go refresh and promotes `opencode-go:quota`; switching back retains ready/stale OpenCode Go rows under `Other providers`.

- [ ] **Step 4: Run the exact RED gate**

Run:

```bash
node tests/compile-presentation.mjs
```

Expected: FAIL because `tui/providers/opencode-go.ts` is still absent. After Task 5 creates the module, the focused lifecycle and alias assertions must continue to fail until Tasks 8 and 9.

- [ ] **Step 5: Commit the RED tests**

```bash
git status --short
git add tests/provider-opencode-go.test.mjs tests/quota-composition.test.mjs
git commit -m "test(quota): specify OpenCode Go lifecycle"
```

### Task 5: Implement Native OpenCode Go Options

**OpenSpec:** 2.1

**Files:**
- Create: `tui/providers/opencode-go.ts`
- Modify: `shared/opencode-tools-shared.ts:1-9`
- Modify: `tui/quota.tsx:7-12,28-48,57-62,109-124`

**Interfaces:**
- Produces: `OpenCodeGoOptions`, `OpenCodeGoConfig`, and `normalizeOpenCodeGoConfig(value: unknown): OpenCodeGoConfig | null`; `NormalizedQuotaOptions.openCodeGo` is immutable by convention and only passed to the adapter.

- [ ] **Step 1: Confirm the option tests are RED**

Run:

```bash
node tests/compile-presentation.mjs && node --test --test-name-pattern="OpenCode Go options" tests/provider-opencode-go.test.mjs tests/quota-composition.test.mjs
```

Expected: FAIL because the normalization exports and `openCodeGo` normalized option do not exist.

- [ ] **Step 2: Add minimal configuration types and normalization**

Start `tui/providers/opencode-go.ts` with:

```typescript
export type OpenCodeGoOptions = {
  workspaceId?: string
  cookie?: string
}

export type OpenCodeGoConfig = Readonly<{
  workspaceId: string
  cookie: string
}>

const WORKSPACE_ID = /^wrk_[A-Za-z0-9]+$/

export function normalizeOpenCodeGoConfig(value: unknown): OpenCodeGoConfig | null {
  if (!value || typeof value !== "object") return null
  const input = value as OpenCodeGoOptions
  const workspaceId = typeof input.workspaceId === "string" ? input.workspaceId.trim() : ""
  const cookie = typeof input.cookie === "string" ? input.cookie.trim() : ""
  if (!WORKSPACE_ID.test(workspaceId) || !cookie || /[\r\n]/.test(cookie)) return null
  return Object.freeze({ workspaceId, cookie })
}
```

Do not return reasons, rejected values, or derived cookie data.

- [ ] **Step 3: Normalize native options through the shared boundary**

Export `normalizeOpenCodeGoConfig` and its two types from `shared/opencode-tools-shared.ts`. Add `openCodeGo?: OpenCodeGoOptions` to `QuotaPluginOptions`, `openCodeGo: OpenCodeGoConfig | null` to `NormalizedQuotaOptions`, and return `openCodeGo: normalizeOpenCodeGoConfig(input.openCodeGo)` from `normalizeQuotaOptions`.

- [ ] **Step 4: Run the focused GREEN gate**

Run:

```bash
node tests/compile-presentation.mjs && node --test --test-name-pattern="OpenCode Go options" tests/provider-opencode-go.test.mjs tests/quota-composition.test.mjs
```

Expected: PASS for option/configuration tests. Transport, mapping, lifecycle, and integration tests may remain RED because their implementation tasks have not run.

- [ ] **Step 5: Commit**

```bash
git status --short
git add tui/providers/opencode-go.ts shared/opencode-tools-shared.ts tui/quota.tsx
git commit -m "feat(quota): normalize OpenCode Go options"
```

### Task 6: Implement Fixed-Origin Transport And Atomic Parsing

**OpenSpec:** 2.2

**Files:**
- Modify: `tui/providers/opencode-go.ts`
- Test: `tests/provider-opencode-go-contract.test.mjs`
- Test: `tests/provider-opencode-go.test.mjs`

**Interfaces:**
- Consumes: Task 1 request manifest and raw response envelope.
- Produces: `OpenCodeGoWindow`, `OpenCodeGoQuotaData`, `OpenCodeGoFetchResult`, `parseOpenCodeGoResponse(value, receivedAt)`, and `fetchOpenCodeGoQuota(config, signal, dependencies)`.

- [ ] **Step 1: Confirm transport/parser tests are RED**

Run:

```bash
node tests/compile-presentation.mjs && node --test --test-name-pattern="OpenCode Go transport" tests/provider-opencode-go.test.mjs
```

Expected: FAIL because parser and transport exports are absent.

- [ ] **Step 2: Add exact data/result contracts**

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

type OpenCodeGoFetchDependencies = {
  fetch: typeof globalThis.fetch
  now: () => number
}

export function parseOpenCodeGoResponse(value: unknown, receivedAt: number): OpenCodeGoQuotaData | null

export async function fetchOpenCodeGoQuota(
  config: OpenCodeGoConfig,
  signal: AbortSignal,
  dependencies: OpenCodeGoFetchDependencies,
): Promise<OpenCodeGoFetchResult>
```

- [ ] **Step 3: Implement the strict captured-envelope parser**

Encode the exact observed SolidStart envelope path from Task 1 directly in `parseOpenCodeGoResponse`; do not recursively search for matching property names. Parse `rollingUsage`, `weeklyUsage`, and `monthlyUsage` together. A record is valid only when `usagePercent` is finite and within `0..100`, and `resetInSec` is finite and `>= 0`.

For each record return:

```typescript
{
  usedPct: usagePercent,
  remainingPct: Math.min(100, Math.max(0, 100 - usagePercent)),
  resetEpoch: receivedAt + resetInSec * 1_000,
}
```

Return `null` unless all three records validate. Ignore unknown fields.

- [ ] **Step 4: Implement the captured request and static classification**

Use source constants for the Task 1 URL shape, method, required non-secret headers, and serialized body. Substitute only the validated `workspaceId`; set the exact Cookie header from config and `redirect: "manual"`. Never accept a base URL or headers from options.

`fetchOpenCodeGoQuota` must use its injected fetch, pass the supplied timeout signal, and classify without logging body/request/error details:

```text
401/403/login redirect/authenticated HTML -> authentication-required
network rejection/AbortError/408/429/5xx -> transient-failure
valid 2xx captured envelope -> success
all other status/body/parser outcomes -> invalid-response
```

Return only the discriminated values above. Do not include status text, URL, headers, body, config, or caught exception in a returned result or diagnostic.

- [ ] **Step 5: Run contract and transport GREEN gates**

Run:

```bash
node --test tests/provider-opencode-go-contract.test.mjs
node tests/compile-presentation.mjs && node --test --test-name-pattern="OpenCode Go transport" tests/provider-opencode-go.test.mjs
```

Expected: both commands PASS with 0 failures.

- [ ] **Step 6: Commit**

```bash
git status --short
git add tui/providers/opencode-go.ts
git commit -m "feat(quota): fetch exact OpenCode Go usage"
```

### Task 7: Implement Three-Window Semantic Mapping

**OpenSpec:** 2.3

**Files:**
- Modify: `tui/providers/opencode-go.ts`

**Interfaces:**
- Consumes: `OpenCodeGoQuotaData` from Task 6 and shared `PanelModel`/`PanelItem` types.
- Produces: `OpenCodeGoPanelPhase`, `OpenCodeGoPanelState`, `openCodeGoHomeQuotaSummary(data)`, and `mapOpenCodeGoPanelState(state)`.

- [ ] **Step 1: Confirm mapper tests are RED**

Run:

```bash
node tests/compile-presentation.mjs && node --test --test-name-pattern="OpenCode Go mapper" tests/provider-opencode-go.test.mjs
```

Expected: FAIL because mapper exports are absent.

- [ ] **Step 2: Add phase/state types and summary**

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

- [ ] **Step 3: Map exact semantic items**

Return panel ID `opencode-go`, order `130`, title `OpenCode GO`, and one `opencode-go:quota` group. Ready/stale data starts with exact header title `OpenCode GO:`. Add `~stale` at order 15 for stale data, then progress/timer pairs at 20/30, 40/50, and 60/70 with IDs and labels defined in Task 3.

Timer state is `idle` at 100% remaining, `countdown` when reset epoch is in the future, and `expired` otherwise. `configuration-required` renders a header with detail `Configuration required`; loading renders `Loading OpenCode GO...`; unavailable renders `Usage unavailable`. States without data contain no progress/timer items or compact summary.

- [ ] **Step 4: Run the mapper GREEN gate**

Run:

```bash
node tests/compile-presentation.mjs && node --test --test-name-pattern="OpenCode Go mapper" tests/provider-opencode-go.test.mjs
```

Expected: PASS with 0 failures.

- [ ] **Step 5: Commit**

```bash
git status --short
git add tui/providers/opencode-go.ts
git commit -m "feat(quota): map OpenCode Go windows"
```

### Task 8: Implement Polling And Disposal-Safe Lifecycle

**OpenSpec:** 2.4

**Files:**
- Modify: `tui/providers/opencode-go.ts`

**Interfaces:**
- Consumes: `QuotaProviderOptions`, `QuotaProviderAdapter`, normalized config, transport, and mapper.
- Produces: `OpenCodeGoProviderOptions` and `createOpenCodeGoProvider(api, options): QuotaProviderAdapter`.

- [ ] **Step 1: Confirm lifecycle tests are RED**

Run:

```bash
node tests/compile-presentation.mjs && node --test --test-name-pattern="OpenCode Go lifecycle" tests/provider-opencode-go.test.mjs
```

Expected: FAIL because `createOpenCodeGoProvider` is absent.

- [ ] **Step 2: Add provider options and construction states**

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

Use `createRoot`, signals for data/phase/last success/now/refreshed boundary, and local `refreshInFlight`, `refreshStartedAt`, `pendingBoundary`, `activeController`, and `disposed` fields. Keep `_api` only to satisfy the shared adapter constructor shape; do not read provider API keys or persist the cookie.

- [ ] **Step 3: Implement refresh classification**

If config is `null`, initialize `configuration-required`, create no poll or boundary timer, and make `refresh()` resolve without fetch. For valid config, initialize `loading` and refresh immediately.

For each request create an `AbortController`, schedule a 20,000ms abort timeout, and pass its signal plus injected fetch to Task 6 transport. Handle results atomically:

```text
success -> replace data, ready, update lastSuccessAt
authentication-required -> clear data, configuration-required
invalid-response -> clear data, unavailable
transient-failure with data -> stale
transient-failure without data -> unavailable
```

Never log the caught error or response body.

- [ ] **Step 4: Implement shared polling, clock, and nearest boundary**

Use the normalized positive `refreshIntervalMs`, defaulting to 10,000ms. Do not add exhausted backoff. Tick `now` every 1,000ms and clear stale data once `Date.now() - lastSuccessAt > 10 * 60 * 1_000`.

Schedule exactly one timeout for the minimum future reset epoch across `fiveHour`, `weekly`, and `monthly`. After success or a boundary refresh, recompute the minimum. If a boundary fires while an older request is in flight, retain only the latest pending boundary epoch and perform one refresh after settlement; ordinary poll/selection calls while in flight return the existing promise and do not queue extra work.

- [ ] **Step 5: Make disposal final**

On `dispose()`, set `disposed`, clear pending boundary state, abort the current request, and dispose the root so polling/countdown/boundary/timeout timers are cleared. Every async continuation checks `disposed` before mutating a signal or starting a queued refresh. `setSessionID` is a no-op.

Map `configuration-required` to adapter freshness `unavailable`; return a home summary whenever ready or stale data exists so aggregate composition can retain bounded stale values.

- [ ] **Step 6: Run the lifecycle GREEN gate**

Run:

```bash
node tests/compile-presentation.mjs && node --test --test-name-pattern="OpenCode Go lifecycle" tests/provider-opencode-go.test.mjs
```

Expected: PASS with 0 failures and no active fake timers after cleanup.

- [ ] **Step 7: Commit**

```bash
git status --short
git add tui/providers/opencode-go.ts
git commit -m "feat(quota): schedule OpenCode Go refreshes"
```

### Task 9: Integrate The Provider Through The Shared Boundary

**OpenSpec:** 3.1

**Files:**
- Modify: `tui/providers/types.ts:5-21`
- Modify: `shared/opencode-tools-shared.ts:1-9`
- Modify: `tui/quota.tsx:7-12,63-69,342-348`
- Modify: `tests/compile-presentation.mjs`
- Modify: `tests/shared-boundary.test.mjs:41-69`
- Modify: `tests/plugin-build.test.mjs:108-125,150-162`
- Modify: `tsconfig.json:21-31`

**Interfaces:**
- Consumes: `createOpenCodeGoProvider` and normalized config from Tasks 5-8.
- Produces: public shared constructor/types, aggregate adapter registration, and aliases `opencode-go`/`opencode-go-subscription -> opencode-go`.

- [ ] **Step 1: Confirm integration tests are RED**

Run:

```bash
node tests/compile-presentation.mjs && node --test --test-name-pattern="OpenCode Go|shared owns computation|artifacts expose" tests/quota-composition.test.mjs tests/shared-boundary.test.mjs tests/plugin-build.test.mjs
```

Expected: FAIL because the provider is not constructed, aliased, fully exported, or asserted in build inputs.

- [ ] **Step 2: Add the summary union member**

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

- [ ] **Step 3: Complete shared exports and aggregate registration**

Export `createOpenCodeGoProvider`, `normalizeOpenCodeGoConfig`, and OpenCode Go config/data/result/summary types from `shared/opencode-tools-shared.ts`.

In `tui/quota.tsx`, import the constructor, add both alias entries, and append after OpenAI:

```typescript
providers.push(createOpenCodeGoProvider(api, {
  config: options.openCodeGo,
  refreshIntervalMs: options.refreshIntervalMs,
}))
```

Do not instantiate it in `tui/home.tsx` and do not add a renderer branch.

- [ ] **Step 4: Extend boundary/build assertions**

Assert `shared/opencode-tools-shared.ts` exports the constructor, shared build inputs include `/tui/providers/opencode-go.ts`, loadable quota/token inputs exclude all three provider modules, and the built shared module exports `createOpenCodeGoProvider`. Keep expected artifact names exactly unchanged.

Add `tui/providers/opencode-go.ts` to `tsconfig.json` include.

- [ ] **Step 5: Run the integration GREEN gate**

Run:

```bash
node tests/compile-presentation.mjs && node --test --test-name-pattern="OpenCode Go|shared owns computation|artifacts expose" tests/quota-composition.test.mjs tests/shared-boundary.test.mjs tests/plugin-build.test.mjs
```

Expected: PASS with 0 failures; build results remain exactly `quota`, `shared`, and `tokens`.

- [ ] **Step 6: Commit**

```bash
git status --short
git add tui/providers/types.ts shared/opencode-tools-shared.ts tui/quota.tsx tests/compile-presentation.mjs tests/shared-boundary.test.mjs tests/plugin-build.test.mjs tsconfig.json
git commit -m "feat(quota): integrate OpenCode Go provider"
```

### Task 10: Verify Three-Provider Aggregate Behavior

**OpenSpec:** 3.2

**Files:**
- Modify: `tests/quota-composition.test.mjs`
- Modify: `tests/plugin-deploy.test.mjs`

**Interfaces:**
- Consumes: the integrated adapter and unchanged generic composition functions.
- Produces: regression coverage for provider priority/retention, 5H/7D compact summary, remaining/used conversion, color thresholds, sorting, native option forwarding, and deployment option preservation.

- [ ] **Step 1: Add aggregate assertions before changing production code**

Add a table-driven test named `three providers preserve OpenCode Go aggregate semantics` with Z.AI, OpenAI, and OpenCode Go adapters. Assert:

```text
selected opencode-go group is first
ready/stale Z.AI and OpenAI remain under Other providers
switching active provider moves only the selected group
OpenCode Go collapsed remaining summary is 87%/66%
OpenCode Go collapsed used summary is 13%/34%
5H/7D/1M used rows are 12.5/34/56.75
remaining threshold status is used even while displaying used values
1M remains expanded-only and does not enter collapsedSummary
secondary-provider sorting still follows configured metric/direction
```

Update `aggregatePanel` to serve the captured request URL and success fixture only when valid `openCodeGo` options are supplied. Change the polling forwarding assertion from two active provider polls to three and assert the OpenCode Go request carries the exact sentinel Cookie and `redirect: "manual"`.

- [ ] **Step 2: Verify tests expose any missing aggregate behavior**

Run:

```bash
node tests/compile-presentation.mjs && node --test --test-name-pattern="OpenCode Go|three providers|forwards normalized" tests/quota-composition.test.mjs
```

Expected: PASS if Task 9 integration uses the existing generic composition correctly. If it fails, make only the smallest correction in `tui/quota.tsx`; do not change the renderer or provider interface.

- [ ] **Step 3: Cover deployment option preservation**

Extend `localOptions` in `tests/plugin-deploy.test.mjs` with:

```javascript
openCodeGo: {
  workspaceId: "wrk_TESTWORKSPACE",
  cookie: "session=TEST_SESSION_COOKIE; other=TEST_OTHER_COOKIE",
},
```

Assert deploy keeps that options object only in the selected local test config, remains idempotent, and still copies the exact same three artifacts. These are synthetic sentinels, never a live cookie.

- [ ] **Step 4: Run composition/deploy GREEN gates**

Run:

```bash
node tests/compile-presentation.mjs && node --test tests/quota-composition.test.mjs tests/plugin-deploy.test.mjs
```

Expected: PASS with 0 failures.

- [ ] **Step 5: Commit**

```bash
git status --short
git add tests/quota-composition.test.mjs tests/plugin-deploy.test.mjs tui/quota.tsx
git commit -m "test(quota): verify three-provider composition"
```

If `tui/quota.tsx` did not need correction, omit it from `git add`.

### Task 11: Document Local Secret Configuration And Limitations

**OpenSpec:** 3.3

**Files:**
- Modify: `README.md:8-10,29-67,73-99,152-202`

**Interfaces:**
- Consumes: final option names and behavior.
- Produces: user instructions containing only sentinel values.

- [ ] **Step 1: Update supported-provider and feature documentation**

Add OpenCode Go to the introduction and source/provider descriptions. Document exact 5H, 7D, and 1M quota windows, remaining/used display, reset countdowns, stale behavior, and both recognized runtime IDs.

- [ ] **Step 2: Add the local configuration example and warnings**

Extend the existing JSON example with:

```json
"openCodeGo": {
  "workspaceId": "wrk_TESTWORKSPACE",
  "cookie": "session=YOUR_OPENCODE_CONSOLE_COOKIE"
}
```

State directly that:

```text
The full Cookie header is stored as plaintext in local .opencode/tui.json.
Never commit or share that file/value.
Copy the workspace ID and full Cookie header from an authenticated opencode.ai console request.
Rotate/update the cookie when the console session expires or is revoked.
The destination is fixed to https://opencode.ai.
The provider depends on the undocumented private lite.subscription.get contract and fails closed if it changes.
There is no page-scraping or local-estimate fallback.
The value does not replace OpenCode's inference API key.
```

- [ ] **Step 3: Verify documentation contains no secret-like values**

Run:

```bash
node --test tests/plugin-wiring.test.mjs
git diff --check -- README.md
git diff -- README.md
```

Expected: PASS, no whitespace errors, and only the documented sentinel workspace/cookie values.

- [ ] **Step 4: Commit**

```bash
git status --short
git add README.md
git commit -m "docs(quota): document OpenCode Go setup"
```

### Task 12: Run Automated Release Gates

**OpenSpec:** 4.1

**Files:**
- Verify only; do not modify source, tests, generated artifacts, OpenSpec artifacts, Comet state, or the three unrelated deleted reports.

**Interfaces:**
- Consumes: Tasks 1-11.
- Produces: evidence that focused tests, typechecking, full tests, production build tests, and deployment tests pass from the implementation branch.

- [ ] **Step 1: Run focused OpenCode Go and composition tests**

```bash
node --test tests/provider-opencode-go-contract.test.mjs
node tests/compile-presentation.mjs && node --test tests/provider-opencode-go.test.mjs tests/quota-composition.test.mjs tests/shared-boundary.test.mjs
```

Expected: all tests PASS with 0 failures.

- [ ] **Step 2: Run strict typechecking**

```bash
npm run typecheck
```

Expected: exit 0 from `tsc --noEmit` with no diagnostics.

- [ ] **Step 3: Run the complete automated suite**

```bash
npm test
```

Expected: compile steps and every `tests/*.test.mjs` test PASS with 0 failures.

- [ ] **Step 4: Run production build and build tests**

```bash
npm run build:plugins
node --test tests/plugin-build.test.mjs
```

Expected: exactly these non-empty minified ESM artifacts and passing build tests:

```text
dist/opencode-tools-shared.js
dist/opencode-tools-quota.js
dist/plugins/opencode-tools-tokens.js
```

- [ ] **Step 5: Run deployment tests**

```bash
node --test tests/plugin-deploy.test.mjs
```

Expected: PASS with idempotent local/global fixtures and exact three-artifact parity.

- [ ] **Step 6: Verify focused diff and unrelated deletions**

```bash
git status --short
git diff --check
git diff --name-status b02cc28142ec45db24587d8fe84da493057e8c19...HEAD
```

Expected: implementation changes are limited to files named in this plan. The worktree still shows the original three unstaged root deletions; none appears in any implementation commit.

**Commit checkpoint:** No commit. Generated `dist/` and `.tmp-test/` files are ignored verification output.

### Task 13: Deploy Locally And Perform Live Secret-Safe Validation

**OpenSpec:** 4.2

**Files:**
- Local ignored configuration only: `.opencode/tui.json`
- Generated ignored deployment: `.opencode/opencode-tools-shared.js`, `.opencode/opencode-tools-quota.js`, `.opencode/plugins/opencode-tools-tokens.js`
- Do not modify tracked `tui.json` with a live secret.

**Interfaces:**
- Consumes: a real workspace ID and full browser Cookie supplied only in ignored local config.
- Produces: deployed artifact parity and manual behavioral evidence; no credential-bearing report is created.

- [ ] **Step 1: Preserve and configure the ignored local options**

Record whether `.opencode/tui.json` existed and keep a secure local backup outside the repository if needed. Add the live values only to the options for `./opencode-tools-quota.js` in `.opencode/tui.json`. Confirm Git cannot see the file:

```bash
git check-ignore -v .opencode/tui.json
git status --short --untracked-files=all
```

Expected: `.opencode/tui.json` is ignored, no credential-bearing file appears, and the three unrelated root deletions remain unstaged.

- [ ] **Step 2: Deploy locally**

```bash
npm run deploy:local
```

Expected: `Deployed opencode-tools plugins to .../.opencode` and exactly three deployed artifacts.

- [ ] **Step 3: Verify byte-for-byte artifact parity**

```bash
cmp -s dist/opencode-tools-shared.js .opencode/opencode-tools-shared.js
cmp -s dist/opencode-tools-quota.js .opencode/opencode-tools-quota.js
cmp -s dist/plugins/opencode-tools-tokens.js .opencode/plugins/opencode-tools-tokens.js
```

Expected: all three commands exit 0.

- [ ] **Step 4: Restart OpenCode and validate live behavior**

With no terminal/request logging enabled, verify:

```text
OpenCode Go console and sidebar show the same 5H, 7D, and 1M percentages.
Each reset countdown agrees with the console and updates once per second.
Default polling is observable; a temporary custom refreshIntervalSeconds is also honored.
Selecting an opencode-go model promotes the group and immediately refreshes it.
Selecting another supported provider moves that provider first while ready/stale OpenCode Go remains under Other providers.
Remaining and used modes display complementary values while colors still follow remaining quota.
A temporary network interruption marks bounded data ~stale and later success restores ready.
Removing the local cookie or allowing it to expire clears quota and shows Configuration required.
No terminal output, error, report, screenshot, shell history, or test artifact contains the cookie.
```

- [ ] **Step 5: Restore secret-safe local state**

Restore the prior ignored `.opencode/tui.json` or remove the live `openCodeGo` values after validation. Rotate the console cookie if it was exposed outside the intended local config. Run:

```bash
git status --short --untracked-files=all
git diff --name-status b02cc28142ec45db24587d8fe84da493057e8c19...HEAD
```

Expected: no live config or secret-bearing path is tracked; the three original root deletions are still unrelated and absent from commits.

**Commit checkpoint:** No commit. Deployment output and live credentials remain ignored and local.

## Final Acceptance Checklist

- [ ] Task 1 passed before any production transport code was written; otherwise the result is BLOCKED and no fallback exists.
- [ ] Every OpenSpec task 1.1 through 4.2 maps one-to-one to Tasks 1 through 13 above.
- [ ] Exact structured data is accepted only when all rolling, weekly, and monthly records validate atomically.
- [ ] The cookie is used only as the Cookie header for fixed `https://opencode.ai` requests and appears in no diagnostic or committed example.
- [ ] Missing config/authentication, transient failure, protocol drift, stale expiry, and disposal match the canonical delta spec.
- [ ] OpenCode Go displays `OpenCode GO:`, 5H, 7D, and 1M in order; compact summary contains only 5H/7D.
- [ ] Both runtime IDs select and refresh one adapter while other ready/stale providers remain visible.
- [ ] Focused tests, typecheck, complete suite, production build tests, deployment tests, local deployment, artifact parity, and live checks passed.
- [ ] Exactly three artifacts are built/deployed and host-owned Solid remains external.
- [ ] `task-7-report.md`, `task-9-report.md`, and `task-10-report.md` were never restored, staged, edited, or committed.
