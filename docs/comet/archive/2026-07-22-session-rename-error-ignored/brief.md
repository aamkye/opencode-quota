# Outcome

When `/session-rename` rejects an invalid supplied title, the error message is
still posted to chat but is marked `ignored` and sent with `noReply`, so the LLM
does not interpret or react to it.

# Scope

- `lib/session-rename.ts` — the `reportError` helper: add `noReply: true` to the
  prompt body and `ignored: true` to the text part, so the error appears in chat
  but the LLM neither sees it in context nor generates a reply.
- `tests/session-rename.lifecycle.test.mjs` — update the invalid-title assertions
  to expect `noReply: true` and `ignored: true` on the error prompt.

# Non-goals

- Not changing the error text (`describeInvalidTitle` output is unchanged).
- Not changing the success or transient-failure paths (already silent).
- Not changing validation rules.

# Acceptance examples

- `/session-rename Too short` (invalid): one `session.prompt` with `noReply:
  true` and `ignored: true` on the text part, carrying the word-count reason; no
  `session.update`; command aborts.
- `/session-rename Project planning notes` (valid): `session.update` only; zero
  `session.prompt` calls; command aborts (unchanged).

# Constraints and invariants

- `describeInvalidTitle` output is unchanged.
- `HANDLED_SESSION_RENAME` sentinel is still thrown in every path.
- Success and transient-failure paths remain silent (zero `session.prompt`).

# Decisions

- The error prompt uses `noReply: true` + `ignored: true` — the same mechanism as
  the original silent feedback — so the LLM ignores the error entirely. The only
  retained improvement from the prior change is the specific error text.

# Open questions

_None._

# Verification expectations

- `npm run typecheck` passes.
- Session-rename lifecycle tests assert the invalid-title prompt carries
  `noReply: true` and `ignored: true`.
- All session-rename tests pass.
