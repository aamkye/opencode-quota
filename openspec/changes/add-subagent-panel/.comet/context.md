# Comet Design Handoff

- Change: add-subagent-panel
- Phase: design
- Mode: compact
- Context hash: c761d52b64b35bdd306e8f5920394071b05302e6a9ad38a82cab3f96e7106125

Generated-by: comet-handoff.sh

OpenSpec remains the canonical capability spec. This handoff is a deterministic, source-traceable context pack, not an agent-authored summary.

## openspec/changes/add-subagent-panel/proposal.md

- Source: openspec/changes/add-subagent-panel/proposal.md
- Lines: 1-32
- SHA256: 6d8f9cc60f33cca35f361eb4bd40b3d79789385b1ccb78fb9017415fffba0a84

```md
## Why

OpenCode can run multiple child sessions, but the sidebar does not provide a compact view of which direct subagents are running, successful, or failed. A SubAgent panel makes child-session activity, elapsed time, identity, and navigation visible while preserving the repository's established TUI layout conventions.

## What Changes

- Add a standalone SubAgent sidebar plugin with the expanded, semi-collapsed, collapsed, Rest-group, and per-entry detail layouts specified in `AGENTS.md`.
- Rebuild direct child-session entries from synchronized session and message state, ordered newest-first, and update their successful/running/failed status from session lifecycle events.
- Keep the newest five entries in the primary group and place remaining entries in an independently collapsible Rest group.
- Persist panel, Rest-group, and single-entry expansion state plus only terminal failure metadata that cannot be reconstructed reliably.
- Navigate Open Session actions to the selected child session.
- Adopt the confirmed sidebar order with SubAgent immediately after SesTokens and shift the later sidebar panels to stable ten-point slots.
- Add manifest, package, build, deployment, shared-module, type declaration, model, and mounted-panel integration coverage.

## Capabilities

### New Capabilities

- `subagent-panel`: Live direct-child session monitoring and navigation in an AGENTS.md-compliant SubAgent sidebar panel.

### Modified Capabilities

None.

## Impact

- Adds a new TUI plugin entry point and pure feature model under `tui/`.
- Extends the shared TUI module, plugin manifest, package exports, deployment expectations, and local TUI API declarations.
- Reorders existing sidebar manifest entries to Home 1, Context 100, SesTokens 110, SubAgent 120, Quota 130, MCP 140, LSP 150, and TODO 160.
- Uses existing OpenCode TUI/SDK session, message, status, event, route, slot, lifecycle, and KV APIs without changing a public application API or adding a dependency.
- May reuse general session indexing utilities introduced by the separate SesTokens change, but remains independently buildable and testable.
- Adds focused model, mounted rendering, lifecycle, navigation, manifest, build, deployment, and type tests.

```

## openspec/changes/add-subagent-panel/design.md

- Source: openspec/changes/add-subagent-panel/design.md
- Lines: 1-83
- SHA256: 2fbda59859563a1049f06d6117c6192dab1810bc00d64fb30ce20b86cb8b5696

[TRUNCATED]

```md
## Context

The repository packages each sidebar capability as an independent TUI plugin selected from `plugin-manifest.json`. LSP, MCP, and TODO keep transformation logic in a pure `tui/features` module, export it through `shared/opencode-tools-shared.ts`, and use a thin Solid component around the compact panel primitives. SubAgent must follow that structure while combining session topology, synchronized status, message errors, timestamps, and route navigation.

OpenCode session records expose `parentID`, title, and timestamps; child messages expose agent, model, result, and error evidence; synchronized TUI state exposes current session status and messages; lifecycle events expose session creation, update, status, idle, error, and deletion. The reference subagent-magazine plugin shows the value of event-driven status tracking, but its tool-call correlation, full-entry persistence, polling, commands, paging, and retention controls exceed this panel's confirmed scope.

## Goals / Non-Goals

**Goals:**

- Render the exact SubAgent expanded, semi-collapsed, collapsed, Rest-group, and detail layouts defined in `AGENTS.md` at the 37-cell sidebar width.
- Show direct child sessions of the viewed session newest-first with successful/running/failed state and stable elapsed duration.
- Reconstruct entries from OpenCode session/message state across remounts while retaining failures that synchronized state can no longer prove.
- Support independent panel, Rest-group, and single-entry expansion plus Open Session navigation.
- Follow the existing feature-model, shared-export, runtime, manifest, build, deployment, and test conventions.

**Non-Goals:**

- Flattening grandchildren or other deeper descendants into the current panel.
- Token, cost, TODO progress, prompt, error text, or session ID detail rows.
- Tool-call/subtask correlation when no child session exists.
- Paging, sorting controls, TTL, clearing, manual completion, language switching, or slash commands.
- Supporting OpenCode versions older than the package's declared minimum.

## Decisions

### Use a standalone manifest plugin and focused panel primitives

Add a `subagent` manifest key and standalone `tui/subagent.tsx` entry point immediately after SesTokens. The confirmed sidebar order is Home 1, Context 100, SesTokens 110, SubAgent 120, Quota 130, MCP 140, LSP 150, and TODO 160. Transformation and grouping logic will live in `tui/features/subagent.ts` and be exported through `shared/opencode-tools-shared.ts`. The component will reuse `CompactPanel` for the outer header/divider and focused row/detail components for nested expansion and width allocation.

Extending the generic presentation schema was considered, but nested clickable entry headers, a secondary Rest disclosure, and Open Session action are feature-specific interactions. Copying the reference plugin's monolithic component was rejected because it would bypass the repository's pure-model and shared-module pattern.

### Discover only direct children and rebuild on activation

The data source will list sessions for the active directory and select records whose `parentID` exactly equals the viewed session ID. Entries are sorted by `time.created` descending with ID as a stable tie-breaker. The first five form the primary group and every remaining entry forms the Rest group. Grandchildren appear only when their direct parent session is opened.

Initial activation, sidebar session changes, and relevant session events trigger a 200 ms debounced rebuild. One shared limiter caps direct-child message requests at four across overlapping generations. Failed snapshots retry after 2, 4, and 8 seconds. The source publishes only complete current-generation snapshots, retains the last complete entries as stale after background failures, and exposes loading or unavailable state before the first complete result. A general session-parent index from the SesTokens change may be reused, but SubAgent will depend only on a neutral shared utility rather than on another panel being active.

### Derive status from synchronized state and durable evidence

Status precedence is:

1. A retained `session.error` terminal or assistant-message error is failed.
2. Synchronized `busy` or `retry` status is running.
3. Synchronized `idle` status is successful.
4. With no synchronized status, a completed error-free assistant message means successful; an in-progress assistant or a child with no completed assistant result remains running until terminal evidence arrives.

`session.status`, `session.idle`, `session.error`, message updates, and session deletion events update or rebuild the model. Only `session.error` terminal metadata is persisted per parent/child because that event may no longer be inferable after remount. Assistant-message failures remain reconstructible while their messages exist. Stale retained failures are pruned when the child is deleted or no longer belongs to the parent. Agent and model detail use fields from the single newest assistant message, then corresponding fields from the single newest user message, and finally `-`. Persisting all derived entries was rejected because session records are the source of truth and duplicate snapshots drift.

### Derive stable durations without high-frequency polling

Running duration is current time minus `session.time.created`, updated by a one-second render clock while at least one visible entry is running. Successful duration is `session.time.updated - created`; failed duration uses the earliest retained event or assistant-message failure timestamp minus created. Negative values clamp to zero. Durations use compact seconds, minutes, and hours formatting matching the AGENTS.md examples.

This avoids the reference plugin's 100 ms clock and token polling. Session timestamps can slightly overstate successful work if metadata updates occur after idle; that trade-off is preferable to persisting full entry histories.

### Persist disclosure state and navigate through the built-in route

Feature-specific KV keys store outer panel collapse, Rest collapse, and the expanded child ID for each viewed parent. Expanding one entry collapses the previous entry. If a persisted ID is no longer a direct child, it is cleared. `Open Session` calls `api.route.navigate("session", { sessionID: child.id })`.

The outer collapsed summary renders successful/running/failed counts in that order. Entry bullets and status values use success, warning, and error theme roles. Names truncate with an ellipsis after accounting for disclosure, bullet, duration, and width; all rows avoid trailing cells.

Before the first complete snapshot, loading and unavailable states produce no panel output. An expanded complete empty result renders muted `No subagents` and a collapsed `0/0/0` summary. Background failure retains complete entries and adds warning `stale` to expanded and collapsed headers until recovery.

### Dispose every event and clock resource

Event unsubscribe functions, debounce timers, the conditional duration clock, and disposal guards are owned by the runtime lifecycle. A generation guard prevents a rebuild for a previous viewed session from replacing the current model.

## Risks / Trade-offs

- **Idle does not encode historical failure by itself** -> Inspect assistant errors and retain observed `session.error` terminals in minimal KV.
- **Session state can lag lifecycle events** -> Debounce rebuilds and apply event terminals before consulting synchronized fallback state.
- **Events can arrive during a snapshot or after a parent switch** -> Publish discovered direct-child IDs before message fan-out, abort queued obsolete work, and guard topology, failures, and publication by generation.
- **Successful duration uses the last session update** -> Document and test this stable approximation instead of persisting full histories.
- **Many historical direct children can make Rest long** -> Keep the required newest-five split and collapsible Rest; paging remains explicitly out of scope.
- **SDK/TUI declarations can drift from the installed runtime** -> Extend only the locally used surface and add compile-time contract fixtures plus build tests.

## Migration Plan

Add the new manifest/package entry and deploy it alongside existing managed plugins. No full-entry migration is needed; disclosure keys default to expanded outer panel, expanded Rest, and no entry details. Rollback removes the SubAgent plugin entry/artifact and leaves inert KV preferences that are safe to ignore.


```

Full source: openspec/changes/add-subagent-panel/design.md

## openspec/changes/add-subagent-panel/tasks.md

- Source: openspec/changes/add-subagent-panel/tasks.md
- Lines: 1-25
- SHA256: 97ff66f192d05e24cd7feabf23e43a5739ae7c3e094eeac9c44e99739d189377

```md
## 1. SubAgent Model

- [ ] 1.1 Add failing model tests for direct-child filtering, deterministic newest-first ordering, newest-five/Rest grouping, completed-result status precedence, newest-message identity fallback, counts, failure-evidence durations, and truncation allocation
- [ ] 1.2 Implement the pure SubAgent entry, grouping, status, duration, and collapsed-summary model and export it through the shared module

## 2. Child-Session Data Source

- [ ] 2.1 Add failing tests for initial reconstruction, client envelopes, direct-only requests, bounded cross-generation concurrency, immediate event invalidation, assistant error removal, repeated failure timestamps, retries, loading-to-unavailable and unavailable-to-ready recovery, stale retention/recovery, session switching, stale generations, and deleted-child pruning
- [ ] 2.2 Implement the direct-child loader and debounced event coordinator with discovered-topology publication, 2/4/8 retries, minimal failure persistence, complete-snapshot retention, and lifecycle cleanup
- [ ] 2.3 Extend local OpenCode TUI API declarations and compile fixtures for session records, status, messages, events, client listing, and route navigation used by SubAgent

## 3. Sidebar Panel

- [ ] 3.1 Add mounted-panel tests for every AGENTS.md expanded, semi-collapsed, collapsed, Rest, one-detail, empty, stale, and width-boundary layout plus loading/unavailable no-output behavior
- [ ] 3.2 Add mounted interaction tests for independent panel/Rest persistence, one-entry expansion, stale expansion cleanup, duration clock disposal, and Open Session navigation
- [ ] 3.3 Implement the standalone Solid SubAgent panel with exact disclosures, bullets, rows, colors, ellipsis, dividers, detail alignment, and conditional one-second clock

## 4. Plugin Integration

- [ ] 4.1 Add failing exact manifest-order, package export, build, deployment, managed-artifact, and shared-contract expectations for SubAgent
- [ ] 4.2 Wire SubAgent into the plugin manifest, runtime descriptor types, package metadata, build outputs, deployment paths, and user-facing plugin documentation

## 5. Verification

- [ ] 5.1 Run focused tests, typecheck, the full test suite, and plugin build; inspect generated output for forbidden imports and confirm no AGENTS.md layout regression

```

## openspec/changes/add-subagent-panel/specs/subagent-panel/spec.md

- Source: openspec/changes/add-subagent-panel/specs/subagent-panel/spec.md
- Lines: 1-165
- SHA256: 9fb3eb88cd9d982f683dd01aa32c059e1e438e2ed3e2c22de9f655d69cb4d204

[TRUNCATED]

```md
## ADDED Requirements

### Requirement: Direct-child session discovery
The system SHALL list only sessions whose `parentID` exactly matches the currently viewed session. It SHALL order those child sessions newest-first by creation time with a stable tie-breaker.

#### Scenario: Direct and nested children
- **WHEN** the viewed session has direct children and those children have their own descendants
- **THEN** the panel lists only the direct children

#### Scenario: Viewed child session
- **WHEN** the user opens a child session that has its own direct children
- **THEN** the panel rebuilds to show those children rather than siblings from the previous parent

#### Scenario: Stable newest-first ordering
- **WHEN** multiple direct children exist
- **THEN** entries render newest-first and equal creation times are resolved deterministically

### Requirement: Primary and Rest grouping
The system SHALL place the newest five direct children in the primary group and all remaining direct children in an independently collapsible Rest group.

#### Scenario: Five or fewer children
- **WHEN** the viewed session has at most five direct children
- **THEN** all entries appear in the primary group and no Rest group is rendered

#### Scenario: More than five children
- **WHEN** the viewed session has more than five direct children
- **THEN** the newest five appear before the internal divider and all older entries appear under Rest

#### Scenario: Rest is collapsed
- **WHEN** the user collapses Rest
- **THEN** Rest entries are hidden while primary entries and the outer panel remain expanded

### Requirement: Subagent status classification
The system SHALL classify each direct child as successful, running, or failed using observed terminal errors, assistant-message errors, synchronized session status, and assistant-result fallback in that precedence order.

#### Scenario: Busy or retrying child
- **WHEN** synchronized child status is busy or retry
- **THEN** the child is running unless durable failure evidence exists

#### Scenario: Idle child without error
- **WHEN** synchronized child status is idle and no failure evidence exists
- **THEN** the child is successful

#### Scenario: Child session error
- **WHEN** a child emits `session.error` or contains an assistant-message error
- **THEN** the child is failed; `session.error` remains persisted until child pruning, while an assistant error remains reconstructible for as long as that message exists

#### Scenario: Child without synchronized status
- **WHEN** no current status is available
- **THEN** a completed error-free assistant result classifies the child as successful, while an in-progress assistant or a child without a completed result remains running

### Requirement: Duration and detail model
The system SHALL show a child title and compact duration in each entry row. An expanded entry SHALL show agent, status, time, model, and Open Session rows in the AGENTS.md order. Agent and model SHALL use fields from the single newest assistant message, then corresponding fields from the single newest user message, and SHALL fall back independently to `-` without scanning older assistant or user messages.

#### Scenario: Running duration
- **WHEN** a child is running
- **THEN** its duration advances from creation time on a one-second clock

#### Scenario: Successful duration
- **WHEN** a child is successful
- **THEN** its duration remains fixed at the nonnegative difference between updated and created timestamps

#### Scenario: Failed duration
- **WHEN** a child fails
- **THEN** its duration remains fixed at the nonnegative difference between the earliest retained event or assistant-message failure time and creation time

#### Scenario: One expanded entry
- **WHEN** the user expands one child and then expands another
- **THEN** only the second child detail block remains expanded

#### Scenario: Open child session
- **WHEN** the user activates Open Session for an expanded child
- **THEN** the TUI navigates to the `session` route with that child's session ID

#### Scenario: Missing child identity
- **WHEN** a child has no assistant or user message that supplies agent or model identity
- **THEN** the corresponding detail value renders `-`

### Requirement: AGENTS.md SubAgent layout
The system SHALL render a plain `SubAgent` panel matching the expanded, semi-collapsed, collapsed, Rest, and one-detail layouts, spacing, alignment, symbols, colors, ellipsis, dividers, maximum width, and no-trailing-whitespace rules in `AGENTS.md`.

```

Full source: openspec/changes/add-subagent-panel/specs/subagent-panel/spec.md
