# Acceptance evidence

<!-- comet-native:acceptance-evidence:start -->
[
  {
    "acceptance_id": "acceptance-20333a2364037182e106d21fe9440dc81a5d5d7ff4589069d96d04bc622bef47",
    "evidence_refs": [
      "tests/collapse-options.test.mjs",
      "tui/features/collapse-options.ts"
    ]
  },
  {
    "acceptance_id": "acceptance-2d5480ae1b1ab7008a1e18d63028369abdc0751e9c0e0a16d53f7fce60f808fc",
    "evidence_refs": [
      "tests/collapse-options.test.mjs",
      "tui/features/collapse-options.ts"
    ]
  },
  {
    "acceptance_id": "acceptance-52e9f6e3c7bd732688911d5268aeaa890d2e6af6aeb8d3314bda5f820e4c3bb3",
    "evidence_refs": [
      "tests/collapse-options.test.mjs",
      "tui/features/collapse-options.ts"
    ]
  },
  {
    "acceptance_id": "acceptance-66817d23494dfdfd3151fb4585e0ea73f62742f5bf7f39400d8f8af9b8433be5",
    "evidence_refs": [
      "tui/context.tsx",
      "tui/lsp.tsx",
      "tui/mcp.tsx",
      "tui/ses-tokens.tsx",
      "tui/todo.tsx"
    ]
  },
  {
    "acceptance_id": "acceptance-8ca67a20d0410145ffef23ee2b080f53feb78fafb69b8721dd54601d47523781",
    "evidence_refs": [
      "tui/presentation/renderer.tsx",
      "tui/quota.tsx",
      "tui/subagent.tsx"
    ]
  },
  {
    "acceptance_id": "acceptance-8ce904aee2f0bfcb14a9c4c2b9288d219ef6b6fb7f9523d78f4aa13dbb32277d",
    "evidence_refs": [
      "tests/collapse-options.test.mjs",
      "tui/features/collapse-options.ts"
    ]
  },
  {
    "acceptance_id": "acceptance-a41266b7054bdcba64c7f4fe18870b3e962865025c1bcf918cec8d439aefe400",
    "evidence_refs": [
      "tui/context.tsx",
      "tui/lsp.tsx",
      "tui/mcp.tsx",
      "tui/ses-tokens.tsx",
      "tui/todo.tsx"
    ]
  },
  {
    "acceptance_id": "acceptance-b5752c1f7c5dd516bf7d05deb32686098940330e63a9903522499b38c0f8483a",
    "evidence_refs": [
      "tui/context.tsx",
      "tui/features/collapse-options.ts"
    ]
  },
  {
    "acceptance_id": "acceptance-c6eb8573e6e9b5c630de8e6c8a790983bace9616e5c4b581c7cdb0822e9c1e35",
    "evidence_refs": [
      "tui/context.tsx",
      "tui/features/collapse-options.ts"
    ]
  },
  {
    "acceptance_id": "acceptance-f1191274b3cf98129732fafb5d1728d9d4f955425874dc53194e57a8c6ccbc52",
    "evidence_refs": [
      "README.md"
    ]
  }
]
<!-- comet-native:acceptance-evidence:end -->

# Commands and results

## TypeScript type-check

```
npm run typecheck   →  tsc --noEmit   →  exit 0, no errors
```

## Full project test suite

```
npm test   →  tests 449  pass 449  fail 0
```

## Built-in text-hygiene check

```
comet native check tui-default-collapse-option   →  passed
```

# Skipped checks

None.

# Spec consistency

- `resolveCollapseDefault` returns `{ collapsed, secondaryCollapsed }`; binary
  panels use `collapsed` only; tri-state panels use both.
- `"semi-collapsed"` is ignored for binary panels (`supportsSemiCollapsed =
  false`), matching the spec.
- SubAgent applies `collapseDefaults.collapsed` and `.secondaryCollapsed` as kv
  fallbacks for panel and Rest section.
- Quota applies them via PanelRenderer's `initiallyCollapsed` and
  `initiallyCollapsedGroupIds` props.
- Deploy system preserves per-plugin options for `defaultState` and `quota`
  plugins; strips options for `none` plugins.
- README documents `defaultState` with per-plugin accepted values.

# Known limitations and risks

- Quota does not persist collapse state to kv; the `defaultState` option is the
  only way to control its initial collapse (no user-toggle persistence).
- The exact panel rendering (CompactPanel / PanelRenderer visual states) is
  verified by existing mounted-component tests, not re-tested here.

# Conclusion

Pass. All ten acceptance criteria are evidenced. TypeScript type-checks cleanly,
all 449 tests pass, and the built-in text-hygiene check passes.
