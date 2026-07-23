# Outcome

`/session-rename` no longer writes any chat message on a successful or failed
rename. The single exception is an invalid user-supplied title: the command posts
an error message explaining *why* the title is rejected, then waits for the LLM
to react to that error.

# Scope

- `lib/session-rename.ts` — the `command.execute.before` hook:
  - **Valid explicit title** (`/session-rename <3-8 word title>`): rename via
    `session.update`, then abort the command. No `session.prompt` feedback is
    posted.
  - **Invalid explicit title**: no rename. Post an error message that names the
    specific constraint violated (word count or disallowed characters), quoted
    against the supplied input, as a prompt **without** `noReply` so the LLM
    generates a reply and the hook awaits it. Then abort the command.
  - **No-args generate path** (`/session-rename` with empty arguments): unchanged
    generation logic, rename on success, then abort. No feedback message on
    success or failure.
  - **Transient failures** (update rejects/resolves error, generation failures,
    cleanup failures): no chat message; the existing structured `warn` console
    logging is preserved.
- Remove the `appendFeedback` helper (the `noReply: true` + `ignored: true`
  silent-feedback prompt); it is no longer used.
- Add a helper that posts the invalid-title error as a regular prompt (no
  `noReply`, no `ignored`) so the LLM sees and reacts to the error text.
- Add a function that produces a human-readable reason for a rejected title.
- Update `tests/session-rename.lifecycle.test.mjs` to assert the new contract.
- Update `tests/session-rename.unit.test.mjs` if `normalizeTitle`-adjacent
  helpers change signature.

# Non-goals

- Not changing the title validation rules (3-8 words; each word starts with a
  letter or number and may contain letters, numbers, apostrophes, hyphens).
- Not removing the no-args generate path.
- Not changing the command registration (`template`, `description`) or the
  `agent.title.disable` config side effect.
- Not adding chat messages for transient failures (server errors, generation
  failures). Those remain silent and warn-logged.
- Not changing the `HANDLED_SESSION_RENAME` abort-sentinel mechanism; every path
  still throws it to abort the command.

# Acceptance examples

- `/session-rename Project planning notes` (valid, 3 words): `session.update`
  is called with the title; zero `session.prompt` calls; command aborts via
  `HANDLED_SESSION_RENAME`.
- `/session-rename Too short` (invalid, 2 words): no `session.update`; exactly
  one `session.prompt` with no `noReply` and no `ignored` part, whose text names
  the word-count violation against the quoted input; command aborts.
- `/session-rename Fix it!` (invalid, disallowed `!`): one `session.prompt` (no
  `noReply`) whose text names the disallowed-character constraint; no
  `session.update`; command aborts.
- `/session-rename` (empty arguments): generates a title, `session.update`
  called on success; zero feedback `session.prompt` calls; command aborts.
- `/session-rename` generate failure (messages unavailable, bad model output):
  zero feedback `session.prompt` calls; one `warn` logged; session left
  unchanged; command aborts.
- `/session-rename Project planning notes` where `session.update` rejects: zero
  `session.prompt` calls; one `warn("update")` logged; command aborts.
- The invalid-title error prompt is awaited (the hook resolves only after the
  LLM reply completes), fulfilling "wait for LLM to react."

# Constraints and invariants

- `HANDLED_SESSION_RENAME` is still a single shared `Error` sentinel thrown in
  every path to abort the command.
- `normalizeTitle`'s validation regex is unchanged.
- `warn` structured-JSON console logging (`{ plugin, action, sessionID, message }`)
  is unchanged for failures.
- The invalid-title error prompt must **not** set `noReply` (so a reply is
  generated) and must **not** set `ignored` on the text part (so the error text
  reaches the LLM context and it can react).
- Success and transient-failure paths must make **zero** `session.prompt` calls.
- The hook still exposes only `config` and `command.execute.before`.
- Command/config registration output is unchanged.

# Decisions

- Success is fully silent: the success `appendFeedback` call is removed from
  both the explicit-title and generate paths. No `session.prompt` is issued.
- The invalid-title error is posted as a regular prompt (no `noReply`, no
  `ignored`) and awaited, so the LLM sees the error text and generates a reply
  before the command aborts. This is the only chat message the command produces.
- Transient failures are silent per the requirement that only invalid-supplied-
  name errors may appear in chat; they remain `warn`-logged for debugging.
- The command still throws `HANDLED_SESSION_RENAME` after posting the error, so
  only the injected error is visible and the raw `/session-rename <invalid>`
  input is never sent to the LLM.
- A dedicated reason function classifies rejections into word-count and
  disallowed-character categories so the error is specific rather than a generic
  usage string.

# Open questions

_None._ The requirement crisply closes every user-visible branch: success and
transient failures are silent; only an invalid user-supplied title produces a
chat message, and that message must trigger an LLM reaction.

# Verification expectations

- `npm test` passes (compile + unit + lifecycle suites).
- Lifecycle tests assert: valid title → `update` only, no `prompt`; invalid
  title → one `prompt` without `noReply`/`ignored` carrying a specific reason,
  no `update`; generate success → `update` only, no feedback `prompt`; generate
  failure → no feedback `prompt`, one `warn`; update failure → no `prompt`, one
  `warn`.
- TypeScript type-checks cleanly (`tsc --noEmit` via the compile test).
