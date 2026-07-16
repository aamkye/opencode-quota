# Task 3: Remove Model-Backed Deployment Paths

## Scope

- Branch: `feature/20260716/fix-token-command-hook`
- Language: en
- Edited: `deploy-plugins.mjs`, `tests/plugin-deploy.test.mjs`
- Removed: untracked `opencode-tools-tokens.ts` standalone server-plugin source
- Not edited: Comet/OpenSpec progress and task checklists, `.superpowers/sdd/task-4-report.md`, or old OpenSpec report deletions.

## Implementation

- Deployment copies only the shared and combined quota TUI artifacts.
- The legacy `plugins/opencode-tools-tokens.js` artifact is removed during cleanup alongside existing obsolete token paths.
- Deployment removes only the eight managed `tokens_*` keys from `opencode.json`.
- Unrelated `opencode.json` fields and commands remain unchanged. An empty `command` object is removed after all managed entries are deleted.
- Local and global deployment remain idempotent.

## TDD Evidence

1. RED: `node --test tests/plugin-deploy.test.mjs` failed before the cleanup implementation because deployment attempted to copy the removed `dist/plugins/opencode-tools-tokens.js` artifact (`ENOENT`).
2. GREEN: after removing the copy, adding legacy-artifact cleanup, and deleting managed command keys, the focused deployment suite passed all 5 tests.

## Verification

- `node --test tests/plugin-deploy.test.mjs`: passed, 5/5 tests.
- `npm test`: passed, 224/224 tests.
- `npm run typecheck`: passed.
- `npm run build`: passed; emitted only `dist/opencode-tools-shared.js` and `dist/opencode-tools-quota.js`.
- `npm run deploy:local`: passed; deployed to `.opencode`.
- `opencode debug config`: available and exited successfully. It showed the effective configuration without managed `tokens_*` command entries.

The test suite also verifies native token slash handlers and token-report routes operate without a model client. The combined TUI artifact owns this route behavior; deployment no longer installs a server token plugin or declarative token commands.

## CLI Limitation

`opencode debug config` validates effective configuration only. It cannot invoke native `/tokens*` commands, open token-report routes, or demonstrate the absence of model activity. Those behaviors are covered by automated native-route tests; interactive confirmation requires restarting the OpenCode TUI and invoking the commands.

## Risks And Concerns

- The eight reserved `tokens_*` names are intentionally removed even if a user configured them manually, because they are managed legacy entries under this migration.
- Automated verification does not perform an interactive OpenCode TUI restart; manual UI validation remains the final environment-level check.

## Review Follow-Up: Global Deployment Coverage

### RED/GREEN Evidence

1. RED intent: expanded the global XDG deployment fixture with a stale `plugins/opencode-tools-tokens.js` artifact, all eight managed `tokens_*` commands, and unrelated `opencode.json` configuration and commands.
2. Focused result: `node --test tests/plugin-deploy.test.mjs` passed 5/5 on the first run. This did not establish a production defect because the existing cleanup implementation already removes the global artifact and managed commands while preserving unrelated configuration.
3. GREEN: the expanded global test snapshots the complete deployed fixture, including `tui.json`, `opencode.json`, deployed artifacts, and an unrelated plugin, then proves the second deployment is byte-for-byte identical.

### Changed Files

- `tests/plugin-deploy.test.mjs`: seed and assert global stale-artifact cleanup, managed-command cleanup, unrelated configuration preservation, and whole-fixture idempotency.
- `.superpowers/sdd/fix-token-command-hook-task-3-report.md`: record this review follow-up.

### Tests

- `node --test tests/plugin-deploy.test.mjs`: passed, 5/5 tests.
- `npm test`: passed, 224/224 tests.

### Commit

- `test(deploy): cover global token cleanup`

### Concerns

- No production change was made because the expanded test passed immediately against the existing cleanup behavior.
