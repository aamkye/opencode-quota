# Task 2 Report: Compose Token Reports Into the Combined TUI Artifact

## Scope

Composed the native token-report TUI registration into the quota artifact. The build now produces only the shared facade and the combined quota/home/token-report TUI artifact. The legacy server token entry is deleted from the tracked project.

## Changed Files

- `build-plugins.mjs`
  - Imports and registers `registerTokenReportTui(api)` after quota and home setup.
  - Removes the standalone token esbuild target and returns only `shared` and `quota`.
  - Removes a stale `dist/plugins/opencode-tools-tokens.js` file before each build.
- `tests/plugin-build.test.mjs`
  - Expects exactly the shared and combined TUI artifacts.
  - Requires `tui/token-report.tsx` in the combined build metafile.
  - Verifies no standalone server artifact or `server` export remains.
  - Verifies combined activation registers the token keymap layers and route.
- `tests/shared-boundary.test.mjs`
  - Treats `tui/token-report.tsx` as the loadable token entry.
  - Verifies it uses only the shared computation facade and contains no model, session-prompt, or history path.
- `opencode-tools-tokens.ts`
  - Deleted from the tracked project in the code commit.

The working copy of `opencode-tools-tokens.ts` remains untracked after the commit so the user-attributed later server-hook changes are preserved. It is not built or committed by this task.

## RED Evidence

Command:

```sh
node tests/compile-presentation.mjs && node --test tests/plugin-build.test.mjs
```

Result: failed as expected after changing artifact expectations.

- `build:plugins emits the exact minified ESM artifact layout`: actual build results were `['quota', 'shared', 'tokens']`, expected `['quota', 'shared']`.
- `combined TUI entry keeps an explicit relative import to the shared artifact`: `dist/plugins/opencode-tools-tokens.js` still existed.
- `shared owns computation while loadable entries contain presentation and registration only`: the quota metafile did not include `tui/token-report.tsx`.
- `artifacts expose OpenCode Go only through shared computation`: actual build results still included `tokens`.

After importing the missing `existsSync` test helper, the same command produced the expected RED result: 4 failed, 4 passed, 0 test errors.

## GREEN Evidence

Command:

```sh
node tests/compile-presentation.mjs && node --test tests/plugin-build.test.mjs tests/shared-boundary.test.mjs
```

Result: passed. `12` tests passed, `0` failed.

## Full Suite

Command:

```sh
npm test
```

Result: `220` passed, `3` failed.

All failures are preserved later-task deployment code attempting to copy the intentionally removed standalone artifact:

- `tests/plugin-deploy.test.mjs`: local deployment idempotence
- `tests/plugin-deploy.test.mjs`: root and selected `.opencode` merge
- `tests/plugin-deploy.test.mjs`: XDG global deployment

Each fails with `ENOENT` copying `dist/plugins/opencode-tools-tokens.js` from `deploy-plugins.mjs:154`. No deployment or server-hook source was modified in this task.

## Commit

- `08f08a3 fix(build): compose token report into quota tui`

## Concerns And Risk Signals

- Full-suite deployment coverage remains red until the later deployment task removes its standalone artifact copy path.
- The preserved later server-hook file is intentionally untracked after this task's tracked deletion; do not delete or stage it with this task.
- `npm test` emitted npm's existing `allow-scripts` configuration deprecation warning and Node's experimental SQLite warning. Neither caused a focused-test failure.
