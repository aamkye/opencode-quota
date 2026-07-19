---
comet_change: add-session-token-panel
role: technical-design
canonical_spec: openspec
---

# SesTokens Panel Technical Design

## Scope

Add a standalone `ses-tokens` TUI plugin that aggregates assistant-message usage for the viewed session and its full descendant tree. The plugin renders the expanded and collapsed SesTokens layouts in `AGENTS.md`, saves collapse state, refreshes after relevant OpenCode events, and retains the last complete snapshot when a background refresh fails.

The OpenSpec delta at `openspec/changes/add-session-token-panel/specs/session-token-panel/spec.md` defines user-visible behavior. This document defines module boundaries, request flow, state transitions, rendering changes, failure handling, and tests.

Costs, per-session breakdowns, polling, and configuration commands remain outside this change.

## Existing Architecture

The repository builds each TUI feature from `plugin-manifest.json`. LSP, MCP, Context, and TODO use the same boundaries:

- `tui/features/<feature>.ts` transforms host data into a pure panel model.
- `tui/<feature>.tsx` registers a sidebar slot and renders a thin Solid component.
- `shared/opencode-tools-shared.ts` exposes the model and shared runtime primitives.
- `defineTuiPlugin` owns activation cleanup through the host lifecycle.
- `CompactPanel` renders disclosure, title, collapsed summary, and dividers.

SesTokens needs an asynchronous source because the TUI state has no complete descendant-tree accessor. The reference session-token-summary plugin confirms that a client snapshot plus lifecycle events provides complete descendant totals and reliable repainting.

## Architecture

Use four focused layers:

```text
sidebar session_id / TUI events
              |
              v
  SesTokens refresh source
  generation, retry, stale state
              |
              v
 neutral session-tree snapshot
 session.list + parent index + messages
              |
              v
      pure SesTokens model
 totals, ratio, formatted values
              |
              v
       SesTokens Solid panel
 CompactPanel + rows + collapse KV
```

Create these files:

```text
tui/services/session-tree-snapshot.ts
tui/services/ses-tokens-source.ts
tui/features/ses-tokens.ts
tui/ses-tokens.tsx
```

The session-tree module stays neutral. The later SubAgent change may reuse its parent index without importing SesTokens state or UI.

## OpenCode Data Contract

Extend the local `@opencode-ai/plugin/tui` declaration only for APIs used by this plugin:

```text
api.state.path.directory
api.client.session.list({ directory })
api.client.session.messages({ sessionID, directory })
api.event.on(type, handler)
api.slots.register({ sidebar_content })
api.kv.get / api.kv.set
api.lifecycle.signal / api.lifecycle.onDispose
```

The session list must expose `id` and optional `parentID`. Message results must expose `info`; assistant message info provides `role`, `tokens.input`, `tokens.output`, `tokens.reasoning`, `tokens.cache.read`, and `tokens.cache.write`.

Subscribe to these events:

| Event | Refresh condition |
|-------|-------------------|
| `message.updated` | Message session belongs to the last complete subtree |
| `message.removed` | Message session belongs to the last complete subtree |
| `session.created` | New session parent belongs to the last complete subtree |
| `session.updated` | Session ID or parent belongs to the last complete subtree |
| `session.deleted` | Deleted session belongs to the last complete subtree |
| `tui.session.select` | Event selects a different non-empty session ID |

The sidebar slot remains the primary active-session source. A changed `props.session_id` switches targets even if the select event is absent.

## Neutral Session-Tree Snapshot

Create narrow records derived from SDK types:

```ts
type SessionTreeRecord = Pick<Session, "id" | "parentID">

type SessionTreeSnapshot = {
  sessionIDs: readonly string[]
  messages: readonly Message[]
}
```

Expose small pure helpers for parent indexing and traversal. The loader accepts injected request functions so tests do not need a TUI API object:

```ts
loadSessionTreeSnapshot({
  rootSessionID,
  listSessions,
  listMessages,
  concurrency: 4,
}): Promise<SessionTreeSnapshot>
```

The loader follows this sequence:

1. Fetch one directory session list.
2. Build `Map<parentID, SessionTreeRecord[]>`.
3. Traverse from `rootSessionID` with a queue and visited set.
4. Fetch messages for every collected session with at most four requests in flight.
5. Flatten results in traversal order and return only after all requests succeed.

The root ID remains in the tree when the directory list omits it. The visited set prevents duplicate IDs or malformed parent cycles from causing repeated requests. Sessions outside the reachable subtree do not contribute messages.

Any failed list or message request rejects the whole snapshot. The loader never returns partial totals.

## Pure SesTokens Model

Create `createSesTokensPanelModel(messages)` in `tui/features/ses-tokens.ts`. Keep it independent from Solid, timers, client methods, and `TuiPluginApi`.

The model scans every message and ignores non-assistant roles. It treats missing or non-finite token values as zero. Each assistant message increments `turns`, including an assistant message whose token buckets are all zero.

Accumulate these fields:

```ts
type SesTokenTotals = {
  turns: number
  input: number
  output: number
  reasoning: number
  cacheRead: number
  cacheWrite: number
}
```

Calculate total as:

```text
input + output + reasoning + cacheRead + cacheWrite
```

Calculate cache-hit ratio as:

```text
cacheRead / (input + cacheWrite)
```

Render the ratio with one decimal and `×`. A zero denominator renders `∞` when cache read is positive and `-` when cache read is also zero.

Use `tui/presentation/format.ts` `formatCount` for turns and token counts. It removes trailing `.0` and supports `K`, `M`, and `B` boundaries. The returned model contains rendered values so the component does not duplicate arithmetic:

```ts
type SesTokensPanelModel = {
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
```

The collapsed summary segments render `Σ <total> / ↻ <turns>`.

## Refresh Source

`tui/services/ses-tokens-source.ts` owns asynchronous behavior. Keep its state invariant explicit:

```ts
type SesTokensSourceState =
  | { phase: "loading"; sessionID: string }
  | { phase: "unavailable"; sessionID: string }
  | { phase: "ready"; sessionID: string; snapshot: SessionTreeSnapshot }
  | { phase: "stale"; sessionID: string; snapshot: SessionTreeSnapshot }
```

`ready` and `stale` always contain a complete snapshot. `loading` and `unavailable` never contain values from another session.

### Session Switching

When the slot or select event changes session ID:

1. Increment the generation.
2. Cancel the debounce and retry timers.
3. Replace source state with `loading` for the new ID.
4. Reset known subtree IDs to the new root ID.
5. Start a load without the event debounce.

An empty session ID cancels work and prevents client calls. The panel may return `null` when no session is active, matching session-scoped sidebar behavior.

### Event Debounce

Relevant message and session events schedule one refresh 200 ms after the latest matching event. New events clear and replace the timer. The current generation changes when a load starts, so an older request cannot publish after a newer scheduled load.

A child-creation event whose parent belongs to the known tree schedules a refresh. If deeper children arrive before that refresh, the directory snapshot discovers them even though their IDs were not known when their events arrived.

### Retry Policy

Each refresh performs one immediate attempt. Failures retry after 2 seconds, 4 seconds, and 8 seconds. Every retry wait checks session ID, generation, and disposal before issuing a request.

After the last failure:

- `loading` becomes `unavailable`.
- `ready` becomes `stale` and keeps the snapshot.
- `stale` remains `stale` and keeps the snapshot.

A successful attempt replaces the full snapshot, updates known subtree IDs, and sets `ready`.

### Generation And Disposal Guards

Each load captures its session ID and generation. Before and after each request or wait, compare both values with the current source. Discard mismatches without updating state.

`dispose()` marks the source disposed, increments the generation, clears all timers, and calls each event unsubscriber. Register disposal through `defineTuiPlugin` context cleanup. The source does not poll.

## CompactPanel Header Detail

Option A requires status text in both expanded and collapsed headers. Add an optional property to `CompactPanelProps`:

```ts
detail?: CompactPanelSummary
```

Use the existing `CompactPanelSummary` segment and status representation. Render detail after the flexible title in both panel states. When the panel is collapsed and has both detail and summary, insert one fixed-width space between them.

Existing callers omit `detail`; their element structure and behavior remain unchanged. SesTokens passes this detail only for stale state:

```ts
{ text: "stale", status: "warning" }
```

The expanded header right-aligns `stale`. The collapsed header renders warning `stale`, one space, then `Σ <total> / ↻ <turns>`.

## Solid Plugin Component

Create `tui/ses-tokens.tsx` and obtain its descriptor through `pluginDescriptor("ses-tokens")`.

The activation creates one source and registers its cleanup. The sidebar callback updates the source target from `props.session_id` and returns a `SesTokensPanel` for non-empty sessions.

The component owns one collapse signal initialized from:

```text
aamkye.opencode-tools-ses-tokens.collapsed
```

Toggling the header updates the signal and KV value. Data snapshots remain memory-only.

### Ready And Stale Rendering

Render `CompactPanel` with title `SesTokens`, the persisted collapse signal, stale detail when needed, collapsed summary from the pure model, the current theme, and an expanded footer divider.

Expanded rows appear in this order:

```text
↻ turns
↑ in
↓ out
▤ cache write
▤ cache read
ø cache hit ratio
✦ think
internal divider
Σ total
```

A local metric-row component uses a full-width horizontal box. The muted label grows and shrinks; the value stays right-aligned and does not shrink. Do not build padded strings. This avoids trailing whitespace and lets OpenTUI honor narrower sidebar widths.

Render every row for a complete zero snapshot. Zero is valid data.

### Loading And Unavailable Rendering

Expanded loading renders muted `Loading...`. Expanded unavailable renders muted `Usage unavailable`. The collapsed header uses the same muted phrase as its summary and renders no metric summary.

Neither state renders zero values. Stale state renders the retained complete values plus the warning status.

## Packaging And Ordering

Add this manifest entry after TODO:

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

Extend `PluginKey`, package exports, shared facade exports, build expectations, deployment managed-artifact lists, and plugin documentation. Existing plugins keep their current order.

The standalone bundle must include its service and feature dependencies. It cannot require another TUI plugin to be active.

## Error Handling Matrix

| Condition | Phase | Expanded body | Collapsed summary | Header detail |
|-----------|-------|---------------|-------------------|---------------|
| First request pending or retrying | loading | `Loading...` muted | `Loading...` muted | none |
| Initial retries exhausted | unavailable | `Usage unavailable` muted | `Usage unavailable` muted | none |
| Complete snapshot | ready | metric rows | token/turn summary | none |
| Background retries exhausted | stale | retained metric rows | retained token/turn summary | `stale` warning |
| Later request succeeds | ready | new metric rows | new token/turn summary | none |
| Session changes | loading | clear prior metrics | `Loading...` muted | none |

Malformed token fields become zero at the pure model boundary. Client and topology failures remain source errors and do not produce a model.

## Test Strategy

Follow test-driven development. Add each failure before implementation.

### Pure Model Tests

Cover assistant-only turn counting, all five token buckets, deep flattened aggregates, missing and non-finite values, complete zero snapshots, total arithmetic, compact count boundaries, ratio rounding, both zero-denominator cases, and summary segment text.

### Session-Tree Snapshot Tests

Use injected request functions. Cover root-only trees, deep descendants, unrelated sessions, duplicate records, parent cycles, omitted root records, deterministic traversal, zero sessions, and one failed message request. Track active workers and assert that concurrency never exceeds four.

### Source State-Machine Tests

Inject the loader and timer functions. Cover immediate initial load, 200 ms event coalescing, irrelevant events, topology events, retry delays, event-during-load supersession, slot and select session switches, stale-generation completion, initial unavailable, ready-to-stale retention, stale-to-ready recovery, empty session IDs, disposal during retry, timer cleanup, and unsubscribe calls.

### CompactPanel Tests

Extend the mounted fixture with optional detail. Assert expanded placement, collapsed detail-summary separation, warning color, segment support, narrow allocation, and unchanged output for every existing no-detail case.

### SesTokens Mounted Tests

Create a fixture based on Context and LSP. Assert plugin ID and order, initial expanded state, exact row order and symbols, two outer dividers plus the internal divider, collapsed metric summary, option-A stale headers, loading and unavailable fallbacks, all-zero ready rows, 37-column width, no trailing whitespace, KV writes, remount restoration, session switching, event registration, and lifecycle cleanup.

### Contract And Integration Tests

Add a TUI API compile fixture for path, session client methods, message/session event shapes, and slot props. Extend manifest, package export, shared facade, build, deploy, managed artifact, and wiring tests. Run focused tests, `npm test`, `npm run typecheck`, and `npm run build`. Inspect the bundle for forbidden external source imports.

## Alternatives Rejected

### Recursive Child Requests

Calling `session.children` at every level avoids listing unrelated session metadata. It adds topology round trips and exposes more timing windows while a deep tree changes. One directory snapshot creates a coherent parent index and supports later direct-child consumers.

### Synchronized TUI State Only

Reading `api.state.session.messages` avoids client requests. The state API does not expose a complete descendant list, and the reference plugin reports unreliable slot repainting for aggregate updates. This approach cannot reconstruct a deep tree after remount without event history.

### Generic PanelRenderer

The generic renderer supports quantity rows and header details. SesTokens needs asynchronous phase handling and a compact panel consistent with LSP, Context, and TODO. Extending `CompactPanel` with one optional detail keeps those small plugins on one rendering path.

### Persisted Usage Snapshots

KV snapshots would render immediately after remount but could show data from a changed or deleted tree. OpenCode remains the usage source of truth. Persist only the presentation preference.

## Delivery And Rollback

The build adds one independent plugin artifact. Existing TUI configurations remain unchanged until users register or deploy SesTokens. Rollback removes the plugin entry or deploys a version without the artifact. The unused collapse key can remain because no other feature reads it.
