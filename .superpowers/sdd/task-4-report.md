# Task 4 Report

Change: `refactor-opencode-tools-tui`

## Status

Implemented only Task 4's Z.AI semantic provider adapter. The change adds `createZaiProvider(api)` with reactive panel and home-summary accessors, credential lookup, quota conversion, polling, stale expiry, SGT and session-message reset fallbacks, and reset-boundary refresh scheduling. The adapter returns semantic presentation data and imports no OpenTUI component helpers.

## RED Evidence

Command:

```sh
node tests/compile-presentation.mjs && node --test tests/provider-zai.test.mjs
```

Result: failed before implementation with `Could not resolve "tui/providers/zai.ts"`. The compiler harness had already registered the adapter entry point, so this failure proved the focused tests depended on the missing Task 4 module.

## GREEN Evidence

Focused verification:

```sh
node tests/compile-presentation.mjs && node --test tests/provider-zai.test.mjs
```

Result: 7 passing tests covering ready, loading, unavailable, stale, unused-full, exhausted, reset-boundary, peak/off-peak, semantic values, framework-only output boundaries, and selected-provider refresh outside a component.

Type verification:

```sh
npm run typecheck
```

Result: exit 0.

Regression verification:

```sh
npm test
```

Result: 67 passing tests, 0 failures.

## Scope

- Added `tui/providers/zai.ts` and focused adapter tests.
- Added the provider entry to the presentation compiler and TypeScript include list.
- Did not add aggregate registration, OpenAI work, rebranding, documentation, OpenSpec changes, or plan changes.

## Risk Signals

- The adapter schedules reset-boundary refreshes from the 5H reset epoch. The focused suite asserts the expired boundary model state; live OpenCode timing remains a Task 6/8 integration check.
- The focused compiler selects Solid's browser export for the provider entry. The Node-targeted default selected Solid's server export, where `createEffect` is a no-op and cannot validate adapter reactivity.
- The adapter exports `QuotaProviderAdapter` from the Z.AI module because Task 4 has no shared provider-contract module. Task 5 can import this type until a later task introduces a provider-neutral home for it.

## Concerns

No test or typecheck failures remain. The existing legacy Z.AI plugin still owns its old slot registration until Task 6 composes the new adapter and Task 7 retires legacy entries.
