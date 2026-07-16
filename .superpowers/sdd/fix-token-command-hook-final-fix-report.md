# Final Review Fix Report: token command hook

Date: 2026-07-16
Branch: `feature/20260716/fix-token-command-hook`

## Scope

Address the two final-review findings only:

- During local deployment, remove managed `tokens_*` commands from the project-root `opencode.json` as well as `.opencode/opencode.json`, while retaining unrelated configuration.
- Remove the deleted `opencode-tools-tokens.ts` from `tsconfig.json` and include `tui/token-report.tsx`.

## TDD Evidence

### RED

After extending the existing root-plus-`.opencode` deployment test with a project-root `opencode.json`, ran:

```text
node --test tests/plugin-deploy.test.mjs
```

Result: 4 passed, 1 failed. The failing test was `local deployment merges root and selected .opencode configs without duplicate managed plugins`. Its assertion showed every managed command (`tokens_today`, `tokens_daily`, `tokens_weekly`, `tokens_monthly`, `tokens_all`, `tokens_session`, `tokens_session_all`, and `tokens_between`) still present in the project-root `opencode.json`; the expected value retained only the unrelated command.

### Implementation

- `deploy-plugins.mjs` now reads an existing project-root `opencode.json` during local deployment, removes only the managed token commands, and writes it back. A missing root config remains absent.
- `tests/plugin-deploy.test.mjs` seeds root configuration with unrelated formatter and command fields plus all managed token commands, then asserts preservation and cleanup.
- `tsconfig.json` replaces the removed token server entry with `tui/token-report.tsx`.

### GREEN

```text
node --test tests/plugin-deploy.test.mjs
```

Result: 5 passed, 0 failed.

```text
npm run typecheck
```

Result: exited 0. `tsc --noEmit` completed successfully and validates `tui/token-report.tsx` through the explicit include list.

```text
npm test
```

Result: 224 passed, 0 failed, 0 skipped, 0 todo.

## Notes

- `npm` emitted its pre-existing environment warning: `Unknown user config "allow-scripts". This will stop working in the next major version of npm.` It did not affect command exit status.
- No Comet or OpenSpec task files were changed.
