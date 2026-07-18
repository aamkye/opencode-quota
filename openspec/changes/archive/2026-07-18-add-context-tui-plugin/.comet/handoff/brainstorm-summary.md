# Brainstorm Summary

- Change: add-context-tui-plugin
- Date: 2026-07-18

## Confirmed Technical Approach

- Use `api.state.session.messages(sessionID)` and `api.state.provider` from the installed TUI API.
- Resolve the newest token-bearing assistant message, sum its input, output, reasoning, cache-read, and cache-write buckets, and divide by `provider.models[modelID].limit.context`.
- Preserve OpenCode's raw rounded usage result rather than clamping at 100%, so context overflow remains visible.
- Sum assistant-message `cost` values for session spend.
- Default to expanded when no persisted collapse preference exists, matching LSP and TODO.
- Implement a pure model in `tui/features/context.ts` and a thin Solid plugin component in `tui/context.tsx`; do not route the feature through the quota-oriented generic renderer or inline all derivation in JSX.
- The model uses narrow SDK-derived inputs, sums every assistant-message cost, selects the newest assistant with a positive detailed-bucket total, resolves the associated provider/model context limit, and returns formatted values plus the collapsed summary.
- The component tracks `sidebar_content`'s `session_id` and reads reactive `api.state.session.messages(sessionID)` plus `api.state.provider` inside a Solid memo; no manual event subscription or fetch is required.
- Rendering reuses `CompactPanel` with a local metric-row component, starts expanded, persists `aamkye.opencode-tools-context.collapsed`, uses standard arrows/dividers, and keeps values right-anchored within 37 columns.
- Format token limits with the existing compact count helper, spend with two-decimal USD formatting, and usage as an unclamped rounded percentage. Treat malformed or missing metrics as confirmed placeholders/zero cost.
- Package `context` as a standalone plugin and assign deterministic sidebar orders MCP 111, Context 112, LSP 113, and TODO 114.

## Key Trade-offs and Risks

- Raw usage can exceed 100%, but accurately represents OpenCode's context calculation and remains compatible with the compact layout.
- SDK metadata can be absent; the model must return confirmed placeholders instead of throwing.

## Testing Strategy

- Confirmed: TDD pure model tests cover detailed bucket totals, newest-message selection, compaction, cost aggregation, exact formatting, usage overflow, and absent/malformed metadata.
- Confirmed: mounted Solid tests cover expanded/collapsed output, KV persistence, session/message/provider reactivity without remount, dividers, right-aligned 37-column rows, and cleanup.
- Confirmed: type, manifest, build, and deployment tests cover the TUI API contract and standalone plugin packaging.

## Spec Patches

- Add an acceptance scenario requiring usage percentages above 100% to remain visible rather than clamped.

## Pending

None. The user confirmed the complete technical design on 2026-07-18.
