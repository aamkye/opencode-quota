# Comet Design Handoff

- Change: add-session-token-panel
- Phase: design
- Mode: compact
- Context hash: 7a58705e8ccdeb49d7e334941bff64eb842ce575b7d7279531ddd213491aa87e

Generated-by: comet-handoff.sh

OpenSpec remains the canonical capability spec. This handoff is a deterministic, source-traceable context pack, not an agent-authored summary.

## openspec/changes/add-session-token-panel/proposal.md

- Source: openspec/changes/add-session-token-panel/proposal.md
- Lines: 1-28
- SHA256: 18866e473b1cd1ccaeb8f0c0daafc02faa6e098d926b1516a92bd4d826f63db5

```md
## Why

OpenCode users can inspect token usage through commands, but the sidebar does not provide a live, compact view of the current session's aggregate usage. A SesTokens panel makes root and nested subagent consumption visible without leaving the active session while preserving the repository's established TUI layout conventions.

## What Changes

- Add a standalone SesTokens sidebar plugin with the expanded and collapsed layouts specified in `AGENTS.md`.
- Aggregate assistant turns and token categories across the viewed session and its complete descendant session tree.
- Refresh usage from session and message lifecycle events with bounded concurrency, debouncing, stale-request protection, and last-complete-snapshot retention.
- Persist panel collapse state and clean up timers, subscriptions, and in-flight work when the plugin is disposed.
- Add manifest, package, build, deployment, shared-module, type declaration, model, and mounted-panel integration coverage.

## Capabilities

### New Capabilities

- `session-token-panel`: Live aggregate session-tree token usage in an AGENTS.md-compliant SesTokens sidebar panel.

### Modified Capabilities

None.

## Impact

- Adds a new TUI plugin entry point and pure feature model under `tui/`.
- Extends the shared TUI module, plugin manifest, package exports, deployment expectations, and local TUI API declarations.
- Uses existing OpenCode TUI/SDK session, message, provider state, event, slot, lifecycle, and KV APIs without changing a public application API or adding a dependency.
- Adds focused model, mounted rendering, lifecycle, manifest, build, deployment, and type tests.

```

## openspec/changes/add-session-token-panel/design.md

- Source: openspec/changes/add-session-token-panel/design.md
- Lines: 1-69
- SHA256: f1e8857bae6affd533465bd59752e6e5162388d29dc52041f45e73540be8b69d

```md
## Context

The repository packages each sidebar capability as an independent TUI plugin selected from `plugin-manifest.json`. LSP, MCP, and TODO keep transformation logic in a pure `tui/features` module, export it through `shared/opencode-tools-shared.ts`, and use a thin Solid component around `CompactPanel`. SesTokens must follow that structure while obtaining data that is not exposed as one ready-made TUI state value: token totals and assistant-turn counts across the current session and every descendant session.

The OpenCode TUI API exposes synchronized session state, client session queries, lifecycle events, plugin slots, KV storage, and disposal hooks. The reference session-token-summary plugin demonstrates that client-backed subtree loading plus event-triggered refreshes is more reliable for complete descendant aggregation than relying only on reactive state repainting.

## Goals / Non-Goals

**Goals:**

- Render the exact SesTokens expanded and collapsed layouts defined in `AGENTS.md` at the 37-cell sidebar width.
- Aggregate turns and token categories over the viewed session's complete descendant tree.
- Keep displayed data current without polling and without allowing stale or partial loads to replace a complete snapshot.
- Follow the existing feature-model, shared-export, runtime, manifest, build, deployment, and test conventions.
- Leave reusable session-tree traversal logic suitable for later consumers without coupling this change to the SubAgent panel.

**Non-Goals:**

- Cost reporting or estimation.
- Per-session or per-agent token breakdowns.
- User-configurable refresh, formatting, or aggregation behavior.
- SubAgent rendering, status tracking, or navigation.
- Supporting OpenCode versions older than the package's declared minimum.

## Decisions

### Use a standalone manifest plugin and the existing compact-panel pattern

Add a `ses-tokens` manifest key and standalone `tui/ses-tokens.tsx` entry point after TODO in sidebar order. The panel will use `defineTuiPlugin`, `pluginDescriptor`, and `CompactPanel`; its pure formatting and aggregation model will live in `tui/features/ses-tokens.ts` and be exported through `shared/opencode-tools-shared.ts`.

This keeps packaging and rendering consistent with LSP, MCP, and TODO. Extending the generic presentation schema was considered, but the fixed metric rows and compact collapsed summary do not require a new generic item type.

### Build a client-backed session-tree snapshot

A session-tree loader will list sessions for the active directory, index them by `parentID`, traverse from the viewed session with a visited set, and fetch messages for every session in the subtree. Message requests will run with a fixed concurrency limit of four. Only assistant messages contribute one turn and their `input`, `output`, `reasoning`, `cache.read`, and `cache.write` values.

Using session-level aggregate tokens was considered, but assistant messages are required to count turns and provide one consistent source for every displayed category. Using only synchronized `api.state.session.messages` was rejected because complete descendant availability and slot repainting are less reliable than event-triggered client snapshots.

### Define arithmetic and display formatting explicitly

`total` is the sum of input, output, reasoning, cache-read, and cache-write tokens. The cache-hit ratio is `cacheRead / (input + cacheWrite)`, formatted to one decimal place with `×`; a zero denominator renders `∞` when cache-read is nonzero and `-` otherwise. Counts use the repository's compact count convention with `K` and `M` suffixes and no unnecessary trailing `.0`.

The expanded panel always renders the rows and internal divider in the AGENTS.md order. The collapsed summary is `Σ <total> / ↻ <turns>`. Muted `Loading...` or `Usage unavailable` content may replace metric rows only before any complete snapshot exists; once a complete snapshot exists, refresh errors retain it unchanged.

### Refresh by relevant events with debounce and generation guards

The plugin tracks the active session ID and the IDs in its last complete subtree. Message updates/removals affecting known IDs and session create/update/delete events affecting a known session or parent schedule one debounced refresh. Slot session changes and `tui.session.select` reset the target and trigger an immediate load.

Each load receives a monotonically increasing generation. Results update Solid state only when the plugin is active, the generation is current, and all subtree requests completed. A bounded retry policy handles transient failures. Failed background refreshes preserve the last complete snapshot; only an initial load with no snapshot exposes an unavailable state.

### Persist only presentation state and clean up all resources

The panel collapse flag uses a feature-specific KV key. Usage snapshots are not persisted because they can become stale and are reconstructible from OpenCode session data. Event unsubscribe functions, debounce/retry timers, and disposal flags are registered through the plugin lifecycle so remounting cannot leak refresh work or update disposed Solid state.

## Risks / Trade-offs

- **Large session trees can require many message requests** -> Bound concurrency to four, debounce bursts, and fetch only after relevant events.
- **Session events can arrive before synchronized state settles** -> Use a short debounce and bounded retries before declaring the initial load unavailable.
- **A session can be deleted during traversal** -> Treat the refresh as incomplete and retain the previous complete snapshot rather than publishing partial totals.
- **SDK/TUI declarations can drift from the installed runtime** -> Extend only the locally used API surface and add compile-time contract fixtures plus build tests.
- **Bundled standalone plugins cannot rely on another plugin being active** -> Keep all SesTokens dependencies in the shared source graph bundled into its own artifact.

## Migration Plan

Add the new manifest/package entry and deploy it alongside existing managed plugins. No persisted usage migration is needed; the collapse key defaults to expanded. Rollback removes the SesTokens plugin entry/artifact and leaves an inert KV preference that is safe to ignore.

## Open Questions

None. Loading/error copy and compact-number edge cases will be finalized by tests without changing the confirmed ready-state layouts.

```

## openspec/changes/add-session-token-panel/tasks.md

- Source: openspec/changes/add-session-token-panel/tasks.md
- Lines: 1-24
- SHA256: 5b167626ec01cf42dbd51258eb2747205986fe27d8e77979c1daea24fd0eca1d

```md
## 1. SesTokens Model

- [ ] 1.1 Add failing model tests for assistant-turn aggregation, token totals, cache-ratio edge cases, compact formatting, and collapsed summary text
- [ ] 1.2 Implement the pure SesTokens aggregation and presentation model and export it through the shared module

## 2. Session-Tree Data Source

- [ ] 2.1 Add failing tests for descendant traversal, cycle protection, bounded concurrency, session switching, stale generations, retry, and last-complete-snapshot retention
- [ ] 2.2 Implement the client-backed session-tree loader and event-driven refresh coordinator with lifecycle cleanup
- [ ] 2.3 Extend local OpenCode TUI API declarations and compile fixtures for the session, client, event, and state surface used by SesTokens

## 3. Sidebar Panel

- [ ] 3.1 Add mounted-panel tests for AGENTS.md expanded, collapsed, loading, unavailable, width-boundary, persistence, session-switch, and disposal scenarios
- [ ] 3.2 Implement the standalone Solid SesTokens panel with exact row ordering, symbols, alignment, colors, dividers, summary, and KV collapse behavior

## 4. Plugin Integration

- [ ] 4.1 Add failing manifest, package export, build, deployment, managed-artifact, and shared-contract expectations for SesTokens
- [ ] 4.2 Wire SesTokens into the plugin manifest, runtime descriptor types, package metadata, build outputs, deployment paths, and user-facing plugin documentation

## 5. Verification

- [ ] 5.1 Run focused tests, typecheck, the full test suite, and plugin build; inspect generated output for forbidden imports and confirm no AGENTS.md layout regression

```

## openspec/changes/add-session-token-panel/specs/session-token-panel/spec.md

- Source: openspec/changes/add-session-token-panel/specs/session-token-panel/spec.md
- Lines: 1-111
- SHA256: 06135dca47e7eb959991df94d787a6db08f9a5758ecd1da1b0c266747afa617d

[TRUNCATED]

```md
## ADDED Requirements

### Requirement: Session-tree token aggregation
The system SHALL aggregate token usage for the currently viewed session and every reachable descendant session exactly once. Each assistant message SHALL add one turn and SHALL contribute its input, output, reasoning, cache-read, and cache-write token values.

#### Scenario: Root session without descendants
- **WHEN** the viewed session has assistant messages and no child sessions
- **THEN** SesTokens reports the turns and token categories from that session only

#### Scenario: Nested descendant tree
- **WHEN** the viewed session has direct and deeply nested child sessions
- **THEN** SesTokens includes every reachable descendant exactly once regardless of tree depth

#### Scenario: Non-assistant messages
- **WHEN** the session tree contains user or other non-assistant messages
- **THEN** those messages do not affect turns or token totals

### Requirement: Token arithmetic and formatting
The system SHALL define total tokens as input plus output plus reasoning plus cache-read plus cache-write tokens. It SHALL define cache-hit ratio as cache-read divided by input plus cache-write and SHALL format counts using compact `K` and `M` suffixes without unnecessary trailing zeroes.

#### Scenario: Normal cache ratio
- **WHEN** cache-read is nonzero and input plus cache-write is nonzero
- **THEN** the panel renders their ratio to one decimal place followed by `×`

#### Scenario: Zero cache denominator
- **WHEN** input plus cache-write is zero
- **THEN** the panel renders `∞` if cache-read is nonzero and `-` otherwise

#### Scenario: Compact values
- **WHEN** a count crosses a thousand or million boundary
- **THEN** the panel renders the value with the corresponding compact uppercase suffix

### Requirement: AGENTS.md SesTokens layout
The system SHALL render a plain `SesTokens` panel matching the expanded and collapsed layouts, row order, dividers, spacing, alignment, symbols, colors, maximum width, and no-trailing-whitespace rules in `AGENTS.md`.

#### Scenario: Expanded panel
- **WHEN** SesTokens is expanded with a complete snapshot
- **THEN** it renders turns, input, output, cache write, cache read, cache hit ratio, reasoning, an internal divider, and total in the specified order, followed by the panel divider

#### Scenario: Collapsed panel
- **WHEN** SesTokens is collapsed
- **THEN** its header renders `Σ <total> / ↻ <turns>` and no metric body rows, followed by the panel divider

#### Scenario: Sidebar width boundary
- **WHEN** the panel is rendered at 37 cells or narrower
- **THEN** every row respects available width and produces no trailing whitespace

#### Scenario: Initial snapshot loading
- **WHEN** the initial snapshot request or a bounded retry is pending
- **THEN** the expanded panel renders muted `Loading...` and the collapsed panel uses muted `Loading...` as its summary without claiming token totals

#### Scenario: Initial snapshot unavailable
- **WHEN** every bounded initial attempt fails and no complete snapshot exists
- **THEN** the expanded panel renders muted `Usage unavailable` and the collapsed panel uses muted `Usage unavailable` as its summary without claiming token totals

#### Scenario: Stale expanded header
- **WHEN** a background refresh fails after a complete snapshot and the panel is expanded
- **THEN** the panel retains every metric row and renders warning `stale` right-aligned in the header

#### Scenario: Stale collapsed header
- **WHEN** a background refresh fails after a complete snapshot and the panel is collapsed
- **THEN** the panel renders warning `stale` before `Σ <total> / ↻ <turns>` and preserves the one-cell separator and 37-cell limit

### Requirement: Event-driven resilient refresh
The system SHALL refresh the active session-tree snapshot after relevant session and message lifecycle events using debounce, bounded request concurrency, bounded retry, and stale-generation protection. It MUST publish only complete snapshots.

#### Scenario: Relevant message update
- **WHEN** an assistant message in the known session tree is updated or removed
- **THEN** SesTokens schedules one debounced refresh and publishes the new complete totals

#### Scenario: Descendant topology change
- **WHEN** a child session is created, updated, or deleted beneath the viewed session
- **THEN** SesTokens refreshes the traversed tree and its aggregate

#### Scenario: Stale request completion
- **WHEN** an older refresh finishes after the viewed session changes or a newer refresh completes
- **THEN** the older result does not replace the current snapshot

#### Scenario: Background refresh failure
- **WHEN** a refresh fails after a complete snapshot has been displayed

```

Full source: openspec/changes/add-session-token-panel/specs/session-token-panel/spec.md
