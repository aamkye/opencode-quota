---
change: add-subagent-panel
design-doc: docs/superpowers/specs/2026-07-19-subagent-panel-design.md
base-ref: 5a0b6c3
---

# SubAgent Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an independently buildable SubAgent sidebar plugin that reconstructs and monitors direct child sessions, renders the canonical 37-cell layouts, persists only disclosure choices and terminal failure evidence, and opens a selected child session.

**Architecture:** Implement four focused layers: a pure model in `tui/features/subagent.ts`, a direct-child snapshot loader in `tui/services/subagent-snapshot.ts`, a generation-aware event source in `tui/services/subagent-source.ts`, and a Solid adapter in `tui/subagent.tsx`. Reuse only the neutral `indexSessionsByParent` utility and shared presentation/runtime primitives; do not depend on an active SesTokens plugin or import SesTokens feature, source, state, or component code.

**Tech Stack:** TypeScript 6, SolidJS 1.9, OpenTUI Solid, OpenCode SDK v2/TUI API, Node test runner, esbuild/Babel test harness, JSON plugin manifest.

## Global Constraints

- Canonical behavior comes from `openspec/changes/add-subagent-panel/specs/subagent-panel/spec.md`; canonical cells and colors come from the SubAgent section of `AGENTS.md`.
- Maximum rendered width is 37 cells; preserve disclosures, bullets, right-edge durations, ellipsis, divider order, and no trailing whitespace at 37 and 36 cells.
- Show only direct children of the viewed session. Sort by `time.created` descending and then session ID ascending; primary is the newest five and Rest is every older child.
- Status precedence is retained `session.error` or assistant-message error, synchronized busy/retry, synchronized idle, completed error-free assistant fallback, then running.
- Running duration uses `now - created`; successful uses `updated - created`; failed uses the earliest retained or assistant-message failure time minus created. Clamp to a finite nonnegative integer and floor to whole seconds.
- Initial loading and unavailable states render no panel output. A complete empty snapshot renders muted `No subagents`. Exhausted background refreshes retain the complete body and add warning `stale` until recovery.
- Use a 200 ms event debounce, one shared four-request message limiter across overlapping generations, and retries after 2, 4, and 8 seconds. Publish complete snapshots only.
- Persist only parent-scoped outer collapse, Rest collapse, expanded child ID, and retained `session.error` timestamps. Do not persist complete entries.
- No polling. A one-second interval exists only while a running entry is visible, and every subscription, timer, queued request, and callback must stop at disposal.
- Use the built-in route exactly as `api.route.navigate("session", { sessionID: child.id })`.
- Keep OpenCode `>=1.18.1`; add no dependency and no compatibility path for older hosts.
- Final sidebar slots are Home 1, Context 100, SesTokens 110, SubAgent 120, Quota 130, MCP 140, LSP 150, and TODO 160. Token Report has no `slotOrder`.
- Preserve the accepted uncommitted `plugin-manifest.json` reorder and complete it rather than recreating it. Preserve the accepted README inspiration links and table formatting, then extend those sections in place.
- Do not edit `AGENTS.md`, OpenSpec artifacts, or Comet state during implementation. Its current full-file SHA-256 is `7b16e53db42f596cdb4e28bfc45631c5bba9982b5d4099cc1b3547dbd8174f7d`.
- Use strict TDD for Tasks 1-7: add the specified test first, run the exact RED command and confirm the stated failure, then edit production code and run the focused GREEN command.
- Stage exact paths in each suggested commit. In particular, do not stage the accepted `README.md` or `plugin-manifest.json` changes before Task 7.

## File Map

**Create**

- `tui/features/subagent.ts`: pure direct-child filtering, status/identity/duration derivation, grouping, counts, colored summary, and row allocation.
- `tui/services/subagent-snapshot.ts`: direct-child list/status/message reconstruction with shared bounded fan-out and complete-only results.
- `tui/services/subagent-source.ts`: viewed-parent state machine, event filtering, debounce, retries, stale retention, failure persistence/pruning, generation guards, and disposal.
- `tui/subagent.tsx`: standalone plugin activation, API adapters, parent-scoped disclosure state, nested Solid rows, conditional clock, and navigation.
- `tests/subagent-model.test.mjs`: pure model and allocation behavior.
- `tests/subagent-snapshot.test.mjs`: loader ordering, topology, concurrency, cancellation, and failure behavior.
- `tests/subagent-source.test.mjs`: source events, retries, stale/unavailable recovery, persistence, races, and cleanup.
- `tests/subagent-state-types.fixture.ts`: compile-only host API contract.
- `tests/subagent-mounted.fixture.ts`: deterministic Solid host, API, KV, event, route, and timer harness.
- `tests/subagent-mounted.test.mjs`: canonical layouts, no-output states, persistence, interactions, clock, and navigation.

**Modify**

- `shared/opencode-tools-shared.ts`: re-export all SubAgent model, loader, and source values/types consumed by the standalone adapter and tests.
- `tests/compile-presentation.mjs`: compile the three pure SubAgent modules and mounted fixture; remove temporary manifest descriptor injection once the real manifest is complete.
- `tests/shared-boundary.test.mjs`: enforce facade use and prohibit repository-source bypasses from `tui/subagent.tsx`.
- `opencode-plugin-tui.d.ts`: add only `api.state.session.status(sessionID): SessionStatus | undefined`; retain existing list/messages/events/route/KV/lifecycle declarations.
- `tui/runtime/manifest.ts`: add `"subagent"` to `PluginKey`.
- `plugin-manifest.json`: preserve the accepted reorder, add SubAgent 120, and shift Quota/MCP/LSP/TODO to 130/140/150/160.
- `package.json`: export `./subagent` from `./tui/subagent.tsx`.
- `tests/plugin-manifest.test.mjs`: assert all nine entries, the full order, exact slots, package exports, and Token Report's absent slot.
- `tests/plugin-adapters.test.mjs`: include the SubAgent standalone activation surface and host stubs.
- `tests/plugin-build.test.mjs`: assert ten generated artifacts including shared, nine feature results, SubAgent source isolation, shared import, activation, slot 120, and cleanup.
- `tests/plugin-deploy.test.mjs`: add SubAgent to managed specs, stale-source/artifact migration, plain-entry assertions, idempotence, and artifact safety.
- `tests/plugin-wiring.test.mjs`: assert package/config/runtime documentation, complete manifest order, SubAgent source ownership, AGENTS-derived layouts, rollback, and nine-plugin wording.
- `README.md`: preserve the current inspiration/table diff and add SubAgent features, configuration, layouts, artifact/source entries, build/deploy count, and rollback.

---

### Task 1: Pure SubAgent Model

**OpenSpec mapping:** 1.1, 1.2; type-only boundary prerequisite of 2.2; shared-contract slice of 4.1.

**Files:**
- Create: `tests/subagent-model.test.mjs`
- Create: `tui/features/subagent.ts`
- Create: `tui/services/subagent-snapshot.ts` (neutral snapshot types only; Task 2 adds loader behavior)
- Modify: `tests/compile-presentation.mjs:51-102`
- Modify: `shared/opencode-tools-shared.ts:14-59`
- Modify: `tests/shared-boundary.test.mjs:151-200`

**Interfaces:**
- Consumes: `PanelTextSegment` from `tui/presentation/types.ts`.
- Produces the neutral `SubagentSnapshot` / `SubagentChildSnapshot` records below in `tui/services/subagent-snapshot.ts`, plus the pure model API:

```ts
export type SubagentChildSnapshot = {
  session: Pick<Session, "id" | "parentID" | "title" | "time">
  status: SessionStatus | undefined
  messages: readonly Message[]
}

export type SubagentSnapshot = {
  parentID: string
  childIDs: readonly string[]
  children: readonly SubagentChildSnapshot[]
}

export type SubagentStatus = "successful" | "running" | "failed"

export type SubagentEntry = {
  id: string
  title: string
  agent: string
  model: string
  status: SubagentStatus
  durationMs: number
  duration: string
}

export type SubagentPanelModel = {
  primary: readonly SubagentEntry[]
  rest: readonly SubagentEntry[]
  successful: number
  running: number
  failed: number
  summary: readonly PanelTextSegment[]
}

export type SubagentEntryRowAllocation = {
  disclosure: number
  bullet: number
  title: number
  beforeDurationGap: number
  duration: number
}

export function allocateSubagentEntryRow(
  availableCells: number,
  durationCells: number,
): SubagentEntryRowAllocation

export function createSubagentPanelModel(
  snapshot: SubagentSnapshot,
  failureTimes: Readonly<Record<string, number>>,
  now: number,
): SubagentPanelModel
```

- `SubagentSnapshot` is imported with `import type` from `../services/subagent-snapshot.js`; this is a type-only dependency and does not couple the model to source state.

- [ ] **Step 1: Add the failing model and facade tests**

Add `subagent-model` to the cleanup/build table in `tests/compile-presentation.mjs`, targeting `tui/features/subagent.ts`. Create table-driven tests with these exact behavior groups:

```js
test("filters non-direct children and sorts equal creation times by ID", () => {})
test("splits the newest five from Rest and counts every direct child", () => {})
test("applies failure busy retry idle completion and running precedence", () => {})
test("removing an assistant error removes non-retained failure evidence", () => {})
test("uses only the newest assistant then newest user identity fields", () => {})
test("uses the earliest retained or message failure time", () => {})
test("clamps invalid timestamps and formats duration boundaries", () => {})
test("colors successful running failed counts and muted separators", () => {})
test("reserves disclosures bullets and durations at 37 and 36 cells", () => {})
```

Use snapshots containing a direct child, grandchild, reparented child, equal-time IDs, busy/retry/idle/undefined statuses, completed/in-progress/error assistants, and user/assistant identities. Assert duration outputs at `0`, `59_000`, `60_000`, `3_599_000`, and `3_600_000` ms as `0s`, `59s`, `1m 0s`, `59m 59s`, and `1h 0m`. Assert summary segments exactly:

```js
[
  { text: "7", status: "success" },
  { text: "/", status: "textMuted" },
  { text: "1", status: "warning" },
  { text: "/", status: "textMuted" },
  { text: "3", status: "error" },
]
```

Extend `tests/shared-boundary.test.mjs` to require named re-exports for `createSubagentPanelModel` and `allocateSubagentEntryRow` from `../tui/features/subagent.js`.

- [ ] **Step 2: Run the RED command**

Run: `node tests/compile-presentation.mjs && node --test tests/subagent-model.test.mjs tests/shared-boundary.test.mjs`

Expected RED: esbuild reports that `tui/features/subagent.ts` cannot be resolved, or the facade assertions report the missing named SubAgent exports. Do not add production files before observing this failure.

- [ ] **Step 3: Implement the minimal pure model**

First create `tui/services/subagent-snapshot.ts` with only the two neutral record types shown under **Interfaces**. This keeps Task 1 type-correct without pre-implementing Task 2's loader. Then implement `createSubagentPanelModel` with this exact pipeline:

```ts
const direct = snapshot.children
  .filter(({ session }) => session.parentID === snapshot.parentID)
  .toSorted((left, right) =>
    right.session.time.created - left.session.time.created
      || left.session.id.localeCompare(right.session.id))
```

For each child, select the newest assistant and newest user independently, resolve `agent` and `modelID` field-by-field without scanning an older message when the selected newest message lacks that field, then apply the documented status precedence. Select the earliest finite assistant error time from `time.completed ?? time.created` and the retained timestamp; clamp every duration with `Math.max(0, Math.floor(finiteValue))`. Format floored whole seconds and return `direct.slice(0, 5)` / `direct.slice(5)`.

Implement `allocateSubagentEntryRow` by normalizing both inputs to finite nonnegative integers, reserving up to two disclosure cells, two bullet cells, the full duration at the right edge when it fits, and a one-cell gap only when both title/prefix content and duration exist. Never return allocations whose sum exceeds `availableCells`.

Export all model values and types through `shared/opencode-tools-shared.ts`.

- [ ] **Step 4: Run focused GREEN verification**

Run: `node tests/compile-presentation.mjs && node --test tests/subagent-model.test.mjs tests/shared-boundary.test.mjs`

Expected GREEN: all SubAgent model/allocation tests pass; shared facade tests find the named exports and still reject JSX/plugin registration in the shared artifact.

- [ ] **Step 5: Commit the task atomically**

Suggested Conventional Commit: `feat(subagent): add pure panel model`

Stage only:

```bash
git add tests/subagent-model.test.mjs tests/compile-presentation.mjs \
  tests/shared-boundary.test.mjs tui/features/subagent.ts \
  tui/services/subagent-snapshot.ts shared/opencode-tools-shared.ts
git commit -m "feat(subagent): add pure panel model"
```

### Task 2: Direct-Child Snapshot Loader

**OpenSpec mapping:** snapshot-loader portion of 2.1 and 2.2.

**Files:**
- Create: `tests/subagent-snapshot.test.mjs`
- Modify: `tui/services/subagent-snapshot.ts`
- Modify: `tests/compile-presentation.mjs`
- Modify: `shared/opencode-tools-shared.ts`

**Interfaces:**
- Consumes: `indexSessionsByParent(sessions)` from `tui/services/session-tree-snapshot.ts`; SDK `Session`, `SessionStatus`, and `Message` types.
- Produces:

```ts
export type SubagentSnapshotLoadContext = {
  signal: AbortSignal
  onChildIDs(childIDs: readonly string[]): void
}

export type SubagentSnapshotLoader = (
  parentID: string,
  context: SubagentSnapshotLoadContext,
) => Promise<SubagentSnapshot>

export type CreateSubagentSnapshotLoaderOptions = {
  listSessions(): Promise<readonly Pick<Session, "id" | "parentID" | "title" | "time">[]>
  sessionStatus(sessionID: string): SessionStatus | undefined
  listMessages(sessionID: string): Promise<readonly Message[]>
  concurrency?: number
}

export function createSubagentSnapshotLoader(
  options: CreateSubagentSnapshotLoaderOptions,
): SubagentSnapshotLoader
```

- [ ] **Step 1: Add failing snapshot tests**

Add the snapshot module to `tests/compile-presentation.mjs`. Cover these exact cases:

```js
test("returns a complete empty snapshot without message calls", async () => {})
test("requests only sorted direct children and never requests grandchildren", async () => {})
test("publishes discovered child IDs before status or message fan-out", async () => {})
test("keeps sorted output when child requests finish in reverse", async () => {})
test("shares four message slots across overlapping generations", async () => {})
test("aborted queued work rejects without starting an SDK call", async () => {})
test("one failure stops new claims and waits for active requests", async () => {})
test("list status or message failure rejects without a partial snapshot", async () => {})
```

Use deferred promises and an `active`/`maximum` counter as in `tests/session-tree-snapshot.test.mjs`. Assert that `onChildIDs` receives IDs sorted by creation descending then ID ascending before the first `sessionStatus` or `listMessages` call, that maximum active message calls is four across two overlapping loader calls, and that no grandchild ID appears in message calls.

- [ ] **Step 2: Run the RED command**

Run: `node tests/compile-presentation.mjs && node --test tests/subagent-snapshot.test.mjs`

Expected RED: esbuild reports that `createSubagentSnapshotLoader` is not exported by the type-only `tui/services/subagent-snapshot.ts` boundary created in Task 1.

- [ ] **Step 3: Implement the bounded loader**

Create one limiter inside `createSubagentSnapshotLoader`, outside the returned function, so overlapping generations share its four slots. Follow this order on every call:

```ts
const sessions = await options.listSessions()
const children = [...(indexSessionsByParent(sessions).get(parentID) ?? [])]
  .sort((left, right) => right.time.created - left.time.created || left.id.localeCompare(right.id))
const childIDs = children.map(({ id }) => id)
context.onChildIDs(childIDs)
```

Then run at most four workers. A worker reads `sessionStatus(child.id)` and awaits the limited `listMessages(child.id)`. Store each result at the child's sorted index. On first failure, abort the attempt controller, prevent workers from claiming another index, await `Promise.allSettled(workers)`, and throw the first failure. Parent abort removes queued work immediately, while already-started calls retain limiter slots until settlement. Return only `{ parentID, childIDs, children: completedResults }` after every child succeeded.

Re-export loader values/types through the shared facade. Do not export or reuse SesTokens source/model state.

- [ ] **Step 4: Run focused GREEN verification**

Run: `node tests/compile-presentation.mjs && node --test tests/subagent-snapshot.test.mjs tests/session-tree-snapshot.test.mjs`

Expected GREEN: SubAgent direct-only tests pass and the existing neutral parent-index/SesTokens tree loader tests remain unchanged.

- [ ] **Step 5: Commit the task atomically**

Suggested Conventional Commit: `feat(subagent): load direct child snapshots`

```bash
git add tests/subagent-snapshot.test.mjs tests/compile-presentation.mjs \
  tui/services/subagent-snapshot.ts shared/opencode-tools-shared.ts
git commit -m "feat(subagent): load direct child snapshots"
```

### Task 3: Event-Driven SubAgent Source

**OpenSpec mapping:** source/coordinator portion of 2.1 and 2.2.

**Files:**
- Create: `tests/subagent-source.test.mjs`
- Create: `tui/services/subagent-source.ts`
- Modify: `tests/compile-presentation.mjs`
- Modify: `shared/opencode-tools-shared.ts`

**Interfaces:**
- Consumes: `SubagentSnapshotLoader`, `SubagentSnapshot`, and SDK event variants.
- Produces:

```ts
export type RetainedFailures = Record<string, Record<string, number>>

export type SubagentSourceState =
  | { phase: "loading"; parentID: string }
  | { phase: "unavailable"; parentID: string }
  | { phase: "ready"; parentID: string; snapshot: SubagentSnapshot; failureTimes: Readonly<Record<string, number>> }
  | { phase: "stale"; parentID: string; snapshot: SubagentSnapshot; failureTimes: Readonly<Record<string, number>> }

export type SubagentSourceDependencies = {
  loadSnapshot: SubagentSnapshotLoader
  onEvent: SubagentEventRegistrar
  loadFailures(): RetainedFailures
  saveFailures(value: RetainedFailures): void
  now(): number
  setTimer(callback: () => void, delayMs: number): unknown
  clearTimer(timer: unknown): void
}

export type SubagentSource = {
  state(): SubagentSourceState | undefined
  subscribe(listener: () => void): () => void
  setParentID(parentID: string): void
  dispose(): void
}

export function createSubagentSource(dependencies: SubagentSourceDependencies): SubagentSource
```

- [ ] **Step 1: Add failing source state-machine tests**

Use injected deferred loaders, event registrar, scheduler, clock, and in-memory failure store. Cover:

```js
test("loads a non-empty parent immediately and leaves an empty parent silent", async () => {})
test("invalidates immediately then coalesces relevant events for 200 ms", async () => {})
test("newly discovered child events supersede the initial generation", async () => {})
test("filters every relevant and irrelevant session and message event", async () => {})
test("records the first known session error immediately and only once", async () => {})
test("rejects obsolete topology failure writes and publications", async () => {})
test("retries after 2 4 and 8 seconds then becomes unavailable", async () => {})
test("recovers unavailable state after a later relevant event", async () => {})
test("retains ready data as stale and recovers with a complete snapshot", async () => {})
test("switches slot and select parents without leaking the old body", async () => {})
test("prunes deleted reparented and absent retained failures", async () => {})
test("isolates throwing subscribers and disposes every resource once", async () => {})
```

Assert all nine event registrations: `session.created`, `session.updated`, `session.deleted`, `session.status`, `session.idle`, `session.error`, `message.updated`, `message.removed`, and `tui.session.select`. Assert immediate controller abortion before the 200 ms timer fires, exact retry delays `[2000, 4000, 8000]`, and no state/store mutation from old generations or post-disposal callbacks.

- [ ] **Step 2: Run the RED command**

Run: `node tests/compile-presentation.mjs && node --test tests/subagent-source.test.mjs`

Expected RED: esbuild cannot resolve `tui/services/subagent-source.ts`.

- [ ] **Step 3: Implement generation, retry, failure, and cleanup logic**

Implement one generation counter, one active `AbortController`, one debounce timer, a retry timer set, a known-direct-child ID set, and subscriber/unsubscriber sets. On parent change: abort, increment, clear timers/IDs, publish loading for non-empty IDs, and start immediately. Empty IDs clear state and issue no load.

For each relevant event, abort and invalidate the active generation immediately, retain any existing ready/stale body, and schedule exactly one replacement generation 200 ms after the latest event. `session.created` is relevant when `info.parentID === parentID`; update/delete/status/idle/error/message events are relevant only for known direct IDs, with update also relevant when its new `info.parentID === parentID`. A non-empty `tui.session.select` calls `setParentID`.

On the first known `session.error`, persist `now()` under `[parentID][childID]`, preserve an existing first timestamp, replace ready/stale `failureTimes` with a copied immutable record, notify immediately, then schedule reconstruction. Ignore missing/unknown IDs. Generation-check topology callbacks, retained writes, retries, and publications.

After a complete snapshot, replace known IDs, prune retained records not present in `snapshot.childIDs`, persist only when the record changed, and publish ready with a copied parent failure map. After four failed attempts, publish unavailable without prior complete data or stale with the prior complete snapshot. Disposal aborts, clears all timers, invokes all nine unsubscribers once, clears listeners, and prevents later state or KV writes.

- [ ] **Step 4: Run focused GREEN verification**

Run: `node tests/compile-presentation.mjs && node --test tests/subagent-source.test.mjs tests/subagent-snapshot.test.mjs`

Expected GREEN: every event/race/retry/persistence test passes with no partial publication and all loader tests remain green.

- [ ] **Step 5: Commit the task atomically**

Suggested Conventional Commit: `feat(subagent): coordinate child session refreshes`

```bash
git add tests/subagent-source.test.mjs tests/compile-presentation.mjs \
  tui/services/subagent-source.ts shared/opencode-tools-shared.ts
git commit -m "feat(subagent): coordinate child session refreshes"
```

### Task 4: Local OpenCode TUI Contract

**OpenSpec mapping:** 2.3.

**Files:**
- Create: `tests/subagent-state-types.fixture.ts`
- Modify: `opencode-plugin-tui.d.ts:1-7,106-121`

**Interfaces:**
- Consumes: installed SDK types `Session`, `SessionStatus`, `Message`, and event unions.
- Produces: `TuiPluginApi["state"]["session"]["status"]` with exact signature `(sessionID: string) => SessionStatus | undefined`. Existing list/messages envelopes remain `Promise<{ data?: Data; error?: unknown }>`.

- [ ] **Step 1: Add the failing compile fixture**

Create `inspectSubagentApi(api, sessionID)` that type-checks:

```ts
const directory: string = api.state.path.directory
const status: SessionStatus | undefined = api.state.session.status(sessionID)
const sessions: readonly Session[] | undefined = (await api.client.session.list({ directory })).data
const messages: readonly { info: Message }[] | undefined = (
  await api.client.session.messages({ sessionID, directory })
).data
api.route.navigate("session", { sessionID })
api.kv.set("subagent-test", api.kv.get<Record<string, number>>("subagent-test", {}))
api.lifecycle.onDispose(() => undefined)
```

Register handlers for all nine SubAgent event types and access the exact relevant properties (`info.parentID`, `info.id`, `sessionID`, `status`, and optional error session ID). Reuse the exact optional `{ session_id?: string }` sidebar prop equality check from `tests/ses-tokens-state-types.fixture.ts`.

- [ ] **Step 2: Run the RED command**

Run: `npm run typecheck`

Expected RED: TypeScript reports that `status` does not exist on `api.state.session`; no production declaration has been changed yet.

- [ ] **Step 3: Add only the missing host declaration**

Import `SessionStatus` from `@opencode-ai/sdk/v2` in `opencode-plugin-tui.d.ts` and add:

```ts
status(sessionID: string): SessionStatus | undefined
```

Do not widen slot props, event payloads, route params, client envelopes, KV values, or lifecycle types to `any`.

- [ ] **Step 4: Run focused GREEN verification**

Run: `npm run typecheck`

Expected GREEN: all local fixtures compile under strict/no-unused settings, including the new status/event/route contract.

- [ ] **Step 5: Commit the task atomically**

Suggested Conventional Commit: `feat(subagent): declare host session APIs`

```bash
git add tests/subagent-state-types.fixture.ts opencode-plugin-tui.d.ts
git commit -m "feat(subagent): declare host session APIs"
```

### Task 5: Canonical Panel Layouts and Adapter

**OpenSpec mapping:** 3.1; rendering/adapter portion of 3.3; client-envelope subset of 2.1; `PluginKey` prerequisite from 4.2.

**Files:**
- Create: `tests/subagent-mounted.fixture.ts`
- Create: `tests/subagent-mounted.test.mjs`
- Create: `tui/subagent.tsx`
- Modify: `tests/compile-presentation.mjs`
- Modify: `tests/shared-boundary.test.mjs`
- Modify: `tui/runtime/manifest.ts:3`

**Interfaces:**
- Consumes: all Task 1-3 exports through `../shared/opencode-tools-shared.js`; `CompactPanel`; TUI APIs compiled in Task 4.
- Produces: default `defineTuiPlugin(pluginDescriptor("subagent"), activate)` module, sidebar slot 120, and test-only `subagentRuntimeTestKey` symbol for injected source factory/clock primitives.

- [ ] **Step 1: Add failing mounted layout tests and harness**

Use the real Solid host fixture pattern from `tests/ses-tokens-mounted.fixture.ts`, not padded strings in production. Add a temporary test manifest loader that appends this descriptor until Task 7 installs the real entry:

```js
{
  key: "subagent",
  id: "aamkye/opencode-tools-subagent",
  source: "tui/subagent.tsx",
  outfile: "opencode-tools-subagent.js",
  slotOrder: 120,
  options: "none",
}
```

The mounted fixture must expose rendered text/cells, colors, dividers, click handlers, KV reads/writes, list/message/status calls, route calls, events, timers, source counts, and lifecycle cleanup. Add exact tests for:

```js
test("registers the SubAgent ID and session-scoped slot 120", async () => {})
test("renders no element for empty loading and unavailable parents", async () => {})
test("renders muted No subagents for a complete empty snapshot", async () => {})
test("matches every expanded AGENTS layout and exact row order", async () => {})
test("matches one-detail and expanded-Rest AGENTS layouts", async () => {})
test("matches semi-collapsed Rest and collapsed count layouts", async () => {})
test("retains the body and warning detail in stale layouts", async () => {})
test("colors bullets and status values by semantic status", async () => {})
test("truncates only titles at 37 and 36 cells without trailing whitespace", async () => {})
test("rejects defined falsy list and message envelope errors", async () => {})
```

Derive expected SubAgent text lines from the seven fenced AGENTS layouts rather than duplicating a silently divergent contract. Initial loading and unavailable assertions must check that no `SubAgent` title or panel node exists.

- [ ] **Step 2: Run the RED command**

Run: `node tests/compile-presentation.mjs && node --test tests/subagent-mounted.test.mjs tests/shared-boundary.test.mjs`

Expected RED: esbuild cannot resolve `tui/subagent.tsx`, or the shared boundary reports the missing standalone adapter.

- [ ] **Step 3: Implement the adapter and static/nested rendering**

Add `"subagent"` to `PluginKey`. In `tui/subagent.tsx`, capture `api.state.path.directory`, construct one snapshot loader, and unwrap both client methods with the strict rule:

```ts
if (result.error !== undefined || !result.data) {
  throw result.error ?? new Error("session data unavailable")
}
```

Map message records to `record.info`, read `api.state.session.status(sessionID)`, create one source per activation, subscribe it to a Solid signal, and register `source.dispose` through `defineTuiPlugin` cleanup. The slot drives `source.setParentID(props.session_id ?? "")` through `createEffect` and returns no element unless state is ready/stale for the current non-empty parent.

Render the outer shell with:

```tsx
<CompactPanel
  title="SubAgent"
  collapsed={collapsed()}
  detail={state().phase === "stale" ? { text: "stale", status: "warning" } : undefined}
  summary={collapsed() ? { text: summaryText, segments: model().summary } : undefined}
  onToggle={togglePanel}
  footerDivider={!collapsed()}
  theme={() => api.theme.current}
>
```

Use full-width flex rows for `▶ • ` / `▼ • `, title, optional one-cell gap, and fixed duration. Expanded rows omit duration and render `agent`, `status`, `time`, `model`, `Open Session` in that order with two-cell indentation. Render an internal divider and `▼ Rest`/`▶ Rest` only when `model.rest.length > 0`. For this task, local reactive disclosure state is sufficient; Task 6 makes it parent-scoped and persistent.

- [ ] **Step 4: Run focused GREEN verification**

Run: `node tests/compile-presentation.mjs && node --test tests/subagent-mounted.test.mjs tests/compact-panel-mounted.test.mjs tests/shared-boundary.test.mjs`

Expected GREEN: canonical layouts, colors, strict envelopes, and no-output states pass; existing CompactPanel detail/summary spacing remains green.

- [ ] **Step 5: Commit the task atomically**

Suggested Conventional Commit: `feat(subagent): render sidebar panel`

```bash
git add tests/subagent-mounted.fixture.ts tests/subagent-mounted.test.mjs \
  tests/compile-presentation.mjs tests/shared-boundary.test.mjs \
  tui/subagent.tsx tui/runtime/manifest.ts
git commit -m "feat(subagent): render sidebar panel"
```

### Task 6: Disclosure Persistence, Clock, and Navigation

**OpenSpec mapping:** 3.2; interaction/clock portion of 3.3.

**Files:**
- Modify: `tests/subagent-mounted.fixture.ts`
- Modify: `tests/subagent-mounted.test.mjs`
- Modify: `tui/subagent.tsx`

**Interfaces:**
- Consumes: `subagentRuntimeTestKey` from Task 5 to inject `now`, `setInterval`, and `clearInterval` without changing production behavior.
- Produces parent-keyed KV records at:

```text
aamkye.opencode-tools-subagent.panel-collapsed
aamkye.opencode-tools-subagent.rest-collapsed
aamkye.opencode-tools-subagent.expanded-child
```

- [ ] **Step 1: Add failing interaction/lifecycle tests**

Add exact tests for:

```js
test("persists panel and Rest collapse independently per parent", async () => {})
test("restores one expanded child and replaces it when another opens", async () => {})
test("clears a persisted child absent from a complete snapshot", async () => {})
test("keeps a selected Rest child hidden while Rest is collapsed", async () => {})
test("Open Session navigates to the selected child route", async () => {})
test("starts one clock only for visible running primary entries", async () => {})
test("Rest visibility controls its running clock and refreshes immediately", async () => {})
test("collapse parent switch completion and disposal stop the clock", async () => {})
```

Assert exact KV map writes such as:

```js
[
  "aamkye.opencode-tools-subagent.panel-collapsed",
  { "parent-a": true },
]
```

Assert navigation exactly equals `[["session", { sessionID: "child-9" }]]`. Assert no interval for successful/failed-only views, collapsed outer panels, or running children hidden under collapsed Rest; exactly one `1000` ms interval when visible; and one clear when visibility or lifecycle changes.

- [ ] **Step 2: Run the RED command**

Run: `node tests/compile-presentation.mjs && node --test tests/subagent-mounted.test.mjs`

Expected RED: parent-scoped remount expectations find missing KV maps, route calls remain empty, invalid expanded IDs remain stored, and interval start/stop counts remain zero.

- [ ] **Step 3: Implement parent-scoped persistence and conditional effects**

Read each KV key once as a map. Derive values by current parent with defaults: outer expanded (`false` collapsed), Rest expanded (`false` collapsed), and no expanded ID. On click, clone only the relevant map, update the current parent key, update the signal, and persist the whole map. Clicking an expanded child removes that parent's ID; clicking another replaces it.

After every ready/stale complete snapshot, clear and persist an expanded child ID absent from `snapshot.childIDs`. Do not clear a valid Rest child merely because Rest is collapsed. Wire `Open Session` directly to the route call.

Keep one `now` signal. The clock predicate is true only when state is ready/stale, outer is expanded, and either a primary running child is visible or Rest is expanded with a running Rest child. On a false-to-true transition, set `now` from the injected/current clock before starting one 1000 ms interval. Clear the interval when the predicate becomes false, the parent changes, or component/plugin disposal runs.

- [ ] **Step 4: Run focused GREEN verification**

Run: `node tests/compile-presentation.mjs && node --test tests/subagent-mounted.test.mjs tests/subagent-source.test.mjs`

Expected GREEN: all parent scoping, one-entry expansion, cleanup, navigation, and visible-running clock tests pass without changing source retry behavior.

- [ ] **Step 5: Commit the task atomically**

Suggested Conventional Commit: `feat(subagent): persist panel interactions`

```bash
git add tests/subagent-mounted.fixture.ts tests/subagent-mounted.test.mjs tui/subagent.tsx
git commit -m "feat(subagent): persist panel interactions"
```

### Task 7: Standalone Plugin Integration and Documentation

**OpenSpec mapping:** remaining 4.1 and 4.2.

**Files:**
- Modify: `plugin-manifest.json`
- Modify: `package.json`
- Modify: `tests/plugin-manifest.test.mjs`
- Modify: `tests/plugin-adapters.test.mjs`
- Modify: `tests/plugin-build.test.mjs`
- Modify: `tests/plugin-deploy.test.mjs`
- Modify: `tests/plugin-wiring.test.mjs`
- Modify: `tests/compile-presentation.mjs`
- Modify: `tests/shared-boundary.test.mjs`
- Modify: `README.md`

**Interfaces:**
- Consumes: `pluginDescriptor("subagent")`, manifest-driven build/deploy loops, and the standalone module from Tasks 5-6.
- Produces package export `"./subagent": "./tui/subagent.tsx"`, runtime ID `aamkye/opencode-tools-subagent`, output `opencode-tools-subagent.js`, slot 120, and this exact manifest sequence:

```text
home(1), token-report(no slot), context(100), ses-tokens(110),
subagent(120), quota(130), mcp(140), lsp(150), todo(160)
```

- [ ] **Step 1: Add failing exact integration expectations**

Update tests before production integration:

- `tests/plugin-manifest.test.mjs`: expect all nine exact records and package exports; separately assert sidebar tuples equal `[["home",1],["context",100],["ses-tokens",110],["subagent",120],["quota",130],["mcp",140],["lsp",150],["todo",160]]` and `token-report.slotOrder === undefined`.
- `tests/plugin-adapters.test.mjs`: compile/activate SubAgent, provide path/list/messages/status stubs, and assert only `sidebar_content`, order 120, no keymaps/routes registered, and lifecycle cleanup.
- `tests/plugin-build.test.mjs`: expect ten artifacts, nine feature results, `subagent` activation, source isolation, shared external import, and shared metafile inputs for all three SubAgent modules.
- `tests/plugin-deploy.test.mjs`: add the managed artifact/source to every local/global/project-fallback fixture; assert plain SubAgent entries, exact manifest order, idempotence, unrelated-entry preservation, and only quota options on quota.
- `tests/plugin-wiring.test.mjs`: expect nine standalone plugins, the complete configuration order, SubAgent runtime/source/artifact/rollback prose, and README SubAgent layouts derived from the unchanged AGENTS section.
- `tests/shared-boundary.test.mjs`: require `tui/subagent.tsx` to named-import/call `createSubagentPanelModel` from the facade and allow no relative imports except `../shared/opencode-tools-shared.js`.

- [ ] **Step 2: Run the RED command**

Run: `node tests/compile-presentation.mjs && node --test tests/plugin-manifest.test.mjs tests/plugin-adapters.test.mjs tests/plugin-build.test.mjs tests/plugin-deploy.test.mjs tests/plugin-wiring.test.mjs tests/shared-boundary.test.mjs`

Expected RED: the accepted partial manifest lacks SubAgent and still uses Quota/MCP/LSP/TODO 120/130/140/150; package export, generated artifact count, deployment entry, and README SubAgent assertions are missing.

- [ ] **Step 3: Complete manifest, package, harness, and deployment wiring**

Preserve the current user-authored `plugin-manifest.json` diff. Insert:

```json
{
  "key": "subagent",
  "id": "aamkye/opencode-tools-subagent",
  "source": "tui/subagent.tsx",
  "outfile": "opencode-tools-subagent.js",
  "slotOrder": 120,
  "options": "none"
}
```

between SesTokens and Quota, then change Quota/MCP/LSP/TODO to 130/140/150/160. Keep Token Report in the manifest without `slotOrder`. Add the package export in matching logical order.

Remove the temporary SesTokens/SubAgent descriptor injection from `tests/compile-presentation.mjs`; both descriptors must now resolve from the real manifest. Add the SubAgent adapter fixture to the normal compile list. Build/deploy production scripts remain manifest-driven and should need no feature-specific branch.

- [ ] **Step 4: Extend README without overwriting accepted edits**

Retain lines 3-8 inspiration links and the currently aligned artifact/source tables. Add:

- Direct-child monitoring, status precedence, newest-five/Rest grouping, duration, persistence, stale/no-output behavior, and Open Session under `### SubAgent`.
- `./opencode-tools-subagent.js` in the documented plugin array in manifest order; state that SubAgent accepts no options and has no built-in override.
- AGENTS-derived expanded, one-detail, Rest, semi-collapsed, collapsed, stale-expanded, stale-collapsed, and empty layout documentation with no trailing whitespace.
- Nine-plugin build/deploy wording and managed manifest-order migration wording.
- SubAgent artifact/runtime row and source rows for component, feature, snapshot, and source.
- A rollback sentence that removes only `./opencode-tools-subagent.js` and restarts OpenCode.

Do not edit `AGENTS.md`; make documentation tests extract its existing SubAgent fenced layouts as the acceptance source.

- [ ] **Step 5: Run focused GREEN verification**

Run: `node tests/compile-presentation.mjs && node --test tests/plugin-manifest.test.mjs tests/plugin-adapters.test.mjs tests/plugin-build.test.mjs tests/plugin-deploy.test.mjs tests/plugin-wiring.test.mjs tests/shared-boundary.test.mjs`

Expected GREEN: exact manifest/package/runtime/build/deploy/docs assertions pass; SubAgent builds and activates alone, imports the managed shared artifact, and deployment preserves unrelated entries and quota options.

- [ ] **Step 6: Review the two accepted files before staging**

Run: `git diff 5a0b6c3 -- README.md plugin-manifest.json`

Expected evidence: README still contains all four inspiration links and aligned tables plus SubAgent additions; manifest retains Home 1 and Context/SesTokens ordering, adds SubAgent 120, shifts later panels by ten, and leaves Token Report non-sidebar.

- [ ] **Step 7: Commit the integration atomically**

Suggested Conventional Commit: `feat(subagent): wire standalone plugin`

```bash
git add plugin-manifest.json package.json README.md \
  tests/plugin-manifest.test.mjs tests/plugin-adapters.test.mjs \
  tests/plugin-build.test.mjs tests/plugin-deploy.test.mjs \
  tests/plugin-wiring.test.mjs tests/compile-presentation.mjs \
  tests/shared-boundary.test.mjs
git commit -m "feat(subagent): wire standalone plugin"
```

### Task 8: Final Verification and Artifact Safety

**OpenSpec mapping:** 5.1.

**Files:**
- Verify only; do not edit generated `dist/`, `.tmp-test/`, `.opencode/`, OpenSpec, Comet, or AGENTS files.

**Interfaces:**
- Consumes every deliverable from Tasks 1-7.
- Produces command output demonstrating behavior, typing, full regression safety, standalone build shape, unchanged AGENTS contract, and ignored generated artifacts.

- [ ] **Step 1: Run all focused SubAgent suites**

Run:

```bash
node tests/compile-presentation.mjs && node --test \
  tests/subagent-model.test.mjs \
  tests/subagent-snapshot.test.mjs \
  tests/subagent-source.test.mjs \
  tests/subagent-mounted.test.mjs \
  tests/plugin-manifest.test.mjs \
  tests/plugin-build.test.mjs \
  tests/plugin-deploy.test.mjs \
  tests/plugin-wiring.test.mjs \
  tests/shared-boundary.test.mjs
```

Expected evidence: every focused test passes with zero failures/skips caused by missing artifacts.

- [ ] **Step 2: Run strict type verification**

Run: `npm run typecheck`

Expected evidence: `tsc --noEmit` exits 0, including `tests/subagent-state-types.fixture.ts`.

- [ ] **Step 3: Run the full regression suite**

Run: `npm test`

Expected evidence: compile harnesses and every `tests/*.test.mjs` suite exit 0; existing SesTokens, CompactPanel, MCP, Context, LSP, TODO, quota, provider, token-report, and runtime tests remain green.

- [ ] **Step 4: Build every standalone artifact**

Run: `npm run build`

Expected evidence: `dist/opencode-tools-shared.js` and all nine manifest plugin artifacts are non-empty minified ESM files, including `dist/opencode-tools-subagent.js`.

- [ ] **Step 5: Assert the SubAgent bundle import contract directly**

Run:

```bash
node --input-type=module -e "import { readFile } from 'node:fs/promises'; const source = await readFile('dist/opencode-tools-subagent.js', 'utf8'); if (!/from['\"]\.\/opencode-tools-shared\.js['\"]/.test(source)) throw new Error('missing managed shared import'); if (/(?:\.\.\/|\/)(?:tui|shared)\//.test(source)) throw new Error('bundle references repository source')"
```

Expected evidence: command exits 0; the feature imports `./opencode-tools-shared.js` and contains no repository `tui/` or `shared/` source path.

- [ ] **Step 6: Verify the canonical AGENTS contract is untouched**

Run:

```bash
test "$(shasum -a 256 AGENTS.md | cut -d ' ' -f1)" = "7b16e53db42f596cdb4e28bfc45631c5bba9982b5d4099cc1b3547dbd8174f7d"
git diff --exit-code 5a0b6c3 -- AGENTS.md
```

Expected evidence: both commands exit 0. `tests/subagent-mounted.test.mjs` and `tests/plugin-wiring.test.mjs` have already proven the implementation/README against the unchanged SubAgent fenced layouts.

- [ ] **Step 7: Verify generated artifact safety and final tracked scope**

Run:

```bash
git check-ignore -v dist/opencode-tools-subagent.js \
  .tmp-test/subagent-model.mjs .tmp-test/subagent-mounted.mjs \
  .opencode/opencode-tools-subagent.js
test -z "$(git ls-files dist .tmp-test .opencode)"
git status --short --untracked-files=all
```

Expected evidence: generated build/test/deploy artifacts are ignored and none are tracked. Status contains only intentional implementation/plan state; no OpenSpec, Comet, AGENTS, secret, or generated artifact appears unexpectedly.

- [ ] **Step 8: Record acceptance evidence without another code commit**

Capture the focused test count, typecheck/full-suite/build exit codes, direct bundle assertion, AGENTS hash check, and generated-artifact check in the Comet verification handoff. Task 8 has no commit suggestion because it changes no source; do not create an empty verification commit.

## OpenSpec Coverage Matrix

| OpenSpec item | Plan task(s) | Acceptance evidence |
| --- | --- | --- |
| 1.1 model tests | Task 1 | `tests/subagent-model.test.mjs` RED then GREEN |
| 1.2 model/shared export | Task 1 | model suite and shared facade assertions |
| 2.1 data-source tests | Tasks 2, 3, 5 | snapshot, source, and mounted strict-envelope suites |
| 2.2 loader/coordinator | Tasks 2, 3 | direct-child loader and source suites |
| 2.3 local declarations | Task 4 | `npm run typecheck` fixture contract |
| 3.1 mounted layouts | Task 5 | AGENTS-derived mounted snapshots/cell assertions |
| 3.2 interactions | Task 6 | persistence, expansion, clock, cleanup, and route tests |
| 3.3 Solid panel | Tasks 5, 6 | complete mounted suite |
| 4.1 integration tests | Tasks 1, 7 | facade plus manifest/build/deploy/wiring tests |
| 4.2 integration/docs | Tasks 5, 7 | runtime key, exact manifest/package order, standalone build/deploy, README |
| 5.1 final verification | Task 8 | focused, typecheck, full suite, build, bundle, AGENTS, artifact gates |

## Planning Concern

The only non-blocking execution concern is worktree attribution: `README.md` and `plugin-manifest.json` already contain accepted user changes for this Comet change, while this plan is intentionally uncommitted. Exact-path staging is therefore mandatory so Tasks 1-6 do not absorb or overwrite those files; Task 7 is the sole integration commit that completes and stages them. No design ambiguity or missing OpenSpec requirement remains.
