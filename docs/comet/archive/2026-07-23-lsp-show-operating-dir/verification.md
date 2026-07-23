# Acceptance evidence
<!-- comet-native:acceptance-evidence:start -->
[
  {
    "acceptance_id": "acceptance-2fb05ad860b1901d75f965fe8027bef728709517edec9d58e00423082b0f92d6",
    "evidence_refs": [
      "tests/lsp-model.test.mjs",
      "tests/lsp-mounted.test.mjs"
    ]
  },
  {
    "acceptance_id": "acceptance-458c8d69361e102067982e8690fcea285b0c2f6524b9ff80b78e189504d1f20a",
    "evidence_refs": [
      "tests/lsp-mounted.test.mjs"
    ]
  },
  {
    "acceptance_id": "acceptance-5044dc3a473335a092ec978663284ba7184ab6c98125b47d2081019ca13715f7",
    "evidence_refs": [
      "tests/lsp-mounted.test.mjs"
    ]
  },
  {
    "acceptance_id": "acceptance-587fe71819edc9324453199632841d4591fef97ac319bf5272cd2a88fee86174",
    "evidence_refs": [
      "tests/lsp-model.test.mjs",
      "tests/lsp-mounted.test.mjs"
    ]
  },
  {
    "acceptance_id": "acceptance-79601ff87a7ced783fa530d7c1beb227eecb34365c50e54922d931cd624ed1b4",
    "evidence_refs": [
      "tests/lsp-mounted.test.mjs"
    ]
  },
  {
    "acceptance_id": "acceptance-7c49ddca9363257d83ca491a2036b17c8a38ad823ec284addec0be308819c869",
    "evidence_refs": [
      "tests/lsp-mounted.test.mjs"
    ]
  },
  {
    "acceptance_id": "acceptance-838096563f4bd59350d69f1faf14063e1ead31150d2e1bd71f06fddc895609d0",
    "evidence_refs": [
      "tests/lsp-model.test.mjs",
      "tests/lsp-mounted.test.mjs"
    ]
  },
  {
    "acceptance_id": "acceptance-8dc91252a21c1c9a7760fbf8070f9c4a06e3f7d77926e68fb5f3fe3db879c9ef",
    "evidence_refs": [
      "tests/lsp-model.test.mjs",
      "tests/lsp-mounted.test.mjs"
    ]
  },
  {
    "acceptance_id": "acceptance-cfef3cc466ea342187bd88e57508f58184a8f241757630429ea9421f44248f9b",
    "evidence_refs": [
      "tests/lsp-mounted.test.mjs"
    ]
  }
]
<!-- comet-native:acceptance-evidence:end -->

# Commands and results
- `npm run typecheck`: passed with no TypeScript errors.
- `npm test`: 450 of 451 tests passed. The single failure (`retains the legacy
  session artifact name only for deployment cleanup` in `tests/plugin-wiring.test.mjs`)
  is pre-existing and unrelated to this change: it is caused by the archived
  brief `docs/comet/archive/2026-07-23-unify-session-rename-deploy/brief.md`
  referencing the legacy `session-title.ts`, and it fails identically on a clean
  tree with this change's edits stashed (`git stash -- tests/ tui/`). All LSP,
  format, and README layout-contract tests pass.
- `git diff --check`: passed with no whitespace errors.
- `comet native check lsp-show-operating-dir`: passed; receipt
  `runtime/evidence/check-receipts/a374f70dce96b9490c12696a60d49a38e8de4e5033de4c7ba70e650412680172.json`.

# Skipped checks
- A live interactive OpenCode host session was not run. The mounted LSP fixture
  exercises rendering, status-colored bullets, the right-aligned basename label,
  empty-root omission, long-id truncation, reactive list updates, and
  collapse/session behavior without remounting.

# Spec consistency
The implementation matches the complete target specification. Each expanded LSP
row shows the status-colored bullet and `id` on the left and the `root` basename
right-aligned in the muted label color; a server with an empty/missing `root`
renders the `id` alone. The collapsed count summary, empty-list fallback, id
label choice, status colors, and synchronized source order are unchanged. The
basename is computed by a new `pathBasename` helper in `tui/presentation/format.ts`.

# Known limitations and risks
A basename that is extremely long could squeeze the `id`; the flexible `id` cell
truncates with an ellipsis and the label box clips via `overflow="hidden"`, so
every row stays within the 37-cell width with no trailing whitespace. This
mirrors the established MCP status-row layout. No trailing whitespace is
introduced for empty roots because the label and its gap render only when the
basename is non-empty.

The pre-existing `plugin-wiring` failure noted above is out of scope for this
change and is not caused by it.

# Conclusion
Pass. The implementation satisfies the approved brief and all target
specification scenarios for the LSP operating-directory feature.
