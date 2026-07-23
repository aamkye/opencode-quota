# session-rename

The `session-rename` command renames the active session. It is silent on success
and on transient failure, producing a chat message only when the user supplies
an invalid title — in which case it posts a specific error that the LLM ignores.

## Command registration

- Template: `/session-rename`
- Description: `Rename this session; omit the title to generate one`
- Side effect: disables OpenCode's built-in title agent
  (`config.agent.title.disable = true`) without touching any other agent config.

## Paths

### Scenario: valid explicit title

**Trigger:** `/session-rename <title>` where `<title>` normalizes to 3-8 words
(each word starts with a letter or number; words may contain letters, numbers,
apostrophes, and hyphens; surrounding quotes and whitespace are stripped).

**Result:** `session.update` sets the normalized title. No chat message is
posted. The command aborts (no further execution).

### Scenario: invalid explicit title

**Trigger:** `/session-rename <title>` where `<title>` does not normalize to a
valid 3-8 word title.

**Result:** The session is not renamed. A single error message is posted via
`session.prompt` **with** `noReply: true` (so no LLM reply is generated) and
**with** `ignored: true` on the text part (so the LLM does not interpret the
error). The error text names the specific constraint violated, quoting the
supplied input:

- **Word count** — the title has fewer than 3 or more than 8 words:
  `The session name "<input>" is invalid: it must be 3 to 8 words, but has <n>.`
- **Disallowed characters** — the title has 3-8 whitespace-separated tokens but
  contains characters outside letters, numbers, apostrophes, and hyphens, or a
  token does not start with a letter or number:
  `The session name "<input>" is invalid: each word must start with a letter or number and contain only letters, numbers, apostrophes, and hyphens.`

The command then aborts. This is the only path that posts a chat message.

### Scenario: no-args generate

**Trigger:** `/session-rename` with empty or whitespace-only arguments.

**Result:** The command collects recent user text, resolves the latest user
model, creates a transient child session, prompts it for a 3-8 word title,
deletes the child, and on success calls `session.update` with the generated
title. No chat message is posted on success or failure. On any failure
(messages unavailable, no usable text, no model, child creation/prompt/delete
failure, invalid generated output, or parent update failure) the session is left
unchanged and the failure is warn-logged.

## Validation

`normalizeTitle(value)` trims surrounding whitespace, strips one layer of
surrounding quotes, and tests against:

```regexp
/^[\p{L}\p{N}][\p{L}\p{N}'-]*(?: [\p{L}\p{N}][\p{L}\p{N}'-]*){2,7}$/u
```

This requires 3 to 8 words separated by single spaces, each word starting with a
letter or number. The rules are unchanged; `describeInvalidTitle` classifies a
rejection into a word-count or character-format reason for the error message.

## Aborts

Every path throws a single shared `HANDLED_SESSION_RENAME` sentinel `Error`
("session rename handled") to abort command execution. The sentinel is reused
across invocations.

## Warnings

Transient failures log structured JSON to `console.warn`:

```json
{ "plugin": "session-rename", "action": "<generate|update|cleanup|feedback>", "sessionID": "<id>", "message": "<error message>" }
```

`action` is `generate` for generation/preparation failures, `update` for parent
title-update failures, and `cleanup` for child-session deletion failures.
