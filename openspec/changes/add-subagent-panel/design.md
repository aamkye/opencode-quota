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

Add a `subagent` manifest key and standalone `tui/subagent.tsx` entry point immediately after SesTokens. The confirmed sidebar order is Home 1, Context 100, SesTokens 110, SubAgent 120, Quota 130, MCP 140, LSP 150, and TODO 160. Transformation and grouping logic will live in `tui/features/subagent.ts` and be exported through `shared/opencode-tools-shared.ts`. The component will reuse `CompactPanel` for the outer header/divider and focused row/detail components for nested expansion and width allocation. Compact entries reserve a fixed seven-cell, right-aligned `XXm XXs` duration box and a two-cell structural title margin, so a scrollbar can consume the spare gap rather than title/duration content. Expanded entries omit the duration box and wrap their complete title after the disclosure.

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

The outer collapsed summary renders successful/running/failed counts in that order. Entry rows omit status bullets. Compact durations and expanded `time` values use success, warning, and error theme roles. Names truncate with an end ellipsis after accounting for disclosure, duration, the required one-cell gap, and the measured title-region width; all rows avoid trailing cells. Interactive compact and expanded title text sets `selectable={false}` so clicking a row expands it without terminal text-selection highlighting. The Rest disclosure is muted. Its divider uses two muted three-dash segments with flexible space between them instead of a continuous border.

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
- **OpenTUI 0.4.x truncates in the middle and does not export its width helper** -> Declare `string-width` directly, use the proven flexible-left/fixed-right row pattern, end-truncate by grapheme-safe terminal cells, and retain native truncation only as a clipping safety net.

## Migration Plan

Add the new manifest/package entry and deploy it alongside existing managed plugins. No full-entry migration is needed; disclosure keys default to expanded outer panel, expanded Rest, and no entry details. Rollback removes the SubAgent plugin entry/artifact and leaves inert KV preferences that are safe to ignore.

## Open Questions

None. Empty-state copy, duration boundaries, stale layouts, retry behavior, and sidebar order are confirmed in the technical Design Doc and delta spec.
