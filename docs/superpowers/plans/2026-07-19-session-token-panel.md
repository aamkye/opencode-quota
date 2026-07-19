---
change: add-session-token-panel
design-doc: docs/superpowers/specs/2026-07-19-session-token-panel-design.md
base-ref: fed4b0940733c27d089dbb154c60e6a522f33346
---

# SesTokens Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an independently buildable SesTokens sidebar plugin that aggregates complete assistant-token usage across the viewed session tree, refreshes safely after relevant events, and renders the approved expanded, collapsed, loading, unavailable, and stale layouts.

**Architecture:** A neutral session-tree loader lists the directory once, traverses a parent index, and fetches each reachable session's messages with bounded concurrency. A separate source owns event filtering, debounce, generation guards, retries, and last-complete-snapshot retention; a pure feature model performs all arithmetic and formatting; the Solid adapter renders source state through `CompactPanel` and persists only collapse state. The feature model and runtime services are exported through `shared/opencode-tools-shared.ts`, while `tui/ses-tokens.tsx` remains a thin standalone adapter.

**Tech Stack:** TypeScript 6, SolidJS 1.9, OpenTUI Solid, OpenCode SDK v2, esbuild, Node.js test runner, local `@opencode-ai/plugin/tui` declarations.

## Global Constraints

- Use configured Comet artifact language `en` for implementation feedback and checklist notes.
- Treat `docs/superpowers/specs/2026-07-19-session-token-panel-design.md`, `openspec/changes/add-session-token-panel/specs/session-token-panel/spec.md`, and the current `AGENTS.md` SesTokens section as acceptance sources.
- Do not edit, revert, stage, or commit `AGENTS.md`; its current working-tree SHA-256 must remain `f118dd027caac7bce5ed9cf80ebfae83d9a0cc58e50e4831e74df8b1f2dac725`.
- Keep the panel at 37 cells or narrower with no trailing whitespace; use flex layout rather than padded strings in source components.
- Aggregate only assistant messages. Every assistant message counts as one turn, including all-zero messages; missing and non-finite token fields contribute zero.
- Define total as `input + output + reasoning + cacheRead + cacheWrite` and cache-hit ratio as `cacheRead / (input + cacheWrite)`.
- Load one directory session list, include the root even when omitted from that list, visit each reachable ID once, and run no more than four message requests concurrently.
- Publish only complete snapshots. Retry failures after 2, 4, and 8 seconds; keep the last complete snapshot as stale after a background failure.
- Refresh only from the six approved event types and changed non-empty sidebar/select targets; debounce relevant lifecycle events by 200 ms and do not poll.
- Persist only `aamkye.opencode-tools-ses-tokens.collapsed`; snapshots remain memory-only.
- Add the manifest entry after TODO with slot order `115`; do not reorder existing plugins.
- Do not implement or modify SubAgent behavior, files, tests, manifests, or documentation in this change.
- Generated `dist/` and `.tmp-test/` files are verification artifacts and remain untracked.
- Commit steps below are for the later implementation session only. This planning session does not stage or commit anything.
- Comet subagent execution override: implementers must not edit plan/OpenSpec checkboxes or include plan/OpenSpec files in implementation commits, even where a task step or sample `git add` command says otherwise. The coordinator performs and commits every checklist update only after review-mode validation.

## File Structure

**Create:**

- `tui/features/ses-tokens.ts` - pure assistant-token aggregation, formatting, ratio, and collapsed-summary model.
- `tui/services/session-tree-snapshot.ts` - neutral parent index, cycle-safe traversal, and bounded-concurrency complete snapshot loader.
- `tui/services/ses-tokens-source.ts` - session target, event filtering, debounce, retry, generation, stale retention, subscriptions, and disposal.
- `tui/ses-tokens.tsx` - standalone Solid sidebar adapter and exact SesTokens presentation.
- `tests/ses-tokens-model.test.mjs` - pure model tests.
- `tests/session-tree-snapshot.test.mjs` - topology, deterministic traversal, failure, and concurrency tests.
- `tests/ses-tokens-source.test.mjs` - deterministic source state-machine tests with fake events and timers.
- `tests/ses-tokens-state-types.fixture.ts` - compile-only local TUI API contract fixture.
- `tests/ses-tokens-mounted.fixture.ts` - mounted Solid/plugin host fixture.
- `tests/ses-tokens-mounted.test.mjs` - mounted layout, persistence, session, event, and cleanup tests.

**Modify:**

- `tests/compile-presentation.mjs` - compile the new pure modules and mounted fixture into `.tmp-test`.
- `shared/opencode-tools-shared.ts` - expose the SesTokens model, neutral loader, source, and their public types.
- `opencode-plugin-tui.d.ts` - declare only the path, session client, event, and sidebar properties SesTokens consumes.
- `tui/presentation/compact-panel.tsx` - add optional header detail without changing no-detail callers.
- `tests/compact-panel-mounted.fixture.ts` - mount optional detail.
- `tests/compact-panel-mounted.test.mjs` - detail placement/color/spacing and no-detail regression tests.
- `plugin-manifest.json` - add the independent SesTokens descriptor after TODO in the integration slice.
- `tui/runtime/manifest.ts` - add `ses-tokens` to `PluginKey` with the mounted panel so TypeScript accepts `pluginDescriptor("ses-tokens")` before production manifest wiring.
- `package.json` - export `./ses-tokens`.
- `tests/plugin-manifest.test.mjs` - expect the descriptor and package export.
- `tests/shared-boundary.test.mjs` - enforce shared-facade consumption and exports.
- `tests/plugin-build.test.mjs` - expect eight feature artifacts and standalone activation/dependency behavior.
- `tests/plugin-deploy.test.mjs` - expect SesTokens in managed configuration, copied artifacts, source cleanup, and idempotence.
- `tests/plugin-wiring.test.mjs` - expect package/docs/config/layout/build/deploy wiring.
- `README.md` - document feature semantics, opt-in configuration, layouts, artifact, source, deployment, and rollback.
- `openspec/changes/add-session-token-panel/tasks.md` - check each item only after its targeted tests pass.

**Intentionally unchanged:**

- `AGENTS.md` - user-authored acceptance text, already present as an uncommitted working-tree change.
- `build-plugins.mjs` and `deploy-plugins.mjs` - both derive feature artifacts and managed paths from `plugin-manifest.json`; integration tests must prove no script edit is needed.
- All SubAgent source, tests, artifacts, and parked change files.

---

### Task 1: Pure SesTokens Model And Shared Contract

**OpenSpec mapping:** Completes `1.1` and `1.2`.

**Files:**

- Create: `tests/ses-tokens-model.test.mjs`
- Create: `tui/features/ses-tokens.ts`
- Modify: `tests/compile-presentation.mjs:5-47`
- Modify: `shared/opencode-tools-shared.ts:14-35`
- Modify after GREEN: `openspec/changes/add-session-token-panel/tasks.md:3-4`

**Interfaces:**

- Consumes: `formatCount(value: number, precision?: number): string` from `tui/presentation/format.ts`; SDK `Message` and `AssistantMessage`; `PanelTextSegment`.
- Produces: `SesTokensMessage`, `SesTokenTotals`, `SesTokensPanelModel`, and `createSesTokensPanelModel(messages: readonly SesTokensMessage[]): SesTokensPanelModel`.

- [x] **Step 1: Add the compile entry and write the failing model tests**

Add these compile mappings to `tests/compile-presentation.mjs`, including `ses-tokens-model` in the cleanup-name array:

```js
["tui/features/ses-tokens.ts", ".tmp-test/ses-tokens-model.mjs", ["browser"]],
```

Create `tests/ses-tokens-model.test.mjs` with an `assistant(tokens)` helper and these exact behavioral groups:

```js
import assert from "node:assert/strict"
import test from "node:test"

const { createSesTokensPanelModel } = await import("../.tmp-test/ses-tokens-model.mjs")

const assistant = (tokens = {}) => ({
  role: "assistant",
  tokens: {
    input: 0,
    output: 0,
    reasoning: 0,
    cache: { read: 0, write: 0 },
    ...tokens,
  },
})

test("aggregates every assistant turn and all five detailed buckets", () => {
  const model = createSesTokensPanelModel([
    assistant({ input: 1_000, output: 20, reasoning: 30, cache: { read: 4_000, write: 50 } }),
    { role: "user", tokens: { input: 999_999 } },
    assistant({ input: 500, output: 80, reasoning: 70, cache: { read: 2_000, write: 250 } }),
  ])
  assert.deepEqual(model, {
    turns: "2",
    input: "1.5K",
    output: "100",
    reasoning: "100",
    cacheRead: "6K",
    cacheWrite: "300",
    cacheRatio: "3.3×",
    total: "8K",
    summary: [{ text: "Σ 8K / ↻ 2" }],
  })
})

test("counts zero-token assistants and treats missing or non-finite fields as zero", () => {
  const model = createSesTokensPanelModel([
    { role: "assistant" },
    assistant({ input: Number.NaN, output: Number.POSITIVE_INFINITY, reasoning: 0, cache: { read: 0, write: Number.NEGATIVE_INFINITY } }),
  ])
  assert.equal(model.turns, "2")
  assert.deepEqual([model.input, model.output, model.reasoning, model.cacheRead, model.cacheWrite, model.total], ["0", "0", "0", "0", "0", "0"])
  assert.equal(model.cacheRatio, "-")
})

test("handles normal and zero-denominator cache ratios", () => {
  assert.equal(createSesTokensPanelModel([assistant({ input: 3, cache: { read: 2, write: 1 } })]).cacheRatio, "0.5×")
  assert.equal(createSesTokensPanelModel([assistant({ cache: { read: 2, write: 0 } })]).cacheRatio, "∞")
  assert.equal(createSesTokensPanelModel([assistant()]).cacheRatio, "-")
})

test("uses compact uppercase boundaries without trailing decimal zeroes", () => {
  assert.equal(createSesTokensPanelModel([assistant({ input: 1_000 })]).input, "1K")
  assert.equal(createSesTokensPanelModel([assistant({ input: 1_500_000 })]).input, "1.5M")
  assert.equal(createSesTokensPanelModel([assistant({ input: 1_000_000_000 })]).input, "1B")
  assert.deepEqual(createSesTokensPanelModel([]).summary, [{ text: "Σ 0 / ↻ 0" }])
})
```

- [x] **Step 2: Run the focused test to verify RED**

Run: `node tests/compile-presentation.mjs && node --test tests/ses-tokens-model.test.mjs`

Expected: FAIL during esbuild with `Could not resolve "tui/features/ses-tokens.ts"` (or the model test fails because `createSesTokensPanelModel` is absent).

- [x] **Step 3: Implement the minimal pure model**

Create `tui/features/ses-tokens.ts` with these exact public shapes and rules:

```ts
import type { AssistantMessage, Message } from "@opencode-ai/sdk/v2"

import { formatCount } from "../presentation/format.js"
import type { PanelTextSegment } from "../presentation/types.js"

export type SesTokensMessage = Pick<Message, "role"> & Partial<Pick<AssistantMessage, "tokens">>

export type SesTokenTotals = {
  turns: number
  input: number
  output: number
  reasoning: number
  cacheRead: number
  cacheWrite: number
}

export type SesTokensPanelModel = {
  turns: string
  input: string
  output: string
  reasoning: string
  cacheRead: string
  cacheWrite: string
  cacheRatio: string
  total: string
  summary: readonly PanelTextSegment[]
}

function finite(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0
}

export function createSesTokensPanelModel(messages: readonly SesTokensMessage[]): SesTokensPanelModel {
  const totals: SesTokenTotals = { turns: 0, input: 0, output: 0, reasoning: 0, cacheRead: 0, cacheWrite: 0 }
  for (const message of messages) {
    if (message.role !== "assistant") continue
    totals.turns += 1
    totals.input += finite(message.tokens?.input)
    totals.output += finite(message.tokens?.output)
    totals.reasoning += finite(message.tokens?.reasoning)
    totals.cacheRead += finite(message.tokens?.cache?.read)
    totals.cacheWrite += finite(message.tokens?.cache?.write)
  }
  const denominator = totals.input + totals.cacheWrite
  const cacheRatio = denominator > 0
    ? `${(totals.cacheRead / denominator).toFixed(1)}×`
    : totals.cacheRead > 0 ? "∞" : "-"
  const turns = formatCount(totals.turns)
  const total = formatCount(totals.input + totals.output + totals.reasoning + totals.cacheRead + totals.cacheWrite)
  return {
    turns,
    input: formatCount(totals.input),
    output: formatCount(totals.output),
    reasoning: formatCount(totals.reasoning),
    cacheRead: formatCount(totals.cacheRead),
    cacheWrite: formatCount(totals.cacheWrite),
    cacheRatio,
    total,
    summary: [{ text: `Σ ${total} / ↻ ${turns}` }],
  }
}
```

Re-export the function and all four types from `shared/opencode-tools-shared.ts`; do not import Solid, timers, or a TUI API into the feature module.

- [x] **Step 4: Run the focused model test to verify GREEN**

Run: `node tests/compile-presentation.mjs && node --test tests/ses-tokens-model.test.mjs`

Expected: PASS with 4 tests and no esbuild errors.

- [x] **Step 5: Check off the model boundary**

Change only OpenSpec items `1.1` and `1.2` from `[ ]` to `[x]` in `openspec/changes/add-session-token-panel/tasks.md`.

- [x] **Step 6: Commit the model slice during implementation**

```bash
git add tui/features/ses-tokens.ts tests/ses-tokens-model.test.mjs tests/compile-presentation.mjs shared/opencode-tools-shared.ts openspec/changes/add-session-token-panel/tasks.md
git commit -m "feat: add session token model"
```

### Task 2: Neutral Session-Tree Snapshot

**OpenSpec mapping:** Implements the loader portion of `2.1` and `2.2`; leave both items unchecked until Task 3 also passes.

**Files:**

- Create: `tests/session-tree-snapshot.test.mjs`
- Create: `tui/services/session-tree-snapshot.ts`
- Modify: `tests/compile-presentation.mjs:5-47`
- Modify: `shared/opencode-tools-shared.ts`

**Interfaces:**

- Consumes: SDK `Session` and `Message` types; injected `listSessions()` and `listMessages(sessionID)` request functions.
- Produces: `SessionTreeRecord`, `SessionTreeSnapshot`, `SessionTreeSnapshotLoader`, `indexSessionsByParent`, `collectSessionTreeIDs`, and `loadSessionTreeSnapshot`.

- [x] **Step 1: Add the compile entry and write failing traversal/loader tests**

Add `session-tree-snapshot` to the cleanup array and this mapping:

```js
["tui/services/session-tree-snapshot.ts", ".tmp-test/session-tree-snapshot.mjs", ["browser"]],
```

Create `tests/session-tree-snapshot.test.mjs`. Use request fakes that return messages shaped as `{ role: "assistant", sessionID, tokens: ... }`, and add these named tests:

```js
test("keeps an omitted root and returns a root-only complete snapshot", async () => {})
test("traverses deep descendants in deterministic breadth-first order and excludes unrelated sessions", async () => {})
test("visits duplicate IDs and malformed parent cycles only once", async () => {})
test("never runs more than four message requests concurrently", async () => {})
test("rejects the whole snapshot when one message request fails", async () => {})
test("rejects before message requests when the directory list fails", async () => {})
```

For the deep-tree assertion, use this exact topology and expected order:

```js
const sessions = [
  { id: "unrelated" },
  { id: "child-a", parentID: "root" },
  { id: "grandchild", parentID: "child-a" },
  { id: "child-b", parentID: "root" },
]
assert.deepEqual(snapshot.sessionIDs, ["root", "child-a", "child-b", "grandchild"])
assert.deepEqual(messageCalls, ["root", "child-a", "child-b", "grandchild"])
```

For bounded concurrency, create ten children, increment `active` before each deferred message request, update `maximum = Math.max(maximum, active)`, release requests, and assert `maximum === 4`. For failure tests, assert rejection and that no `SessionTreeSnapshot` value is returned.

- [x] **Step 2: Run the snapshot test to verify RED**

Run: `node tests/compile-presentation.mjs && node --test tests/session-tree-snapshot.test.mjs`

Expected: FAIL during esbuild with `Could not resolve "tui/services/session-tree-snapshot.ts"`.

- [x] **Step 3: Implement parent indexing, traversal, and bounded workers**

Create the module around these exact signatures:

```ts
import type { Message, Session } from "@opencode-ai/sdk/v2"

export type SessionTreeRecord = Pick<Session, "id" | "parentID">
export type SessionTreeSnapshot = {
  sessionIDs: readonly string[]
  messages: readonly Message[]
}
export type SessionTreeSnapshotLoader = (rootSessionID: string) => Promise<SessionTreeSnapshot>
export type LoadSessionTreeSnapshotOptions = {
  rootSessionID: string
  listSessions(): Promise<readonly SessionTreeRecord[]>
  listMessages(sessionID: string): Promise<readonly Message[]>
  concurrency?: number
}

export function indexSessionsByParent(
  sessions: readonly SessionTreeRecord[],
): ReadonlyMap<string, readonly SessionTreeRecord[]> { /* append records in list order */ }

export function collectSessionTreeIDs(
  rootSessionID: string,
  byParent: ReadonlyMap<string, readonly SessionTreeRecord[]>,
): string[] { /* breadth-first queue plus visited set, root first */ }

export async function loadSessionTreeSnapshot(
  options: LoadSessionTreeSnapshotOptions,
): Promise<SessionTreeSnapshot> { /* list once, collect IDs, run min(4, requested concurrency) workers, flatten by ID order */ }
```

Use one shared integer cursor for workers and an array indexed by traversal position. Await `Promise.all(workers)` before flattening; allowing any worker rejection to reject the whole call prevents partial publication. Normalize concurrency to a finite positive integer and cap it at `4`; default to `4`.

Re-export the loader, pure helpers, and types from `shared/opencode-tools-shared.ts`. Do not import `TuiPluginApi`, SesTokens source state, or UI types into this neutral module.

- [x] **Step 4: Run the focused snapshot suite to verify GREEN**

Run: `node tests/compile-presentation.mjs && node --test tests/session-tree-snapshot.test.mjs`

Expected: PASS with all six topology/concurrency/failure tests.

- [x] **Step 5: Commit the neutral loader slice during implementation**

```bash
git add tui/services/session-tree-snapshot.ts tests/session-tree-snapshot.test.mjs tests/compile-presentation.mjs shared/opencode-tools-shared.ts
git commit -m "feat: load complete session tree snapshots"
```

### Task 3: Event-Driven Refresh Source

**OpenSpec mapping:** Completes `2.1` and `2.2`, including the tests and implementation begun in Task 2.

**Files:**

- Create: `tests/ses-tokens-source.test.mjs`
- Create: `tui/services/ses-tokens-source.ts`
- Modify: `tests/compile-presentation.mjs:5-47`
- Modify: `shared/opencode-tools-shared.ts`
- Modify after GREEN: `openspec/changes/add-session-token-panel/tasks.md:8-9`

**Interfaces:**

- Consumes: `SessionTreeSnapshot`, `SessionTreeSnapshotLoader`, SDK lifecycle event shapes, injected event registration, and injected timer functions.
- Produces: `SesTokensSourceState`, `SesTokensSource`, `SesTokensSourceDependencies`, and `createSesTokensSource(dependencies): SesTokensSource`.

- [x] **Step 1: Add the compile entry and deterministic source test harness**

Add `ses-tokens-source` to cleanup and compile:

```js
["tui/services/ses-tokens-source.ts", ".tmp-test/ses-tokens-source.mjs", ["browser"]],
```

Create a fake scheduler in `tests/ses-tokens-source.test.mjs` whose `setTimer` records `{ delay, callback, cancelled }`, whose `clearTimer` marks the record cancelled, and whose `runNext(delay)` executes the next non-cancelled matching callback. Create an event registrar that stores one handler per event type and returns counted unsubscribe functions. Create deferred loader results to control completion order.

Write these exact named tests and assertions:

```js
test("loads a non-empty initial target immediately and skips an empty target", async () => {})
test("coalesces relevant message events into one 200 ms refresh", async () => {})
test("ignores message events outside the last complete subtree", async () => {})
test("refreshes for created updated and deleted descendant topology", async () => {})
test("switches immediately for slot and non-empty select targets", async () => {})
test("does not publish an old generation after a session switch", async () => {})
test("does not let an event-superseded request replace a newer snapshot", async () => {})
test("retries after 2 4 and 8 seconds then becomes unavailable", async () => {})
test("retains a ready snapshot as stale after exhausted background retries", async () => {})
test("recovers stale to ready with a later complete snapshot", async () => {})
test("disposal during retry clears timers unsubscribes events and blocks updates", async () => {})
```

Assert the exact phase shapes rather than only phase names, for example:

```js
assert.deepEqual(source.state(), { phase: "loading", sessionID: "root" })
assert.deepEqual(source.state(), { phase: "ready", sessionID: "root", snapshot })
assert.deepEqual(source.state(), { phase: "stale", sessionID: "root", snapshot })
assert.deepEqual(source.state(), { phase: "unavailable", sessionID: "root" })
assert.deepEqual(scheduler.pendingDelays(), [2_000, 4_000, 8_000])
```

Cover every registered type: `message.updated`, `message.removed`, `session.created`, `session.updated`, `session.deleted`, and `tui.session.select`. For session events, assert refresh when either `info.id`/`sessionID` or `info.parentID` is known; for select, assert an empty or unchanged ID does nothing.

- [x] **Step 2: Run the source suite to verify RED**

Run: `node tests/compile-presentation.mjs && node --test tests/ses-tokens-source.test.mjs`

Expected: FAIL during esbuild with `Could not resolve "tui/services/ses-tokens-source.ts"`.

- [x] **Step 3: Implement the source state machine**

Use these public types so the panel and fixture share one contract:

```ts
import type { Event } from "@opencode-ai/sdk/v2"
import type { SessionTreeSnapshot, SessionTreeSnapshotLoader } from "./session-tree-snapshot.js"

export type SesTokensSourceState =
  | { phase: "loading"; sessionID: string }
  | { phase: "unavailable"; sessionID: string }
  | { phase: "ready"; sessionID: string; snapshot: SessionTreeSnapshot }
  | { phase: "stale"; sessionID: string; snapshot: SessionTreeSnapshot }

export type SesTokensRefreshEvent = Extract<Event, { type:
  | "message.updated"
  | "message.removed"
  | "session.created"
  | "session.updated"
  | "session.deleted"
  | "tui.session.select"
}>

export type SesTokensEventRegistrar = <Type extends SesTokensRefreshEvent["type"]>(
  type: Type,
  handler: (event: Extract<SesTokensRefreshEvent, { type: Type }>) => void,
) => () => void

export type SesTokensSourceDependencies = {
  loadSnapshot: SessionTreeSnapshotLoader
  onEvent: SesTokensEventRegistrar
  setTimer(callback: () => void, delayMs: number): unknown
  clearTimer(timer: unknown): void
}

export type SesTokensSource = {
  state(): SesTokensSourceState | undefined
  subscribe(listener: () => void): () => void
  setSessionID(sessionID: string): void
  dispose(): void
}

export function createSesTokensSource(dependencies: SesTokensSourceDependencies): SesTokensSource
```

Implementation sequence:

1. Register all six events once and keep every unsubscriber.
2. Keep `sessionID`, `generation`, `knownSessionIDs`, `state`, listeners, one debounce timer, a set of retry timers, and `disposed` in closure state.
3. `setSessionID("")` increments generation, clears timers, clears state/known IDs, and performs no load. A changed non-empty ID sets `{ phase: "loading", sessionID }`, resets known IDs to the root, notifies, and starts immediately.
4. A load captures ID and generation. Attempt immediately, then wait at 2, 4, and 8 seconds before attempts 2-4. Check disposal, ID, and generation before and after every wait and request.
5. On success, replace the complete snapshot, replace known IDs from `snapshot.sessionIDs`, set `ready`, and notify. On exhausted failure, turn `loading` into `unavailable`; turn `ready`/`stale` into `stale` while preserving the exact snapshot object.
6. Message events match `event.properties.sessionID`. Created/updated events match `event.properties.info.id`, `event.properties.sessionID`, or `event.properties.info.parentID`; deleted events match the deleted ID. Relevant lifecycle events clear/restart a 200 ms debounce.
7. A non-empty changed `tui.session.select` calls `setSessionID` directly, without debounce.
8. `dispose()` is idempotent: mark disposed, increment generation, clear debounce/retry timers, call each unsubscriber once, clear listeners, and reject all later publication.

Use global `setTimeout`/`clearTimeout` only as default dependency values at the factory boundary; all state-machine tests use injected fakes. Re-export the factory and source types from `shared/opencode-tools-shared.ts`.

- [x] **Step 4: Run source and neutral-loader tests to verify GREEN**

Run: `node tests/compile-presentation.mjs && node --test tests/session-tree-snapshot.test.mjs tests/ses-tokens-source.test.mjs`

Expected: PASS for all snapshot and source tests; no real retry delay is incurred.

- [x] **Step 5: Check off the data-source boundary**

Change only OpenSpec items `2.1` and `2.2` from `[ ]` to `[x]`.

- [x] **Step 6: Commit the refresh source slice during implementation**

```bash
git add tui/services/ses-tokens-source.ts tests/ses-tokens-source.test.mjs tests/compile-presentation.mjs shared/opencode-tools-shared.ts openspec/changes/add-session-token-panel/tasks.md
git commit -m "feat: refresh session token snapshots"
```

### Task 4: Local OpenCode TUI API Declarations

**OpenSpec mapping:** Completes `2.3`.

**Files:**

- Create: `tests/ses-tokens-state-types.fixture.ts`
- Modify: `opencode-plugin-tui.d.ts:1-128`
- Modify after GREEN: `openspec/changes/add-session-token-panel/tasks.md:10`

**Interfaces:**

- Consumes: SDK `Event`, `Message`, and `Session`.
- Produces: compile-time declarations for `api.state.path.directory`, session list/messages client responses, six typed events, and `sidebar_content`'s optional `session_id`.

- [x] **Step 1: Write the compile-only fixture first**

Create `tests/ses-tokens-state-types.fixture.ts`; it is already included by `tests/*-state-types.fixture.ts` in `tsconfig.json`.

```ts
import type { Message, Session } from "@opencode-ai/sdk/v2"
import type { TuiPluginApi } from "@opencode-ai/plugin/tui"

export async function inspectSesTokensApi(api: TuiPluginApi, sessionID: string) {
  const directory: string = api.state.path.directory
  const sessions = await api.client.session.list({ directory })
  const messages = await api.client.session.messages({ sessionID, directory })
  const unregister = [
    api.event.on("message.updated", (event) => event.properties.info.role),
    api.event.on("message.removed", (event) => event.properties.sessionID),
    api.event.on("session.created", (event) => event.properties.info.parentID),
    api.event.on("session.updated", (event) => event.properties.info.id),
    api.event.on("session.deleted", (event) => event.properties.sessionID),
    api.event.on("tui.session.select", (event) => event.properties.sessionID),
  ]
  api.slots.register({
    slots: {
      sidebar_content(_ctx, props: { session_id?: string }) {
        return props.session_id ? null : null
      },
    },
  })
  return {
    directory,
    sessions: sessions.data as readonly Session[] | undefined,
    messages: messages.data as readonly { info: Message }[] | undefined,
    unregister,
  }
}
```

- [x] **Step 2: Run typecheck to verify RED**

Run: `npm run typecheck`

Expected: FAIL in `tests/ses-tokens-state-types.fixture.ts` because `state.path`, `client.session.list`, `client.session.messages`, and typed sidebar props are not declared.

- [x] **Step 3: Add the narrow local declarations**

In `opencode-plugin-tui.d.ts` import `Message` and `Session` alongside existing SDK types, retain the existing `message.updated` compatibility alias, and add only:

```ts
type TuiClientResult<Data> = Promise<{ data?: Data; error?: unknown }>

// Inside TuiPluginApi.client.session
list(input: { directory?: string }): TuiClientResult<readonly Session[]>
messages(input: { sessionID: string; directory?: string }): TuiClientResult<readonly { info: Message }[]>

// Inside TuiPluginApi.state
path: { directory: string }

// Replace only the sidebar callback's untyped props surface
slots: Record<string, (ctx: any, props: { session_id?: string }) => JSX.Element | null>
```

Keep `prompt` and all existing state/client methods unchanged. The SDK `Event` union already supplies all six event property shapes through the generic `event.on` declaration.

- [x] **Step 4: Run typecheck to verify GREEN**

Run: `npm run typecheck`

Expected: PASS with no diagnostics.

- [x] **Step 5: Check off and commit the declaration boundary during implementation**

Change OpenSpec item `2.3` to `[x]`, then:

```bash
git add opencode-plugin-tui.d.ts tests/ses-tokens-state-types.fixture.ts openspec/changes/add-session-token-panel/tasks.md
git commit -m "feat: declare session token TUI APIs"
```

### Task 5: Optional CompactPanel Header Detail

**OpenSpec mapping:** Supports the stale cases in `3.1` and `3.2`; leave both unchecked until Task 6 passes.

**Files:**

- Modify: `tests/compact-panel-mounted.fixture.ts`
- Modify: `tests/compact-panel-mounted.test.mjs:40-113`
- Modify: `tui/presentation/compact-panel.tsx:8-89`

**Interfaces:**

- Consumes: existing `CompactPanelSummary`, `PanelTextSegment`, and `PanelTheme`.
- Produces: backward-compatible `CompactPanelProps.detail?: CompactPanelSummary` rendered in expanded and collapsed headers.

- [x] **Step 1: Extend the fixture and add failing detail tests**

Add `detail?: CompactPanelSummary` to the fixture options and pass it through to `CompactPanel`. Add tests that mount:

```js
const detail = { text: "stale", status: "warning" }
const summary = { text: "Σ 29.1M / ↻ 97", segments: [{ text: "Σ 29.1M / ↻ 97" }] }
```

Assert all of the following:

- Expanded: `stale` is present after the flexible title, colored `#ffaa00`, while summary is absent.
- Collapsed: detail and summary are both present, exactly one fixed-width text node contains `" "` between them, and concatenated right-side text is `stale Σ 29.1M / ↻ 97`.
- Segment detail: two detail segments preserve their individual statuses.
- Narrow allocation: title remains `flexBasis={0}`, `flexGrow={1}`, and `minWidth={0}`; detail, separator, and summary do not shrink.
- Regression: the existing no-detail collapsed element text/color sequence and both existing divider tests remain byte-for-byte unchanged.

- [x] **Step 2: Run the CompactPanel suite to verify RED**

Run: `node tests/compile-presentation.mjs && node --test tests/compact-panel-mounted.test.mjs`

Expected: FAIL because fixture options/`CompactPanelProps` reject `detail`, or because no detail nodes render.

- [x] **Step 3: Implement one reusable summary renderer and optional detail**

Add `detail?: CompactPanelSummary` to `CompactPanelProps`. Extract the existing segment-or-text branch into a local `CompactSummary` component receiving `value` and `theme`. Render in this order inside the header:

```tsx
<text width={2}>{props.collapsed ? "▶ " : "▼ "}</text>
<text flexBasis={0} flexGrow={1} flexShrink={1} minWidth={0}>{props.title}</text>
<Show when={props.detail}>{(detail) => <CompactSummary value={detail()} theme={props.theme} />}</Show>
<Show when={props.collapsed && props.detail && props.summary}><text width={1} flexShrink={0}> </text></Show>
<Show when={props.collapsed ? props.summary : undefined}>
  {(summary) => <CompactSummary value={summary()} theme={props.theme} />}
</Show>
```

The summary wrapper and text nodes must use `flexShrink={0}`. Existing callers omit `detail`, so the separator condition stays false and their structure remains unchanged apart from the title's explicit shrink/min-width safeguards.

- [x] **Step 4: Run CompactPanel and existing mounted suites to verify GREEN/no regression**

Run: `node tests/compile-presentation.mjs && node --test tests/compact-panel-mounted.test.mjs tests/mcp-mounted.test.mjs tests/context-mounted.test.mjs tests/lsp-mounted.test.mjs tests/todo-mounted.test.mjs`

Expected: PASS for new detail cases and all existing no-detail panels.

- [x] **Step 5: Commit the presentation primitive during implementation**

```bash
git add tui/presentation/compact-panel.tsx tests/compact-panel-mounted.fixture.ts tests/compact-panel-mounted.test.mjs
git commit -m "feat: support compact panel header detail"
```

### Task 6: Mounted Standalone SesTokens Panel

**OpenSpec mapping:** Completes `3.1` and `3.2`.

**Files:**

- Create: `tests/ses-tokens-mounted.fixture.ts`
- Create: `tests/ses-tokens-mounted.test.mjs`
- Create: `tui/ses-tokens.tsx`
- Modify: `tests/compile-presentation.mjs:5-47`
- Modify: `tui/runtime/manifest.ts:3`
- Modify after GREEN: `openspec/changes/add-session-token-panel/tasks.md:14-15`

**Interfaces:**

- Consumes: `CompactPanel`, `createSesTokensPanelModel`, `createSesTokensSource`, `loadSessionTreeSnapshot`, `defineTuiPlugin`, `pluginDescriptor`, source state/types, and SDK-backed client declarations through `shared/opencode-tools-shared.ts`.
- Produces: the runtime key plus a default plugin module with ID `aamkye/opencode-tools-ses-tokens`, slot order `115`, one `sidebar_content` callback, and persisted collapse behavior. The mounted compiler injects the approved descriptor only for this pre-integration test; Task 7 adds it to production manifest data.

- [x] **Step 1: Add the mounted compile target and build a controllable host fixture**

Import `readFileSync` from `node:fs`, add `ses-tokens-mounted` to cleanup, and define a test-only esbuild plugin that extends the current JSON manifest without changing `plugin-manifest.json`:

```js
const sesTokensDescriptor = {
  key: "ses-tokens",
  id: "aamkye/opencode-tools-ses-tokens",
  source: "tui/ses-tokens.tsx",
  outfile: "opencode-tools-ses-tokens.js",
  slotOrder: 115,
  options: "none",
}
const sesTokensManifestPlugin = {
  name: "ses-tokens-test-manifest",
  setup(buildApi) {
    buildApi.onLoad({ filter: /plugin-manifest\.json$/ }, () => ({
      contents: JSON.stringify([...JSON.parse(readFileSync("plugin-manifest.json", "utf8")), sesTokensDescriptor]),
      loader: "json",
    }))
  },
}
```

Compile the fixture with that plugin:

```js
["tests/ses-tokens-mounted.fixture.ts", ".tmp-test/ses-tokens-mounted.mjs", ["browser"], [sesTokensManifestPlugin]],
```

The fixture must provide:

- `api.state.path.directory = "/repo"`.
- Fake `client.session.list` and `client.session.messages` calls/results.
- A handler map for all six `api.event.on` registrations and counted unsubscriptions.
- Fake scheduler controls passed through a test-only source factory seam exported by `tui/ses-tokens.tsx` as `sesTokensSourceTestKey`.
- KV read/write tracking and shared store remounts.
- Source-state controls for loading, unavailable, ready, and stale snapshots.
- A `view(width = 37)` result exposing marker, title, detail text/color, summary text/segments/colors, fallback text/color, metric rows in DOM order, rendered width, divider count, and `clickHeader()`.
- `setSessionID`, `emit`, `resolveList`, `resolveMessages`, `runTimer`, and `dispose` helpers.

Do not duplicate aggregation in the fixture; snapshots contain SDK-like messages and the mounted panel must call the shared pure model.

- [x] **Step 2: Write the failing mounted acceptance tests**

Create `tests/ses-tokens-mounted.test.mjs` with these named tests:

```js
test("registers ID order and one session-scoped sidebar slot", async () => {})
test("renders the exact expanded row order symbols values and three dividers", async () => {})
test("collapses to the token-turn summary and persists across remount", async () => {})
test("renders stale detail in expanded and collapsed option-A headers", async () => {})
test("renders muted loading and unavailable states without zero metrics", async () => {})
test("renders every all-zero ready row as valid data", async () => {})
test("right-aligns values within 37 cells without trailing whitespace", async () => {})
test("switches slot sessions without remounting or leaking prior metrics", async () => {})
test("registers refresh events and removes subscriptions and timers on disposal", async () => {})
```

Use these exact ready-row assertions:

```js
assert.deepEqual(view.rows.map(({ label, value }) => [label, value]), [
  ["↻ turns", "97"],
  ["↑ in", "4.4M"],
  ["↓ out", "18.6K"],
  ["▤ cache write", "0"],
  ["▤ cache read", "24.7M"],
  ["ø cache hit ratio", "5.6×"],
  ["✦ think", "2.8K"],
  ["Σ total", "29.1M"],
])
assert.equal(view.dividerCount, 3)
```

Assert collapsed text `Σ 29.1M / ↻ 97`; stale detail `stale` has warning color; loading/unavailable have muted color; and each rendered metric line satisfies `cells <= 37` and `line.trimEnd() === line`. Assert no client call occurs for an empty session ID.

- [x] **Step 3: Run the mounted suite to verify RED**

Run: `node tests/compile-presentation.mjs && node --test tests/ses-tokens-mounted.test.mjs`

Expected: FAIL because `tui/ses-tokens.tsx` does not exist.

- [x] **Step 4: Add the runtime key and implement the thin Solid adapter**

First add `"ses-tokens"` to `PluginKey` in `tui/runtime/manifest.ts`. The test-only esbuild plugin from Step 1 lets the mounted fixture evaluate `pluginDescriptor("ses-tokens")`; do not add the production manifest entry until Task 7's integration RED test exists.

Create `tui/ses-tokens.tsx` with:

```ts
const descriptor = pluginDescriptor("ses-tokens")
const COLLAPSED_KEY = "aamkye.opencode-tools-ses-tokens.collapsed"
export const sesTokensSourceTestKey = Symbol("ses-tokens-source-test")
```

Activation behavior:

1. Build one loader using `api.state.path.directory`, `api.client.session.list({ directory })`, and `api.client.session.messages({ sessionID, directory })`. Reject when a result has `error` or lacks `data`; map message result records to `record.info`.
2. Build one source using the loader, `api.event.on`, and global timers, unless the test seam in `meta[sesTokensSourceTestKey]` supplies a source factory.
3. Register `source.dispose` with `context.onCleanup` and bridge `source.subscribe` to one Solid signal containing `source.state()`.
4. Register one `sidebar_content` callback at `descriptor.slotOrder`; call `source.setSessionID(props.session_id ?? "")` and return `null` for an empty ID, otherwise return `SesTokensPanel`.

Component behavior:

- Initialize collapse from `api.kv.get(COLLAPSED_KEY, false)` and write only after a header click.
- Build the model only for `ready`/`stale` snapshots.
- Pass `detail={{ text: "stale", status: "warning" }}` only in stale state.
- Pass model summary only for ready/stale collapsed state; pass muted `Loading...` or `Usage unavailable` summaries for those phases.
- Expanded loading/unavailable body is one muted text node and contains no metric rows.
- Render metric rows with a full-width horizontal box, a flexible muted label, and non-shrinking right value. Insert an internal top-border divider immediately before total; let `CompactPanel` render header and footer dividers.
- Keep exact labels/order from the test. Render all rows for a complete all-zero snapshot.
- Import all feature, service, runtime, panel, and type contracts from `../shared/opencode-tools-shared.js`; no sibling plugin or SubAgent import is allowed.

- [x] **Step 5: Run mounted and source suites to verify GREEN**

Run: `node tests/compile-presentation.mjs && node --test tests/ses-tokens-mounted.test.mjs tests/ses-tokens-source.test.mjs tests/session-tree-snapshot.test.mjs tests/ses-tokens-model.test.mjs tests/compact-panel-mounted.test.mjs`

Expected: PASS for all new panel layers and CompactPanel detail behavior.

- [x] **Step 6: Check off the sidebar boundary**

Change only OpenSpec items `3.1` and `3.2` from `[ ]` to `[x]`.

- [x] **Step 7: Commit the mounted panel slice during implementation**

```bash
git add tui/ses-tokens.tsx tui/runtime/manifest.ts tests/ses-tokens-mounted.fixture.ts tests/ses-tokens-mounted.test.mjs tests/compile-presentation.mjs openspec/changes/add-session-token-panel/tasks.md
git commit -m "feat: add session token sidebar panel"
```

### Task 7: Manifest, Package, Build, Deploy, And Documentation Wiring

**OpenSpec mapping:** Completes `4.1` and `4.2`.

**Files:**

- Modify tests first: `tests/plugin-manifest.test.mjs`
- Modify tests first: `tests/shared-boundary.test.mjs`
- Modify tests first: `tests/plugin-build.test.mjs`
- Modify tests first: `tests/plugin-deploy.test.mjs`
- Modify tests first: `tests/plugin-wiring.test.mjs`
- Modify GREEN: `plugin-manifest.json`
- Verify GREEN scaffolding from Task 6: `tui/runtime/manifest.ts:3`
- Modify GREEN: `package.json:7-15`
- Modify GREEN: `README.md`
- Verify unchanged: `build-plugins.mjs`
- Verify unchanged: `deploy-plugins.mjs`
- Modify after GREEN: `openspec/changes/add-session-token-panel/tasks.md:19-20`

**Interfaces:**

- Consumes: completed standalone `tui/ses-tokens.tsx`, shared facade exports, manifest-driven build/deploy loops.
- Produces: production plugin descriptor, package export `./ses-tokens`, artifact/build/deploy coverage for `opencode-tools-ses-tokens.js`, and user documentation.

- [ ] **Step 1: Add failing integration expectations before wiring**

Update the expected descriptor in `tests/plugin-manifest.test.mjs` after TODO:

```js
["ses-tokens", "aamkye/opencode-tools-ses-tokens", "tui/ses-tokens.tsx", "opencode-tools-ses-tokens.js", 115, "none"],
```

Update the package-export expectation with:

```js
"./ses-tokens": "./tui/ses-tokens.tsx",
```

In `tests/shared-boundary.test.mjs`, parse `tui/ses-tokens.tsx` and assert it named-imports and calls `createSesTokensPanelModel` from the shared facade; allow only `../shared/opencode-tools-shared.js` as its relative import. Assert the shared facade has named re-exports for `createSesTokensPanelModel`, `loadSessionTreeSnapshot`, and `createSesTokensSource` and remains free of JSX/plugin registration.

In `tests/plugin-build.test.mjs`:

- Change expected artifact count from 8 to 9 and feature count from 7 to 8.
- Add `ses-tokens: { slots: ["sidebar_content"], keymaps: 0 }`.
- Extend fake API with `state.path.directory`, `client.session.list`, and `client.session.messages`.
- Assert shared metafile inputs include `tui/features/ses-tokens.ts`, `tui/services/session-tree-snapshot.ts`, and `tui/services/ses-tokens-source.ts`.
- Assert `dist/opencode-tools-ses-tokens.js` imports `./opencode-tools-shared.js`, contains no sibling feature source, and activates alone.

In `tests/plugin-deploy.test.mjs`:

- Add `./opencode-tools-ses-tokens.js` to `expectedManagedSpecs` after TODO.
- Seed stale `opencode-tools-ses-tokens.js` and `tui/ses-tokens.tsx` entries/files in the fixture.
- Add `assertPlainSesTokensEntry` equivalent to the existing Context/LSP/TODO checks.
- Verify source cleanup, artifact copy, managed config order, no options object, idempotence, project fallback, and global deployment snapshots.

In `tests/plugin-wiring.test.mjs`:

- Add the package export, runtime ID, configuration entry, README feature/layout extraction, artifact/source rows, rollback text, and count changes from seven to eight.
- Extract `AGENTS.md` SesTokens only for comparison; do not write it.
- Assert README expanded/stale/collapsed/stale-collapsed examples match the approved SesTokens lines, each line is at most 37 cells, and no line has trailing whitespace.
- Assert docs state assistant-only full-tree aggregation, all five buckets, formulae, 200 ms event debounce, 2/4/8 retry, stale retention/recovery, no polling, memory-only snapshots, and persisted collapse only.

- [ ] **Step 2: Run integration tests to verify RED**

Run:

```bash
node tests/compile-presentation.mjs
node --test tests/plugin-manifest.test.mjs tests/shared-boundary.test.mjs tests/plugin-build.test.mjs tests/plugin-deploy.test.mjs tests/plugin-wiring.test.mjs
```

Expected: FAIL because the production manifest/package/README do not yet expose SesTokens and build/deploy expectations still see seven features. Task 6 mounted tests used only a test-injected descriptor.

- [ ] **Step 3: Add the production descriptor and package export**

Append after TODO in `plugin-manifest.json`:

```json
{
  "key": "ses-tokens",
  "id": "aamkye/opencode-tools-ses-tokens",
  "source": "tui/ses-tokens.tsx",
  "outfile": "opencode-tools-ses-tokens.js",
  "slotOrder": 115,
  "options": "none"
}
```

Verify `PluginKey` still includes `"ses-tokens"`, then add `"./ses-tokens": "./tui/ses-tokens.tsx"` after `./todo` in `package.json`. Do not edit `build-plugins.mjs` or `deploy-plugins.mjs`; their manifest loops must pick up the descriptor.

- [ ] **Step 4: Document the exact standalone behavior and layouts**

Update `README.md` consistently:

- Add SesTokens to the introduction and a `### SesTokens` feature section after TODO.
- Add `./opencode-tools-ses-tokens.js` after TODO in the configuration example and state it accepts no options and has no built-in override.
- Add `### SesTokens sidebar layouts` after TODO layouts with ready expanded, stale expanded, ready collapsed, stale collapsed, loading, and unavailable behavior. Use no right-padding in fenced examples; explain that OpenTUI flex alignment supplies the visual spacing.
- Change every standalone feature/build/deploy count from seven to eight.
- Add independent removal instructions under rollback.
- Add the artifact to the tree/table with runtime ID and complete descendant-tree responsibility.
- Add `tui/ses-tokens.tsx`, `tui/features/ses-tokens.ts`, and both `tui/services/` modules to source documentation.
- State that snapshots are memory-only, only collapse state persists, and no polling or cost calculation occurs.

Do not alter `AGENTS.md`; the current user-authored layouts are canonical input to these README tests.

- [ ] **Step 5: Run focused integration tests to verify GREEN**

Run:

```bash
node tests/compile-presentation.mjs
node --test tests/plugin-manifest.test.mjs tests/shared-boundary.test.mjs tests/plugin-build.test.mjs tests/plugin-deploy.test.mjs tests/plugin-wiring.test.mjs
```

Expected: PASS; build emits nine total artifacts (shared plus eight plugins), deployment is idempotent, and docs/layout assertions pass.

- [ ] **Step 6: Check off the integration boundary**

Change only OpenSpec items `4.1` and `4.2` from `[ ]` to `[x]`.

- [ ] **Step 7: Commit integration wiring during implementation**

```bash
git add plugin-manifest.json package.json README.md tests/plugin-manifest.test.mjs tests/shared-boundary.test.mjs tests/plugin-build.test.mjs tests/plugin-deploy.test.mjs tests/plugin-wiring.test.mjs openspec/changes/add-session-token-panel/tasks.md
git commit -m "feat: wire session token plugin"
```

### Task 8: Full Verification And Acceptance Closeout

**OpenSpec mapping:** Completes `5.1`; verifies all ten checklist items without modifying acceptance text.

**Files:**

- Modify only after all checks pass: `openspec/changes/add-session-token-panel/tasks.md:24`
- Verify unchanged: `AGENTS.md`
- Inspect generated, untracked: `dist/opencode-tools-ses-tokens.js`
- Inspect generated, untracked: `dist/opencode-tools-shared.js`

**Interfaces:**

- Consumes: all implementation slices and integration contracts.
- Produces: passing focused/full verification evidence and a fully checked ten-item OpenSpec task list.

- [ ] **Step 1: Run all focused SesTokens and regression tests**

Run:

```bash
node tests/compile-presentation.mjs
node --test tests/ses-tokens-model.test.mjs tests/session-tree-snapshot.test.mjs tests/ses-tokens-source.test.mjs tests/compact-panel-mounted.test.mjs tests/ses-tokens-mounted.test.mjs tests/plugin-manifest.test.mjs tests/shared-boundary.test.mjs tests/plugin-build.test.mjs tests/plugin-deploy.test.mjs tests/plugin-wiring.test.mjs
```

Expected: PASS with zero failed tests.

- [ ] **Step 2: Run local declaration typecheck**

Run: `npm run typecheck`

Expected: exit code 0 and no TypeScript diagnostics, including `tests/ses-tokens-state-types.fixture.ts`.

- [ ] **Step 3: Run the full repository test suite**

Run: `npm test`

Expected: both compile scripts and every `tests/*.test.mjs` test pass with zero failures.

- [ ] **Step 4: Build all standalone artifacts**

Run: `npm run build`

Expected: exit code 0; `dist/opencode-tools-shared.js` and `dist/opencode-tools-ses-tokens.js` are non-empty minified ESM artifacts.

- [ ] **Step 5: Inspect the SesTokens bundle for forbidden source imports**

Run:

```bash
node --input-type=module -e 'import assert from "node:assert/strict"; import { readFileSync } from "node:fs"; const code = readFileSync("dist/opencode-tools-ses-tokens.js", "utf8"); const imports = [...code.matchAll(/from["'"']([^"'"']+)["'"']/gu)].map((match) => match[1]); assert.ok(imports.includes("./opencode-tools-shared.js")); for (const specifier of imports) assert.equal(specifier.startsWith("../") || specifier.includes("/tui/") || specifier.includes("/features/") || specifier.includes("/services/"), false, `forbidden source import: ${specifier}`);'
```

Expected: exit code 0; the feature imports the built shared artifact and no repository source path.

- [ ] **Step 6: Prove the user-authored AGENTS.md remained untouched**

Run: `shasum -a 256 AGENTS.md`

Expected exactly:

```text
f118dd027caac7bce5ed9cf80ebfae83d9a0cc58e50e4831e74df8b1f2dac725  AGENTS.md
```

Then run: `git status --short`

Expected: `AGENTS.md` remains an unstaged user-authored modification; no generated `dist/` or `.tmp-test/` artifact is staged or tracked.

- [ ] **Step 7: Check the final OpenSpec item and validate checklist coverage**

Change OpenSpec item `5.1` to `[x]`. Run:

```bash
node -e 'const fs=require("node:fs"); const text=fs.readFileSync("openspec/changes/add-session-token-panel/tasks.md","utf8"); const items=[...text.matchAll(/^- \[x\] /gm)]; if(items.length!==10) throw new Error(`expected 10 checked items, got ${items.length}`)'
```

Expected: exit code 0 and exactly ten checked OpenSpec items.

- [ ] **Step 8: Commit verification bookkeeping during implementation**

```bash
git add openspec/changes/add-session-token-panel/tasks.md
git commit -m "test: verify session token panel"
```

Do not add `AGENTS.md`, `dist/`, or `.tmp-test/` to this commit.

## Coverage Matrix

| OpenSpec item | Plan task | Completion evidence |
| --- | --- | --- |
| `1.1` model tests | Task 1 | `tests/ses-tokens-model.test.mjs` RED then GREEN |
| `1.2` pure model/shared export | Task 1 | feature compile and model tests pass |
| `2.1` data-source tests | Tasks 2-3 | snapshot and source suites pass |
| `2.2` loader/coordinator | Tasks 2-3 | topology, concurrency, event, retry, generation, stale, disposal tests pass |
| `2.3` local declarations | Task 4 | `npm run typecheck` passes fixture |
| `3.1` mounted tests | Tasks 5-6 | CompactPanel and SesTokens mounted suites pass |
| `3.2` Solid panel | Tasks 5-6 | exact rows, states, width, persistence, switch, and disposal pass |
| `4.1` integration expectations | Task 7 | manifest/shared/build/deploy/wiring tests first fail then pass |
| `4.2` integration wiring/docs | Task 7 | eight plugins build/deploy/document in manifest order |
| `5.1` final verification | Task 8 | focused tests, typecheck, full tests, build, bundle inspection, AGENTS hash pass |

## Execution Handoff

The implementation session must first resolve Comet's pending workspace-isolation and build-mode decisions. Because `AGENTS.md` is intentionally uncommitted acceptance input, a new worktree created from `base-ref` will not contain its approved SesTokens section; use the current worktree on a new branch or explicitly arrange read-only access to that exact content without editing, staging, reverting, or committing `AGENTS.md`.
