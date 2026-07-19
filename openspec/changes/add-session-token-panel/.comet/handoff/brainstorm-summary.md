# Brainstorm Summary

- Change: add-session-token-panel
- Date: 2026-07-19
- Status: confirmed

## Confirmed Technical Approach

- Follow the repository's standalone manifest plugin, pure feature model, shared facade, `defineTuiPlugin`, and thin `CompactPanel` conventions.
- Aggregate the viewed session and its full descendant tree from assistant messages, including turns, input, output, reasoning, cache read, and cache write.
- Use event-driven debounced refreshes, bounded request concurrency and retries, generation guards, and last-complete-snapshot retention.
- Use one directory-wide `session.list` topology snapshot, traverse the active subtree locally, and fetch subtree messages with concurrency four; publish the generation only after every request succeeds.
- Persist only collapse state.
- After an initial load exhausts retries with no complete snapshot, render muted `Usage unavailable` rather than zero or indefinite loading values.
- After a later refresh failure, retain the last complete values and expose yellow `stale`: right-aligned in the expanded header and before the collapsed token summary, matching Quota's status treatment.
- Separate neutral session-tree snapshot helpers, the pure SesTokens model, a stateful SesTokens refresh source, and the thin Solid panel; SubAgent may later reuse only the neutral helper.
- On session switch, invalidate and clear the previous session snapshot immediately before loading the new target.
- Debounce relevant session/message events by 200 ms; use one initial request plus three retries after 2 s, 4 s, and 8 s; cancel all pending work on generation change or disposal.
- Extend `CompactPanel` with an optional typed header detail; stale uses warning detail in both states, before the collapsed metric summary.
- Render all ready metric rows even at zero; loading and unavailable use muted body/header summaries without fabricated totals.
- Use existing `formatCount`; cache ratio is one decimal with `×`, `∞` for a zero denominator with reads, and `-` for all-zero input/write/read.

## Key Trade-offs and Risks

- Directory snapshots read unrelated session metadata, but avoid recursive topology round trips and produce a coherent parent index reusable by the later SubAgent change.
- Session event ordering and partial request failures must not publish stale or incomplete totals.
- A stale indicator intentionally extends the current AGENTS.md SesTokens layout while preserving every body row and the 37-column limit.
- Conservative retries delay initial unavailable feedback by roughly 14 seconds; existing complete values remain visible throughout retries.
- All-or-nothing publication can retain older totals longer when one subtree request repeatedly fails, but never exposes partial usage.

## Testing Strategy

- Pure model tests cover malformed values, assistant-only turns, arithmetic, formatting, ratio boundaries, and summaries.
- Neutral snapshot tests cover indexing, deep/cyclic trees, unrelated sessions, concurrency four, and all-or-nothing failure.
- Injected source tests cover debounce/retry schedules, event relevance, supersession, switching, disposal, unavailable, stale retention, and recovery.
- Shared CompactPanel and SesTokens mounted tests cover detail placement, exact 37-column ready/fallback/stale layouts, persistence, registration, and cleanup.
- Type, manifest, package, shared-facade, build, deployment, managed-artifact, and full-suite verification complete the contract.

## Spec Patches

- Make the initial exhausted-retry fallback explicitly require muted `Usage unavailable`.
- Add yellow stale-status behavior for failed refreshes after a complete snapshot, with the confirmed expanded and collapsed header placement.
- Add stale-to-ready recovery and muted collapsed loading/unavailable summary scenarios.
