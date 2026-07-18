---
comet_change: align-context-tui
role: technical-design
canonical_spec: openspec
---

# Align Context TUI Design

## Context

The Context plugin renders session context usage through `tui/context.tsx` and derives its display values in `tui/features/context.ts`. `createContextPanelModel` currently places the model context limit in a field named `tokens`, omits the consumed token count, and returns no color status. The JSX can therefore render only `Tokens`, `Used`, and `Spent`, with no way to meet the canonical layout and color rules in `AGENTS.md`.

The plugin already has stable behavior that this change must preserve:

- It sums finite costs from assistant messages.
- It uses the newest assistant message with a positive detailed token total after compaction.
- It includes input, output, reasoning, cache-read, and cache-write buckets.
- It reacts to session, message, and provider changes without remounting.
- It persists collapse state under `aamkye.opencode-tools-context.collapsed`.
- It fits the 37-cell sidebar without trailing whitespace.

## Scope

The change aligns the Context model, mounted presentation, `AGENTS.md`, README, and focused regression tests. It does not change plugin registration, exports, host APIs, persistence, token collection, or provider lookup.

## Model Design

`ContextPanelModel` will expose these presentation values:

```typescript
type ContextPanelModel = {
  limit: string
  tokens: string
  used: string
  spent: string
  summary: string
  usageStatus?: PanelStatus
  spentStatus?: PanelStatus
}
```

`createContextPanelModel` will keep the current message scan and cost accumulation. Once it finds the newest positive-token assistant message, it will format that token total with `formatCount(tokens, 2)`.

Provider and model metadata determine the remaining values:

- A finite positive context limit renders through the existing default `formatCount` precision.
- The model rounds `(tokens / limit) * 100` to produce `used` and `summary`. Values above 100 remain visible.
- Percentages below 40 use `success`, percentages from 40 through 60 use `warning`, and percentages above 60 use `error`.
- Missing or invalid limit metadata leaves `limit`, `used`, and `summary` as `-`, but preserves known `tokens` and accumulated `spent`.
- No positive-token assistant message renders `limit`, `tokens`, `used`, and `summary` as `-`.
- An accumulated cost of exactly zero sets `spentStatus` to `textMuted`; nonzero costs have no explicit spend status.

The model owns these rules because it already owns Context display formatting. This keeps the JSX declarative and avoids a wider raw-data refactor.

## Presentation Design

`ContextMetricRow` will accept an optional `status` and `theme` accessor. It will apply the corresponding foreground color to the right-aligned value only. Labels remain normal text, including the `Spent` label when its `$0.00` value is muted.

The expanded panel will render four rows in this order:

1. `Limit`
2. `Tokens`
3. `Used`
4. `Spent`

`Used` receives `usageStatus`, and `Spent` receives `spentStatus`. The collapsed `CompactPanel` summary uses the same `usageStatus`, so expanded and collapsed percentages share the exact threshold behavior. An unavailable summary remains uncolored.

No layout primitive changes are needed. Existing flex behavior keeps labels shrinkable, values fixed and right-aligned, and rendered rows within 37 cells.

## Documentation

`AGENTS.md` remains the canonical TUI contract. Its Context section will state that the expanded `Used` value and collapsed summary use the same thresholds, and that only the `$0.00` value is muted. The README example will use the canonical `Limit 500K`, `Tokens 322.12K`, `Used 64%`, and `Spent $0.00` rows.

## Error And Edge Cases

- Non-finite token buckets and costs continue to contribute zero.
- Zero-token assistant messages do not replace the latest positive post-compaction message.
- Missing provider, model, or context-limit data preserves the known token total.
- Usage overflow remains visible and receives `error` status.
- Exact boundaries are success at 39%, warning at 40% and 60%, and error at 61%.
- Empty sessions do not trigger a host message lookup for an empty session ID.

## Test Strategy

The existing red tests establish the regression before production edits. Build work will add any missing expanded-color assertion before implementation, then make the smallest production changes needed to pass.

Focused model tests will verify separate limit and token values, compact precision, partial data, non-finite inputs, overflow, zero spend, and threshold boundaries. Mounted tests will verify row order, expanded and collapsed colors, muted zero-spend value, reactive session/provider changes, collapse persistence, and 37-cell alignment. Documentation contract tests will compare README and `AGENTS.md` examples. Final verification will run focused tests, TypeScript type checking, the full test suite, and the plugin build.

## Alternatives Considered

Returning raw numeric context data would create a cleaner domain model, but it would move formatting and status rules into JSX and expand the refactor. Migrating Context to the generic `PanelModel` renderer would improve architectural uniformity at the cost of touching shared presentation behavior. Extending the current model fixes the semantic boundary with less regression risk.
