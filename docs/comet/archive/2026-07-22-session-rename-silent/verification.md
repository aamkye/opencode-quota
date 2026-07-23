# Acceptance evidence

<!-- comet-native:acceptance-evidence:start -->
[
  {
    "acceptance_id": "acceptance-0cba81a6fef1f59bea920f8f9bfa51a2ddc94b9e7505eeb4b4028690955aea38",
    "evidence_refs": [
      "tests/session-rename.lifecycle.test.mjs"
    ]
  },
  {
    "acceptance_id": "acceptance-1d4ddc0ca9a29b8b6f59531cba7977f2685070a6f5af6940e1b58ce5dc1ce3f8",
    "evidence_refs": [
      "tests/session-rename.lifecycle.test.mjs",
      "tests/session-rename.unit.test.mjs"
    ]
  },
  {
    "acceptance_id": "acceptance-1fd9284acb13d5e787c1dca1a1104b4c9cb0baef114b347912ef1b9143d954f8",
    "evidence_refs": [
      "lib/session-rename.ts",
      "tests/session-rename.lifecycle.test.mjs"
    ]
  },
  {
    "acceptance_id": "acceptance-2550569d85aa71b8cf0bda399bc7180f2afb88c2558ecff56ad5c761e471a9df",
    "evidence_refs": [
      "tests/session-rename.lifecycle.test.mjs",
      "tests/session-rename.unit.test.mjs"
    ]
  },
  {
    "acceptance_id": "acceptance-48e42b0b7e37ee8ace837b3ba6461b4e50903024018e4f11c206529ba3c7fd66",
    "evidence_refs": [
      "tests/session-rename.lifecycle.test.mjs"
    ]
  },
  {
    "acceptance_id": "acceptance-4a5996ba29bb0ab1cf95be8c94be4aa54219de713f568e06bf8af08d8a1058ff",
    "evidence_refs": [
      "lib/session-rename.ts",
      "tests/session-rename.lifecycle.test.mjs"
    ]
  },
  {
    "acceptance_id": "acceptance-5914867366bf782b33230e1f9635438feb3b568b75985c9f54fed07711f936b5",
    "evidence_refs": [
      "tests/session-rename.lifecycle.test.mjs"
    ]
  },
  {
    "acceptance_id": "acceptance-780c8ff95597a6506ea2e25f3200c38ff64882bad78fc2877490ab85c36eab50",
    "evidence_refs": [
      "lib/session-rename.ts"
    ]
  },
  {
    "acceptance_id": "acceptance-89dbb857d0c166edb9362f7b8187adcf9fd0bf39ebc778cdcc885d0a229ea034",
    "evidence_refs": [
      "lib/session-rename.ts",
      "tests/session-rename.lifecycle.test.mjs"
    ]
  },
  {
    "acceptance_id": "acceptance-eb49396b1aad8d67ffc77bc9eed8cf443949de9d5c97fe4d3a02ccbb24c7f9b6",
    "evidence_refs": [
      "tests/session-rename.lifecycle.test.mjs"
    ]
  }
]
<!-- comet-native:acceptance-evidence:end -->

# Commands and results

## TypeScript type-check

```
npm run typecheck   →  tsc --noEmit   →  exit 0, no errors
```

## Session-rename test suite (unit + lifecycle + deploy + artifact)

```
node tests/compile-session-rename.mjs && node --test tests/session-rename.unit.test.mjs tests/session-rename.lifecycle.test.mjs tests/session-rename-deploy.test.mjs tests/session-rename-artifact.test.mjs
→ tests 32  pass 32  fail 0
```

Key assertions confirmed:

- Valid title → `session.update` only; zero `session.prompt` calls; aborts.
- Invalid title (word count) → one `session.prompt` without `noReply`/`ignored`
  carrying the word-count reason; no `session.update`; aborts.
- Invalid title (disallowed characters) → `describeInvalidTitle` returns the
  character-constraint message for 3-8 word inputs with invalid characters.
- Update rejects/resolves error → zero `session.prompt`; one `warn("update")`;
  aborts.
- Generate success → `messages`/`create`/`prompt`/`delete`/`update`; zero
  feedback `session.prompt`; aborts.
- Generate failure boundaries (9 sub-scenarios) → zero feedback `session.prompt`;
  warn logged; session unchanged; aborts.
- Error-prompt failure → one `warn("feedback")`; aborts.

## Plugin build

```
npm run build:session-rename   →  dist/session-rename.ts  3.6kb   exit 0
```

## Full project test suite

```
npm test   →  tests 443  pass 442  fail 1
```

The single failure (`provider-zai.test.mjs:803` — "queues one Z.AI reset-boundary
refresh behind an older request") is a pre-existing fake-timer-cleanup flake that
passes in isolation (27/27) and is unrelated to this change; it only fails under
full-suite concurrency due to a timer leak from another test file.

## Built-in text-hygiene check

```
comet native check session-rename-silent   →  passed
```

# Skipped checks

None.

# Spec consistency

- The `reportError` helper posts via `session.prompt` without `noReply` and
  without `ignored`, matching the spec's "without noReply … without ignored"
  requirement so the LLM sees the error text and reacts.
- Success and transient-failure paths make zero `session.prompt` calls, matching
  the spec's "No chat message is posted."
- `describeInvalidTitle` classifies rejections into word-count (fewer than 3 or
  more than 8) and character-format categories, matching the spec's two error
  templates. Word-count is checked first; a 2-word input like "Fix it!" reports
  the word-count reason (the more fundamental constraint). The character-format
  reason applies to 3-8 word inputs containing disallowed characters (e.g.
  "Fix it now!" → character constraint), which is covered by the unit test.
- `HANDLED_SESSION_RENAME` sentinel is still thrown in every path.
- `warn` structured-JSON logging is unchanged for `generate`, `update`,
  `cleanup`, and `feedback` actions.
- Command/config registration output is unchanged.

# Known limitations and risks

- The invalid-title error is posted as a regular user-role message (no `ignored`
  flag) so the LLM context includes it and generates a reply. The exact LLM
  reaction cannot be asserted in an automated test; the lifecycle test verifies
  the prompt is sent without `noReply`/`ignored`, which is the mechanism that
  triggers the reaction.
- Transient failures (update rejects, generation failures) are intentionally
  silent in chat per the requirement that only invalid-supplied-name errors may
  appear; they remain `warn`-logged for debugging.

# Conclusion

Pass. All ten acceptance criteria are evidenced by the implementation and tests.
TypeScript type-checks cleanly, all 32 session-rename tests pass, the plugin
builds, and the built-in text-hygiene check passes. The implementation matches
the complete target specification.
