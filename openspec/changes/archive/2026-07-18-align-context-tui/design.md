## Context

The Context feature derives presentation-ready strings from the newest positive-token assistant message and renders them directly through a dedicated `CompactPanel`. The current model conflates context capacity with consumed tokens and carries no status metadata, so the presentation cannot satisfy the canonical `AGENTS.md` layout or color rules.

## Goals / Non-Goals

**Goals:**

- Represent context limit and consumed tokens independently.
- Keep percentage and spend formatting in the feature model.
- Give the presentation enough status metadata to color the collapsed summary and mute zero spend.
- Preserve existing session selection, token bucket aggregation, collapse persistence, and 37-cell alignment behavior.

**Non-Goals:**

- Changing how OpenCode reports token buckets, costs, providers, or model limits.
- Introducing configuration or changing the Context plugin's public export or storage key.
- Moving the Context plugin onto the generic quota panel renderer.

## Decisions

- Extend `ContextPanelModel` with separate `limit` and `tokens` strings. This fixes the semantic error at the model boundary rather than relabeling an incorrect value in JSX.
- Format consumed tokens with two compact decimal places and limits with the existing default compact precision, matching the canonical examples while reusing presentation formatting.
- Derive a usage status from the numeric percentage before formatting: success below 40, warning from 40 through 60, and error above 60. Reuse that status for the collapsed summary.
- Mark spend as muted only when the accumulated finite cost is exactly zero. Pass row status through `ContextMetricRow` so the renderer remains a small declarative view.
- Update focused model, mounted presentation, and README contract tests first, then make the smallest production changes needed to pass them.

## Risks / Trade-offs

- [Risk] Two-decimal compact token formatting may produce longer values than before. -> Existing flexible labels and fixed value cells keep every row within 37 cells, covered by mounted tests.
- [Risk] Boundary colors could drift from the prose. -> Add explicit tests for 39%, 40%, 60%, and 61%.
- [Risk] Missing provider limits could hide known token usage. -> Preserve placeholders for limit-dependent usage because no percentage can be computed reliably without a valid limit.
