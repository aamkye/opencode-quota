# Outcome

`npm run deploy:local` and `npm run deploy:global` build and install the
session-rename plugin alongside the TUI plugins. The standalone
`deploy:session-rename` npm script and `deploy-session-rename.mjs` are removed.

# Scope

- Integrate session-rename build + copy + legacy cleanup into
  `deploy-plugins.mjs`'s `deployPlugins()` function.
- Export `buildSessionRename()` from `build-session-rename.mjs` so
  `deploy-plugins.mjs` can call it.
- Remove `deploy-session-rename.mjs`.
- Remove the `deploy:session-rename` script from `package.json`.
- Update `tests/session-rename-deploy.test.mjs` to test through
  `deployPlugins()` instead of the deleted script.
- Update `tests/plugin-wiring.test.mjs` README assertions.
- Update README session-rename section.
- Update `okf_bundle/SUMMARY.md` if it references `deploy-session-rename.mjs`.

# Non-goals

- Not changing session-rename plugin behavior or the build output.
- Not removing `build-session-rename.mjs` or `build:session-rename` script.
- Not changing the TUI plugin deploy logic.

# Acceptance examples

- `npm run deploy:local` copies `session-rename.ts` to
  `.opencode/plugins/session-rename.ts` and removes legacy
  `session-title.ts`.
- `npm run deploy:global` copies `session-rename.ts` to
  `~/.config/opencode/plugins/session-rename.ts` and removes legacy
  `session-title.ts`.
- `npm run` no longer lists `deploy:session-rename`.
- `deploy-session-rename.mjs` no longer exists.

# Constraints and invariants

- Session-rename artifact is built by `build-session-rename.mjs` logic.
- `npm test` passes.

# Decisions

- Keep `build-session-rename.mjs` and `build:session-rename` script.
- Export a reusable `buildSessionRename()` function.

# Open questions

_None._

# Verification expectations

- `npm test` passes.
- Deploy tests verify session-rename artifact is copied to the target plugins
  directory.
