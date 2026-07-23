# Acceptance evidence
<!-- comet-native:acceptance-evidence:start -->
[
  {
    "acceptance_id": "acceptance-0b83ababadce7f657c538d3ff50ba8e8d1c7e6df40d7bd5c08fa0227ed64fbf3",
    "evidence_refs": [
      "tests/context-mounted.test.mjs",
      "tests/lsp-mounted.test.mjs",
      "tests/mcp-mounted.test.mjs",
      "tests/ses-tokens-mounted.test.mjs",
      "tests/todo-mounted.test.mjs"
    ]
  },
  {
    "acceptance_id": "acceptance-20343debe6a1688c527f66ce9603f3efcc9e1983aaf45b11867b4a4209e36ad6",
    "evidence_refs": [
      "tests/context-mounted.test.mjs",
      "tests/lsp-mounted.test.mjs",
      "tests/mcp-mounted.test.mjs",
      "tests/presentation-mounted.test.mjs",
      "tests/ses-tokens-mounted.test.mjs",
      "tests/subagent-mounted.test.mjs",
      "tests/todo-mounted.test.mjs"
    ]
  },
  {
    "acceptance_id": "acceptance-3fd718bd83a8dc67536ae5929de3b248c61c235c25393e51c4c4d4cd56a1f33e",
    "evidence_refs": [
      "tests/collapse-options.test.mjs",
      "tests/context-mounted.test.mjs",
      "tests/lsp-mounted.test.mjs",
      "tests/mcp-mounted.test.mjs",
      "tests/presentation-mounted.test.mjs",
      "tests/ses-tokens-mounted.test.mjs",
      "tests/subagent-mounted.test.mjs",
      "tests/todo-mounted.test.mjs"
    ]
  },
  {
    "acceptance_id": "acceptance-7d1e40cb74603f44c993deea34d9fca18b7e0273e9b1922fd8fc7cc2ae041bbe",
    "evidence_refs": [
      "tests/context-mounted.test.mjs"
    ]
  },
  {
    "acceptance_id": "acceptance-86998c8bc3a5ccf96ebd9c71d0db758648d705aa116a8cac7d2289c6ef4a559a",
    "evidence_refs": [
      "tests/context-mounted.test.mjs",
      "tests/lsp-mounted.test.mjs",
      "tests/mcp-mounted.test.mjs",
      "tests/presentation-mounted.test.mjs",
      "tests/ses-tokens-mounted.test.mjs",
      "tests/subagent-mounted.test.mjs",
      "tests/todo-mounted.test.mjs"
    ]
  },
  {
    "acceptance_id": "acceptance-969489332bc10ed9a38788da62ea2b120e2b6b653140fece274ee979a4445f52",
    "evidence_refs": [
      "tests/presentation-mounted.test.mjs",
      "tests/subagent-mounted.test.mjs"
    ]
  },
  {
    "acceptance_id": "acceptance-a2a4e80a64b70730e6534b2ad60ad666eb348e9ca2a5edd43166f1860d9e6997",
    "evidence_refs": [
      "tests/context-mounted.test.mjs",
      "tests/lsp-mounted.test.mjs",
      "tests/mcp-mounted.test.mjs",
      "tests/presentation-mounted.test.mjs",
      "tests/ses-tokens-mounted.test.mjs",
      "tests/subagent-mounted.test.mjs",
      "tests/todo-mounted.test.mjs"
    ]
  },
  {
    "acceptance_id": "acceptance-a538ba454377fc8dda233208c3fb0e69140ab66d3d49fc682d57a329ddd3bca9",
    "evidence_refs": [
      "tests/collapse-options.test.mjs",
      "tests/lsp-mounted.test.mjs"
    ]
  },
  {
    "acceptance_id": "acceptance-b345f0f58c84e422e59af3b641dafd913fcf541423f6bc077948e4f06e578332",
    "evidence_refs": [
      "tests/subagent-mounted.test.mjs"
    ]
  },
  {
    "acceptance_id": "acceptance-b3e2e547e4b95ddc2d4631da52cc5325fe480066678e4e6a8504c860ea653a8e",
    "evidence_refs": [
      "tests/collapse-options.test.mjs",
      "tests/lsp-mounted.test.mjs"
    ]
  }
]
<!-- comet-native:acceptance-evidence:end -->

# Commands and results
- `npm run typecheck`: passed with no TypeScript errors.
- `npm test`: passed all 447 tests with 0 failures.
- `git diff --check`: passed with no whitespace errors.

# Skipped checks
- A live interactive OpenCode host session was not run. Reactive mounted fixtures exercise active-session changes, panel toggles, secondary disclosures, and child disclosures without remounting.

# Spec consistency
The implementation matches the complete proposed specification. All seven sidebar panels reset from `defaultState` on active session changes, binary and tri-state defaults retain their documented interpretation, collapse-state kv persistence is absent, and SubAgent retained failure evidence remains persistent.

# Known limitations and risks
No known implementation limitation remains. The Quota behavior is covered through its shared mounted `PanelRenderer`, including panel and Other Providers disclosure reset.

# Conclusion
Pass. The implementation satisfies the approved brief and all proposed specification scenarios.
