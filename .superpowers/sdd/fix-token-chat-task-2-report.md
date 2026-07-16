# Task 2 GREEN Evidence

## Implementation

- Replaced report-route navigation with `persistReport`, which computes and
  renders the report, then writes it through
  `api.client.session.prompt({ path, body: { noReply: true, parts } })`.
- Commands without an active session show `Open a session to view token usage`
  and make no client call.
- Compute failures are written to the active session as `Token report failed:`
  text through the same no-reply API.
- Added the `aamkye.token-report-range` mode. Native `DialogPrompt` Enter
  clears the dialog, pops the mode, and awaits report persistence; its Escape
  binding invokes the active dialog close callback.
- Removed the token report route, route registration, report mode, and all
  route-navigation test coverage.
- Added only the narrow TUI declarations for async command/prompt handlers,
  `ui.toast.show`, and `client.session.prompt`.

## API Evidence

Current OpenCode documentation for `session.prompt({ path, body })` states
that `body.noReply: true` creates a user-message context write rather than an
assistant reply. This is the supported delivery path used by the command
handlers; no internal API or model scheduling was used.

## RED

Command:

```sh
node tests/compile-presentation.mjs && node --test tests/token-tui.test.mjs
```

Result before implementation: presentation compilation passed; 9 tests ran,
with 5 passing and 4 expected failures:

```text
token commands persist a no-reply report in the active session
  expected one client.session.prompt call; actual: []
token command without a session shows a toast without a client call
  expected one toast; actual: 0
tokens_between Enter submits the native prompt
  expected one client.session.prompt call; actual: 0
tokens_between Escape closes its dialog mode without a client call
  expected one mode push; actual: 0
```

## GREEN

Focused command:

```sh
node tests/compile-presentation.mjs && node --test tests/token-tui.test.mjs
```

Result: PASS, 6 tests passed, 0 failed. The focused suite covers no-reply
delivery, no-session toast, native range Enter, range Escape cancellation, no
route registration, and persistence of compute failures.

Regression commands:

```sh
npm test
npm run typecheck
npm run build
```

Results:

```text
npm test: 223 passed, 0 failed
npm run typecheck: tsc --noEmit passed
npm run build: build-plugins passed
  dist/opencode-tools-shared.js  64.2kb
  dist/opencode-tools-quota.js  22.2kb
```

## Commit

`fix(tui): persist token reports in chat`

## Risks And Concerns

- The test commands emitted pre-existing npm configuration warnings for
  `allow-scripts`; they did not affect any command exit status.
- The persistence API write itself is awaited but intentionally has no local
  toast or retry behavior if the host client rejects. This preserves the task
  contract and avoids scheduling a model.
- The existing unrelated modification to
  `openspec/changes/fix-token-command-hook/.comet/subagent-progress.md` was
  left untouched and excluded from the commit.
