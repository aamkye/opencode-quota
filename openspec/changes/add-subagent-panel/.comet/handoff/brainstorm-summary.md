# Brainstorm Summary

- Change: add-subagent-panel
- Date: 2026-07-19
- Status: confirmed

## Confirmed Technical Approach

- Build a standalone SubAgent TUI plugin around a pure model, a child-session source, shared exports, and a thin Solid panel using `CompactPanel`.
- Show only direct children of the viewed session, newest first, with the newest five outside an independently collapsible Rest group.
- Preserve and incorporate the user-authored manifest ordering scheme, placing SubAgent immediately after SesTokens at 120 and shifting Quota/MCP/LSP/TODO to 130/140/150/160.
- Preserve and incorporate the user-authored README inspiration links and table formatting, then extend the same document with SubAgent installation and architecture details during integration.
- Reuse only neutral session utilities from SesTokens; do not depend on the SesTokens panel being active.
- Use SubAgent slot order 120, with Quota/MCP/LSP/TODO shifted to 130/140/150/160.
- Derive each detail identity field from the single newest assistant message, then the corresponding field on the single newest user message, and finally `-`; do not scan older messages.
- Render muted `No subagents` body content when an expanded panel has no direct children; the collapsed summary remains `0/0/0`.
- Use a direct-child snapshot source: list sessions, select exact direct children, fetch only their messages through a shared four-request limiter, combine synchronized status and retained failures, and publish only a current-generation complete snapshot.
- Reconstruct all direct children, sort newest-first by creation time and ID, render only the latest five in the primary group, and place every older child under Rest; omit Rest entirely for five or fewer children.
- Produce no panel output before the first complete snapshot, both while loading and after initial retries are exhausted. After a background refresh failure, retain the last complete entries and add warning `stale` to expanded and collapsed headers.
- Retry failed snapshots after 2, 4, and 8 seconds before publishing unavailable or stale state.
- Keep source phases explicit as `loading`, `unavailable`, `ready`, and `stale`; ready and stale always contain complete snapshots.
- Classify status by retained or message failure, synchronized busy/retry, synchronized idle, then assistant-result fallback.
- Persist the first observed `session.error` timestamp plus parent-scoped disclosure state; prune stale failures and expanded child IDs during reconstruction. Assistant-message failure evidence lasts only while that message exists.
- Derive running duration from the current one-second visible-row clock, successful duration from session updated minus created, and failed duration from failure/completion minus created, clamped to zero.
- Render one expanded child detail at a time and navigate through `route.navigate("session", { sessionID })`.

## Key Trade-offs and Risks

- Status and duration reconstruction must combine synchronized state, message evidence, lifecycle events, and minimal persisted failure terminals without persisting whole entries.
- The installed SDK `Session` type has title, parent, and timestamps but no agent/model fields; detail identity must be reconstructed from child messages.
- The public TUI API confirms `state.session.status(sessionID)` and built-in navigation via `route.navigate("session", { sessionID })`.
- Client list/message adapters must reject defined errors or absent data and must not treat failures as empty snapshots.
- The host client does not expose transport cancellation for already-started requests, so generation guards and bounded work must prevent stale publication and new obsolete work.
- The manifest reorder affects existing plugin-order tests and deployment expectations and must land atomically with SubAgent integration.
- A retained `session.error` keeps a child failed until deletion or parent mismatch. Assistant-message failure lasts only while that evidence exists.
- Successful duration uses session `time.updated`, which may slightly overstate work if metadata changes after idle; this avoids persisting complete histories.
- Older direct children remain reconstructed in memory even while Rest is collapsed so counts, cleanup, and later expansion stay correct.
- The first relevant event immediately invalidates in-flight work before the 200 ms debounce; unavailable state can recover on a later relevant event.

## Testing Strategy

- Use TDD for pure grouping/status/duration logic, child-source lifecycle and race behavior, mounted layouts/interactions, local type declarations, and standalone integration.
- Preserve exact 37-cell AGENTS.md layouts and add no-trailing-whitespace assertions.
- Cover direct-only requests, deterministic ties, reverse completion, event-during-initial-load, shared cross-generation concurrency, retry/stale recovery, session switches, disposal, and failure pruning.
- Cover all expanded, semi-collapsed, collapsed, Rest, detail, empty, loading, unavailable, and stale layouts plus interaction persistence, conditional clock ownership, and Open Session navigation.
- Cover the complete accepted manifest order, package/shared/runtime/type wiring, independent build/deploy behavior, README changes, and bundle source-import boundaries.

## Spec Patches

- Record the accepted order `Home 1, Context 100, SesTokens 110, SubAgent 120, Quota 130, MCP 140, LSP 150, TODO 160` in integration acceptance text.
- Clarify newest-assistant, then newest-user, then `-` identity fallback.
- Specify muted `No subagents` for a complete empty snapshot and no output for initial loading or unavailable states.
- Add expanded and collapsed stale-header plus stale-recovery scenarios.
- Require 200 ms debounce, a shared four-request bound, 2/4/8 retries, generation cancellation, and complete-only publication.
- Update OpenSpec `design.md` to replace the superseded "after existing sidebar panels" ordering statement.
- Add matching stale layouts to the AGENTS.md SubAgent contract; loading and unavailable states have no layout because they produce no output.
