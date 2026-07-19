---
comet_change: add-subagent-panel
role: technical-design
canonical_spec: openspec
---

# SubAgent Panel Technical Design

## Scope

Add a standalone `subagent` TUI plugin that monitors direct child sessions of the viewed session. The plugin shows the newest five children in its primary group, places older children under an independently collapsible Rest group, reconstructs status and identity after remount, preserves terminal failures, and opens a selected child through the built-in session route. Entry rows omit status bullets, color time by status, and end-truncate titles against their measured terminal-cell width.

The OpenSpec delta at `openspec/changes/add-subagent-panel/specs/subagent-panel/spec.md` defines user-visible behavior. `AGENTS.md` defines the canonical 37-cell layouts. This document defines module boundaries, snapshot and event flow, status derivation, persistence, rendering, cleanup, and tests.

Grandchild flattening, token or cost data, tool-call correlation, paging, commands, manual completion, and full-entry persistence remain outside this change.

## Existing Architecture

Each sidebar feature follows four repository boundaries:

- `tui/features/<feature>.ts` transforms host records into a pure panel model.
- `tui/services/<feature>.ts` owns asynchronous or event-driven state when needed.
- `tui/<feature>.tsx` registers one sidebar slot and renders a small Solid component.
- `shared/opencode-tools-shared.ts` exposes models and runtime primitives to standalone bundles.

`CompactPanel` owns the outer disclosure, title, optional status detail, collapsed summary, and panel dividers. SesTokens supplies the reusable parent index and a proven pattern for generation-aware snapshots, shared message-request limits, retries, and stale complete data.

SubAgent adds feature-specific nested entry and Rest disclosures. Those interactions do not fit the generic presentation renderer.

## Confirmed Sidebar Order

The user-authored `plugin-manifest.json` change is part of this change. Complete it with the following order:

| Plugin | Slot order |
| --- | ---: |
| Home | 1 |
| Context | 100 |
| SesTokens | 110 |
| SubAgent | 120 |
| Quota | 130 |
| MCP | 140 |
| LSP | 150 |
| TODO | 160 |

Token Report has no sidebar slot order. Manifest, runtime, build, deployment, and documentation tests must assert the complete order so later changes cannot move one panel accidentally.

## Architecture

Use four focused layers:

```text
sidebar session_id / TUI events
              |
              v
      SubAgent source
 generation, retry, stale,
 retained failure terminals
              |
              v
 direct-child snapshot loader
 session.list + parent index
 status + bounded messages
              |
              v
     pure SubAgent model
 status, duration, grouping,
 counts, identity, allocation
              |
              v
      SubAgent Solid panel
 disclosures, clock, route, KV
```

Create these files:

```text
tui/services/subagent-snapshot.ts
tui/services/subagent-source.ts
tui/features/subagent.ts
tui/subagent.tsx
```

Reuse `indexSessionsByParent` from `tui/services/session-tree-snapshot.ts`. Do not import SesTokens state, source, model, or component code. Each standalone plugin must work when no sibling plugin is active.

## OpenCode Data Contract

The installed SDK exposes these records:

```ts
type Session = {
  id: string
  parentID?: string
  title: string
  time: { created: number; updated: number }
}

type SessionStatus =
  | { type: "idle" }
  | { type: "retry"; attempt: number; message: string; next: number }
  | { type: "busy" }
```

Assistant messages expose `agent`, `modelID`, `time.completed`, and optional `error`. User messages expose `agent` and `model.modelID`. Session records in the installed SDK do not expose agent or model, so the detail model must derive both fields from messages.

Extend the local `@opencode-ai/plugin/tui` declaration only for APIs used here:

```text
api.state.path.directory
api.state.session.status(sessionID)
api.client.session.list({ directory })
api.client.session.messages({ sessionID, directory })
api.event.on(type, handler)
api.route.navigate("session", { sessionID })
api.slots.register({ sidebar_content })
api.kv.get / api.kv.set
api.lifecycle.signal / api.lifecycle.onDispose
```

Both client methods return `{ data, error }` envelopes. The adapter throws when `error !== undefined` or `data` is absent, including defined falsy errors. It never converts an API error or missing payload into an empty session or message list.

Subscribe to these event types:

| Event | Action |
| --- | --- |
| `session.created` | Rebuild when `info.parentID` is the viewed parent |
| `session.updated` | Rebuild when the child, old parent, or new parent is relevant |
| `session.deleted` | Remove known child evidence and rebuild |
| `session.status` | Rebuild when the session is a known direct child |
| `session.idle` | Rebuild when the session is a known direct child |
| `session.error` | Record failure time for a known direct child, then rebuild |
| `message.updated` | Rebuild when the message belongs to a known direct child |
| `message.removed` | Rebuild when the message belongs to a known direct child |
| `tui.session.select` | Switch to a different non-empty viewed parent |

The sidebar slot remains the primary viewed-parent source. A changed `props.session_id` switches even if the select event does not arrive.

## Direct-Child Snapshot

Define a neutral complete snapshot:

```ts
type SubagentChildSnapshot = {
  session: Pick<Session, "id" | "parentID" | "title" | "time">
  status: SessionStatus | undefined
  messages: readonly Message[]
}

type SubagentSnapshot = {
  parentID: string
  childIDs: readonly string[]
  children: readonly SubagentChildSnapshot[]
}

type SubagentSnapshotLoadContext = {
  signal: AbortSignal
  onChildIDs(childIDs: readonly string[]): void
}
```

The loader follows this sequence:

1. Fetch one directory session list.
2. Build the shared parent index.
3. Select only `index.get(parentID)` and sort by creation time descending, then ID ascending.
4. Publish the discovered direct-child IDs through `onChildIDs` before message fan-out.
5. Read synchronized status and fetch messages for each direct child.
6. Return only after every child request succeeds.

Create one loader instance per mounted plugin. Its message limiter lives outside individual snapshot calls and caps active requests at four across overlapping generations. Aborted queued work rejects without starting. Already-started SDK calls keep their shared slots until they settle because the host client methods accept no transport signal.

When one child request fails, stop workers from claiming more children and wait for already-started requests to settle before rejecting the attempt. This prevents retries from stacking behind unfinished workers. Store results by sorted child index so completion order cannot reorder the snapshot.

The loader never fetches grandchild messages. A grandchild appears only after the user opens its parent and that session becomes the viewed parent.

## Source State Machine

`tui/services/subagent-source.ts` owns asynchronous state:

```ts
type SubagentSourceState =
  | { phase: "loading"; parentID: string }
  | { phase: "unavailable"; parentID: string }
  | { phase: "ready"; parentID: string; snapshot: SubagentSnapshot; failureTimes: Readonly<Record<string, number>> }
  | { phase: "stale"; parentID: string; snapshot: SubagentSnapshot; failureTimes: Readonly<Record<string, number>> }
```

`ready` and `stale` always contain a complete snapshot and an immutable copy of that parent's retained failure evidence. Loading and unavailable state produce no panel output. A complete snapshot with zero children renders the empty panel, which distinguishes "no children" from "data unavailable."

### Parent Switching

When the slot or select event changes the viewed parent:

1. Abort the previous generation and increment the generation number.
2. Clear debounce and retry timers.
3. Reset known child IDs and add no speculative children.
4. Set loading state for the new parent.
5. Start a snapshot without debounce.

An empty parent ID aborts work, clears output, and issues no client request.

### Event Debounce And Discovery

The first relevant event immediately aborts and invalidates the active generation, then schedules one rebuild 200 ms after the latest event. Further events replace the debounce timer without starting intermediate snapshots. Ready or stale state keeps its complete snapshot while the next generation waits; loading and unavailable state keep producing no output. The loader publishes discovered child IDs before message requests begin, so an event for a newly discovered child invalidates the initial attempt before an outdated snapshot can publish.

Generation checks guard discovered topology, terminal failure writes, retries, and state publication. A callback from an old parent cannot alter current filtering or persistence.

### Retry And Stale Behavior

Each generation starts one immediate attempt. Failures retry after 2, 4, and 8 seconds. Every wait checks parent ID, generation, controller identity, and disposal before issuing a request.

After the last failure:

- Loading becomes unavailable and the adapter renders nothing.
- Ready becomes stale and retains the complete snapshot.
- Stale remains stale and retains the complete snapshot.

A later relevant event can start a new generation from unavailable state. Any successful generation publishes the new complete snapshot and returns to ready.

### Disposal

`dispose()` aborts the current generation, clears all debounce and retry timers, calls each event unsubscriber, clears listeners, and blocks later state or KV updates. The plugin does not poll.

## Failure Persistence

Persist only `session.error` terminal times because the synchronized session list and messages cannot reconstruct an old error event reliably. Use one feature-specific KV record:

```ts
type RetainedFailures = Record<string, Record<string, number>>
```

The outer key is parent ID and the inner key is child ID. On a known child's first `session.error`, store the injected current time before scheduling a rebuild. Repeated events preserve the first retained time. Publish an immutable updated `failureTimes` value against the existing ready or stale snapshot and notify subscribers immediately, then run the debounced reconstruction. Ignore errors without a session ID or for unknown sessions.

Assistant-message errors do not require persistence. The message snapshot reconstructs them after remount and removing the errored message removes that evidence on the next complete snapshot. For repeated assistant errors, choose the earliest finite `time.completed ?? time.created`. Failed duration uses the earliest finite time across retained and current message evidence. Retained event evidence still controls terminal persistence and status precedence.

After each complete snapshot, remove retained failures for children that no longer exist or no longer belong to the parent. Deletion events may remove known evidence immediately, but the next complete snapshot remains authoritative.

## Pure SubAgent Model

The pure model accepts a complete snapshot, retained failures for its parent, and `now`. It returns semantic entries and groups without Solid, API, KV, or timer dependencies.

```ts
type SubagentStatus = "successful" | "running" | "failed"

type SubagentEntry = {
  id: string
  title: string
  agent: string
  model: string
  status: SubagentStatus
  durationMs: number
  duration: string
}

type SubagentPanelModel = {
  primary: readonly SubagentEntry[]
  rest: readonly SubagentEntry[]
  successful: number
  running: number
  failed: number
  summary: readonly PanelTextSegment[]
}
```

### Identity

Find the single newest assistant message and the single newest user message. Resolve agent and model independently from only those two messages:

1. Use the field from the newest assistant message when present.
2. Otherwise use the corresponding field from the newest user message when present.
3. Otherwise render `-`.

Do not scan an older assistant or user message when the selected newest message lacks one field.

Use model ID only, matching the AGENTS detail row. Session title is the entry name.

### Status Precedence

Apply this order:

1. A retained `session.error` time or any assistant-message error means failed.
2. Synchronized busy or retry means running.
3. Synchronized idle means successful.
4. Without synchronized status, an error-free assistant whose `time.completed` is defined means successful.
5. An in-progress assistant or a child with no completed assistant result remains running.

A retained `session.error` remains terminal until the child disappears or no longer belongs to the parent. An assistant-message error remains failure evidence only while that message exists.

### Duration

Clamp every duration to a finite nonnegative integer:

- Running: `now - session.time.created`.
- Successful: `session.time.updated - session.time.created`.
- Failed: selected failure time minus `session.time.created`.

Format floored whole seconds:

- Below one minute: `<seconds>s`.
- Below one hour: `<minutes>m <seconds>s`.
- One hour or more: `<hours>h <minutes>m`.

### Grouping And Counts

Sort by `time.created` descending and ID ascending. Return `entries.slice(0, 5)` as primary and `entries.slice(5)` as Rest. Reconstruct all direct children even when Rest is collapsed. Counts cover both groups and appear successful/running/failed in that order.

The collapsed summary uses independently colorable segments:

```text
<successful>/<running>/<failed>
```

Successful uses `success`, running uses `warning`, failed uses `error`, and separators use `textMuted`.

## Disclosure Persistence

Store parent-scoped presentation state in feature-specific KV maps:

```text
aamkye.opencode-tools-subagent.panel-collapsed
aamkye.opencode-tools-subagent.rest-collapsed
aamkye.opencode-tools-subagent.expanded-child
```

Each map uses viewed parent ID as its key. Defaults are expanded outer panel, expanded Rest, and no child detail. Expanding one child replaces the previous child ID. Clicking the expanded child collapses it.

After a complete snapshot, clear a persisted expanded ID that is not a current direct child. An expanded Rest child remains selected while Rest is collapsed, but its detail is not rendered until Rest expands again.

## Solid Plugin Component

Create `tui/subagent.tsx` with `pluginDescriptor("subagent")`. Activation creates one source and registers source cleanup through `defineTuiPlugin` context.

The session-scoped slot sends `props.session_id` to the source. It renders no element for an empty session ID, loading state, or unavailable state. Ready and stale state render one panel even when the complete child list is empty.

### Outer Panel

Use `CompactPanel` with title `SubAgent`, the parent-scoped collapse value, colored count summary, and expanded footer divider. Stale state passes warning detail `{ text: "stale", status: "warning" }`. Collapsed stale state uses the built-in one-cell detail-summary separator.

An expanded empty snapshot renders muted `No subagents`.

### Entry Rows

Each entry row is a full-width horizontal box with these regions:

```text
disclosure + flexible title + gap + duration
```

The disclosure renders `▶ ` or `▼ `. Entry rows have no status bullet. Only the title flexes. OpenTUI 0.4.x truncates text in the middle, so the title renderable's public `onSizeChange` callback supplies its computed width to a grapheme-safe end-truncation helper. Declare the already-installed `string-width` package directly to measure terminal cells. The duration includes its leading one-cell gap in the fixed region, stays at the right edge, and uses the entry status color: success, warning, or error.

Update the pure allocation helper for disclosure, title, gap, and duration at 37 cells and narrower. Do not build padded rows in the component.

### Detail Rows

An expanded entry omits duration from its header and renders these rows in order:

```text
  agent:  <right-aligned value>
  status: <right-aligned value>
  time:   <right-aligned value>
  model:  <right-aligned value>
  Open Session
```

Labels and values use clipped flex rows with a two-cell indent. The `time` value uses the entry status color. `Open Session` is a clickable row. Activating it calls:

```ts
api.route.navigate("session", { sessionID: child.id })
```

### Rest Group

Render no Rest section for five or fewer children. Otherwise render one internal divider after the fifth primary entry as muted `---`, flexible space, and `---`, then a full-width muted `▼ Rest` or `▶ Rest` header. Rest collapse does not change the outer panel or counts.

### Conditional Clock

Run a one-second interval only when all conditions hold:

- Source state is ready or stale.
- The outer panel is expanded.
- At least one rendered primary entry is running, or Rest is expanded and at least one Rest entry is running.

The interval updates one `now` signal. Stop it when those conditions become false, the parent changes, or the plugin disposes. Expanding a previously hidden running row recomputes from the current time before starting the next tick.

## Error Handling Matrix

| Condition | Source state | Panel output |
| --- | --- | --- |
| No active parent | none | none |
| First attempt or retry pending | loading | none |
| Initial retries exhausted | unavailable | none |
| Complete empty snapshot | ready | `No subagents`, or `0/0/0` collapsed |
| Complete non-empty snapshot | ready | entries and count summary |
| Background retries exhausted | stale | retained entries plus warning `stale` |
| Later complete snapshot | ready | new entries, stale removed |
| Parent changes | loading | previous panel removed immediately |

Malformed optional identity fields fall back to `-`. Invalid timestamps clamp to zero-duration output. Snapshot list or child-message failures never produce partial entries.

## Spec And AGENTS Patches

The confirmed design updates the OpenSpec delta with:

- Exact message identity fallback.
- Exact `No subagents` empty copy.
- No output for initial loading and unavailable state.
- Expanded and collapsed stale behavior plus recovery.
- 200 ms debounce, shared concurrency four, 2/4/8 retries, generation cancellation, and complete-only publication.
- Exact sidebar order and slot values.

`AGENTS.md` gains expanded and collapsed stale examples. It has no loading or unavailable example because those states produce no panel output.

## Test Strategy

Follow test-driven development. Each implementation task starts with a failing behavioral test.

### Pure Model Tests

Cover direct filtering input, deterministic equal-time ordering, newest-five/Rest split, all completed/in-progress status precedence branches, retained failure dominance, newest-assistant field fallback to newest user without scanning older messages, zero and invalid timestamps, duration boundaries, counts, summary segments, and narrow row allocation.

### Snapshot Tests

Use injected list, message, status, time, and signal dependencies. Cover zero children, direct children with grandchildren, discovered IDs before message fan-out, four-request limits across overlapping generations, cancelled queued work, reverse completion order, one child failure, quiescence before rejection, and no grandchild message requests.

### Source Tests

Inject loader, timer, event, and failure-store dependencies. Cover immediate initial load, 200 ms coalescing, event-during-initial-load supersession, all relevant and irrelevant events, 2/4/8 retries, loading-to-unavailable, unavailable-to-ready recovery after a relevant event, ready-to-stale retention, stale recovery, session switching, obsolete topology and terminal rejection, failure persistence/pruning, empty parent, subscriber isolation, and disposal.

### Mounted Panel Tests

Assert every AGENTS layout: expanded, one detail, expanded Rest, semi-collapsed Rest, collapsed counts, stale expanded, and stale collapsed. Also cover no output for loading/unavailable, `No subagents`, exact row order, status-colored compact/detail time, end ellipsis, 37/36-cell boundaries, a scrollbar-reduced 35-cell row, real `onSizeChange` callback measurement, muted Rest treatment, spaced divider segments, no trailing whitespace, parent-scoped persistence, one-entry expansion, invalid ID cleanup, hidden Rest details, conditional clock start/stop/disposal, and route navigation.

### Type And Integration Tests

Add compile fixtures for session status, events, messages, list calls, route navigation, slot props, KV, and lifecycle. Extend manifest, runtime key, package export, shared facade, build, deploy, managed artifact, README, and source-boundary tests. Build the standalone artifact and assert that it imports the managed shared bundle and no repository source path.

### Final Gates

Run the focused SubAgent suites, `npm run typecheck`, `npm test`, and `npm run build`. Inspect the generated SubAgent bundle for forbidden source imports and verify the committed AGENTS layout hash selected during implementation.

## Alternatives Rejected

### Incremental Event Store

Maintaining entries only from events reduces client requests but cannot reconstruct missed history after remount. It also requires broader persistence and more event-order conflict handling.

### Full Descendant Snapshot

Reusing the SesTokens full-tree loader would fetch messages for grandchildren that the panel must not show. The direct-child loader reuses only the neutral parent index and concurrency pattern.

### Persisted Full Entries

Persisting titles, status, identity, and duration would display quickly after remount but duplicate OpenCode's source of truth and retain deleted children. Persist only failure events and disclosure choices.

### Continuous Clock

A permanent interval would repaint collapsed or hidden entries that show no duration. The conditional visible-running clock limits work without changing displayed time semantics.

## Delivery And Rollback

The build adds one independent SubAgent artifact and completes the confirmed manifest reorder. Deployment updates managed plugin entries in manifest order while preserving unrelated configuration.

Preserve the accepted README inspiration links and table formatting when adding SubAgent installation, artifact, and source-boundary documentation. Rollback removes the SubAgent plugin entry/artifact and restores the prior manifest order if the ordering change must also be reverted. Inert disclosure and failure KV records are safe to leave because no other feature reads them.
