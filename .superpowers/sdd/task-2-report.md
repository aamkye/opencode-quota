# Task 2 Implementation Report

## Implementation Details

Implemented `defineTuiPlugin()` in `tui/runtime/plugin.ts` as the shared standalone activation wrapper for TUI features. Each activation now owns one memoized cleanup promise, `context.onCleanup()` registers cleanup callbacks in acquisition order, the activation return value is appended after activation resolves, host disposal drains the stack in LIFO order, and repeated disposal reuses the same promise so cleanup work is not repeated. Activation and registration failures drain all acquired cleanup callbacks while preserving the original failure over any cleanup errors. Successful cleanup preserves the first cleanup error encountered while still draining the full stack. Pre-aborted host lifecycles unregister immediately after registration and then clean synchronously through the same cleanup path.

Updated `shared/opencode-tools-shared.ts` to export the new runtime contract and the manifest helpers exactly as required. Updated `tests/compile-presentation.mjs` to precompile `tui/runtime/plugin.ts` into `.tmp-test/plugin-runtime.mjs`, and added `tests/plugin-runtime.test.mjs` covering descriptor/module shape, LIFO cleanup order, idempotent disposal, activation rollback, cleanup-error preservation, and pre-aborted lifecycle handling.

## RED Command

`node tests/compile-presentation.mjs && node --test tests/plugin-runtime.test.mjs`

Verified failing state after fixing the missing-entry setup issue: `SyntaxError: The requested module '../.tmp-test/plugin-runtime.mjs' does not provide an export named 'defineTuiPlugin'`.

## GREEN Command

`node tests/compile-presentation.mjs && node --test tests/plugin-runtime.test.mjs tests/shared-boundary.test.mjs`

Passing summary: 8 tests, 8 passed, 0 failed.

## Changed Files

- `tui/runtime/plugin.ts`
- `shared/opencode-tools-shared.ts`
- `tests/plugin-runtime.test.mjs`
- `tests/compile-presentation.mjs`

## Commit

`c2cc265` `feat: add standalone TUI activation runtime`

## Self-Review

- Confirmed cleanup is async-capable, idempotent, exhaustive, and LIFO.
- Confirmed activation and registration failures preserve the original thrown error over cleanup failures.
- Confirmed the shared facade still has no default export or plugin registration through `tests/shared-boundary.test.mjs`.
- Kept the implementation minimal: one runtime helper, no extra adapters or compatibility layers.

## Concerns

No known functional concerns after the focused and regression test runs.

## Risk-Signal Assessment

- cross-module change: YES — adds a new runtime module and shared facade exports consumed across plugin code.
- security-sensitive input/secrets: NO — no secret handling or input parsing added.
- concurrency/shared mutable state: NO — cleanup state is per activation and covered by idempotent disposal tests.
- data/schema migration: NO — no persisted data or schema changes.
- public API/external interface: YES — exports new shared runtime/types and manifest helpers.
- DONE_WITH_CONCERNS: NO
- diff over 200 lines: YES — committed diff is 201 changed lines.

## Review-Fix Round 1

Added targeted coverage for the missing host-registration failure branch and an async cleanup path in `tests/plugin-runtime.test.mjs`. No production change was needed after verification; `tui/runtime/plugin.ts` already preserved the original registration error while draining cleanup callbacks.

### RED Command

`node tests/compile-presentation.mjs && node --test tests/plugin-runtime.test.mjs`

### RED Output Summary

`✖ defineTuiPlugin rolls back registered cleanups and rethrows the activation error`

`✖ defineTuiPlugin drains async cleanups when host registration fails`

`ℹ tests 5`

`ℹ pass 3`

`ℹ fail 2`

### GREEN Command

`node tests/compile-presentation.mjs && node --test tests/plugin-runtime.test.mjs tests/shared-boundary.test.mjs`

### GREEN Output Summary

`ℹ tests 9`

`ℹ pass 9`

`ℹ fail 0`

### Review-Fix Files

- `tests/plugin-runtime.test.mjs`
- `.superpowers/sdd/task-2-report.md`
