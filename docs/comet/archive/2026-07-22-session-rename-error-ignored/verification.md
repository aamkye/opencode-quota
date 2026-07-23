# Acceptance evidence

<!-- comet-native:acceptance-evidence:start -->
[
  {
    "acceptance_id": "acceptance-4a5996ba29bb0ab1cf95be8c94be4aa54219de713f568e06bf8af08d8a1058ff",
    "evidence_refs": [
      "lib/session-rename.ts",
      "tests/session-rename.lifecycle.test.mjs"
    ]
  },
  {
    "acceptance_id": "acceptance-5cb4df37e2bc510a3bf38be0b58513bc85f6c55d757f80b51ce75a0bae6bc187",
    "evidence_refs": [
      "tests/session-rename.lifecycle.test.mjs"
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
    "acceptance_id": "acceptance-c47aa27feacacb9cbce09c0de363a15b4c9af88e18605981606a13e7ea109f3f",
    "evidence_refs": [
      "tests/session-rename.lifecycle.test.mjs"
    ]
  },
  {
    "acceptance_id": "acceptance-e73c1c2b65355e11670390ac824d48d2e4ab8a49656d4becfaa6a39073b04b8c",
    "evidence_refs": [
      "lib/session-rename.ts",
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

## Session-rename tests (unit + lifecycle)

```
node tests/compile-session-rename.mjs && node --test tests/session-rename.unit.test.mjs tests/session-rename.lifecycle.test.mjs
→ tests 28  pass 28  fail 0
```

Key assertion confirmed: invalid title prompt carries `noReply: true` and
`ignored: true` on the text part.

## Built-in text-hygiene check

```
comet native check session-rename-error-ignored   →  passed
```

# Skipped checks

None.

# Spec consistency

- `reportError` posts with `noReply: true` and `ignored: true`, matching the
  spec's "with noReply … with ignored" requirement so the LLM does not interpret
  the error.
- `describeInvalidTitle` output is unchanged (specific word-count or
  character-format reason).
- Success and transient-failure paths remain silent (zero `session.prompt`).
- `HANDLED_SESSION_RENAME` sentinel still thrown in every path.

# Known limitations and risks

None beyond the prior change's baseline.

# Conclusion

Pass. All five acceptance criteria are evidenced. The error prompt now uses
`noReply: true` + `ignored: true` so the LLM ignores it, while the specific error
text is retained.
