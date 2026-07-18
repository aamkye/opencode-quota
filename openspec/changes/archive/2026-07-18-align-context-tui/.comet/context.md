# Comet Design Handoff

- Change: align-context-tui
- Phase: design
- Mode: compact
- Context hash: 20c861752a7bf5a05cff4f379f6a74f2241b196981d7abc9c8cbef3ca1994c7e

Generated-by: comet-handoff.sh

OpenSpec remains the canonical capability spec. This handoff is a deterministic, source-traceable context pack, not an agent-authored summary.

## openspec/changes/align-context-tui/proposal.md

- Source: openspec/changes/align-context-tui/proposal.md
- Lines: 1-25
- SHA256: 7bc0248e8eb1f5549ad708415aac4a01645026c7d5f9e15f3abbc5b6e55043c3

```md
## Why

The Context sidebar implementation no longer matches the layout contract in `AGENTS.md`: it labels the model context limit as `Tokens`, omits actual token usage and the `Limit` row, and does not apply the required usage or zero-cost colors. This makes the panel misleading and leaves documented behavior unimplemented.

## What Changes

- Separate the model context limit from the current session token count.
- Render the expanded Context panel as `Limit`, `Tokens`, `Used`, and `Spent`.
- Color the collapsed usage summary green below 40%, yellow from 40% through 60%, and red above 60%.
- Mute the zero-cost `Spent` value.
- Align Context documentation and regression coverage with the canonical TUI layout.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. The behavior is already specified by the repository's canonical TUI layout rules.

## Impact

The change affects the Context feature model and sidebar presentation, its focused model and mounted tests, and the README layout example. It does not change plugin exports, host APIs, persistence keys, or configuration.

```

## openspec/changes/align-context-tui/design.md

- Source: openspec/changes/align-context-tui/design.md
- Lines: 1-32
- SHA256: 4f12a3fe8e9e5d378f72bf6bccbe01f3a29843d44998ed96463d7e881fb08620

```md
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

```

## openspec/changes/align-context-tui/tasks.md

- Source: openspec/changes/align-context-tui/tasks.md
- Lines: 1-11
- SHA256: 0870bebfea7bb773e26d811f1f7691d7359251c09766913d0a06d1abafc43238

```md
## 1. Regression Coverage

- [x] 1.1 Add focused model, mounted presentation, and documentation contract tests for separate limit/token values, four expanded rows, usage color thresholds, and muted zero spend; confirm the tests fail for the missing behavior.

## 2. Context Presentation Fix

- [ ] 2.1 Extend the Context model and presentation to render the canonical values and statuses, and align the README example with `AGENTS.md`.

## 3. Verification

- [ ] 3.1 Run focused Context tests, type checking, the full test suite, and the plugin build.

```
