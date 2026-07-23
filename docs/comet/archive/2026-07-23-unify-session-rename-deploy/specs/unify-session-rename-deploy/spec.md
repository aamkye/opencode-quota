# unify-session-rename-deploy

`deployPlugins()` builds and installs the session-rename plugin alongside the
TUI plugins. The standalone `deploy:session-rename` script and
`deploy-session-rename.mjs` are removed.

## Scenario: deploy:local installs session-rename

**Trigger:** `npm run deploy:local` is executed.

**Result:** `session-rename.ts` is built and copied to
`.opencode/plugins/session-rename.ts`. Legacy `session-title.ts` is removed from
`.opencode/plugins/`.

## Scenario: deploy:global installs session-rename

**Trigger:** `npm run deploy:global` is executed.

**Result:** `session-rename.ts` is built and copied to
`~/.config/opencode/plugins/session-rename.ts`. Legacy `session-title.ts` is
removed from `~/.config/opencode/plugins/`.

## Scenario: no standalone deploy:session-rename

**Trigger:** The user runs `npm run` or inspects `package.json`.

**Result:** `deploy:session-rename` is not listed. The file
`deploy-session-rename.mjs` does not exist.
