# Task 5 Review Fixes

## Scope

Resolve the Task 5 provider-adapter review findings only for
`refactor-opencode-tools-tui`:

- Share the provider adapter contract and discriminated compact-home summary.
- Expose provider freshness and keep unavailable or stale OpenAI usage out of
  the legacy compact home output.
- Cover provider reactivity, stale expiry, reset refresh, JWT account headers,
  and `reset_at` precedence.

## TDD Evidence

- RED: `node tests/compile-presentation.mjs && node --test tests/provider-zai.test.mjs tests/provider-openai.test.mjs` failed because neither adapter exposed `freshness`. The initial reset-boundary assertion also revealed that the test needed to settle the adapter's initial reactive fetch before measuring requests; that harness correction was made before production code changed.
- GREEN: `node tests/compile-presentation.mjs && node --test tests/provider-zai.test.mjs tests/provider-openai.test.mjs` passed 22 tests after the shared contract and fresh-only home accessors were added.

## Implementation Notes

- `tui/providers/types.ts` owns `QuotaProviderAdapter`, its `ProviderFreshness` accessor, and the `Z.AI` / `OpenAI` compact-home summary union.
- Both adapters expose normalized freshness. Z.AI maps its heuristic and rate-limited panel-only states to unavailable compact-home freshness.
- Home summaries are only available during `ready`; cached stale data remains in each semantic panel but does not reappear in the legacy compact home slot.
