# readme-config-reference

README.md includes a `### Configuration reference` subsection that enumerates
every configurable option accepted by the opencode-tools plugins and host-level
configuration files.

## Scenario: reader finds every option in one section

**Trigger:** A user opens README.md and navigates to the Configuration
reference subsection.

**Result:** The subsection lists every configurable option with its JSON path,
type, default, accepted values, and effect. The reader does not need to scan
multiple scattered subsections or source code to discover an option.

## Scenario: defaultState for every sidebar panel

**Trigger:** The reader looks up which panels accept `defaultState`.

**Result:** The reference lists Context, SesTokens, MCP, LSP, and TODO as
accepting `"expanded"` (default) or `"collapsed"`, and SubAgent and Quota as
also accepting `"semi-collapsed"`.

## Scenario: every quota option documented

**Trigger:** The reader looks up any field under the Quota plugin's `quota`
options object.

**Result:** The reference documents `refreshIntervalSeconds`,
`progressColors.enabled`, `progressColors.errorBelow`,
`progressColors.warningBelow`, `percentageMode`, `hideInactive`,
`openai.hideInactive`, `zai.hideTools`, `zai.hideInactive`,
`opencodego.workspaceId`, `opencodego.workspaceToken`,
`opencodego.hideInactive`, and `otherProviders.sortDirection` with types,
defaults, and accepted values.

## Scenario: host-level plugin_enabled keys

**Trigger:** The reader needs to disable a built-in panel to avoid duplicates.

**Result:** The reference lists `internal:sidebar-context`,
`internal:sidebar-mcp`, `internal:sidebar-lsp`, and `internal:sidebar-todo`.
