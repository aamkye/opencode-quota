# Outcome

README.md contains a single consolidated "Configuration reference" section that
enumerates every configurable option across all plugins and host-level config,
with type, default, accepted values, and behavior for each.

# Scope

- Add a new `### Configuration reference` subsection under the existing
  `### Configuration` section in README.md.
- Document every option accepted by each plugin tuple:
  - `defaultState` for Context, SesTokens, SubAgent, Quota, MCP, LSP, TODO.
  - Every field under the Quota `quota` options object.
- Document host-level `plugin` array entry forms and `plugin_enabled` keys.
- Each option entry includes: path, type, default, accepted values, and effect.
- Preserve existing prose sections; the new section is additive.

# Non-goals

- Not changing plugin option normalization code or defaults.
- Not changing `tui.json` or `opencode.json` schema.
- Not removing or restructuring existing README configuration prose.
- Not documenting internal/runtime symbols that are not user-configurable.

# Acceptance examples

- A reader finds every configurable option in one section without scrolling
  between scattered subsections.
- Every field listed in `QuotaPluginOptions`, `ProgressColorOptions`,
  `resolveCollapseDefault`, and `OpenCodeGoOptions` appears with its type,
  default, and accepted values.
- The `plugin_enabled` keys for built-in panel overrides are listed.
- The configuration JSON example remains valid and unchanged.

# Constraints and invariants

- Options, defaults, and accepted values match the normalization functions in
  `tui/features/quota.ts`, `tui/features/collapse-options.ts`, and
  `tui/providers/opencode-go.ts`.
- `npm test` continues to pass, including `plugin-wiring.test.mjs` README
  assertions.

# Decisions

- Add a consolidated reference section; do not remove existing scattered prose.

# Open questions

_None._

# Verification expectations

- `npm test` passes.
- README assertions in `tests/plugin-wiring.test.mjs` pass.
