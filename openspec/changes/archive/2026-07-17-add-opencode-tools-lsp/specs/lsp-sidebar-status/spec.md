## ADDED Requirements

### Requirement: Standalone LSP sidebar registration
The system SHALL ship `opencode-tools-lsp` as a standalone TUI plugin artifact that registers one LSP panel immediately after the MCP panel.

#### Scenario: Plugin is enabled
- **WHEN** the standalone LSP plugin is present in OpenCode's TUI plugin configuration
- **THEN** it registers one `LSP` panel in the sidebar after MCP

#### Scenario: Plugin is built and deployed
- **WHEN** the repository's plugin build or deployment workflow runs
- **THEN** it produces or installs the standalone LSP artifact together with its shared runtime dependency

### Requirement: Reactive ordered LSP source
The system SHALL derive the panel from the ordered reactive list returned by `api.state.lsp()` and SHALL preserve the order supplied by OpenCode.

#### Scenario: LSP state changes
- **WHEN** OpenCode adds, removes, reorders, or changes the status of an LSP entry
- **THEN** the collapsed count and expanded rows update without restarting, polling, or remounting the panel

### Requirement: Expanded LSP rows
The expanded panel SHALL render one row per LSP entry using the entry `id`, a status-colored bullet, and no root path or textual status label.

#### Scenario: Connected server is rendered
- **WHEN** an LSP entry has status `connected`
- **THEN** its row shows a success-colored bullet followed by its plain server ID

#### Scenario: Failed server is rendered
- **WHEN** an LSP entry has status `error`
- **THEN** its row shows an error-colored bullet followed by its plain server ID

#### Scenario: Unknown future status is received
- **WHEN** OpenCode supplies an LSP status outside `connected` and `error`
- **THEN** the entry remains in host order, remains included in the collapsed count, and renders with a muted bullet
- **AND** the remaining panel continues to render

#### Scenario: Additional host metadata is present
- **WHEN** an LSP entry includes its implementation name and root path
- **THEN** the row displays neither field

### Requirement: Persistent collapse interaction
The panel SHALL expose a collapse or expand marker, SHALL default to expanded when no preference exists, and SHALL persist the user's preference through the plugin KV store independently of the current entry count.

#### Scenario: User collapses or expands the panel
- **WHEN** the user activates the LSP header
- **THEN** the panel toggles between expanded and collapsed forms and stores that preference under a namespaced key

#### Scenario: Plugin restarts
- **WHEN** the plugin starts after a collapse preference has been stored
- **THEN** the panel restores that preference whether the LSP list is empty or populated

#### Scenario: Empty state becomes populated
- **WHEN** an LSP server activates after the panel rendered an empty state
- **THEN** the panel keeps the same collapse preference and updates within the existing component root

### Requirement: Informative empty state
An expanded panel with no LSP entries SHALL show the muted text `LSPs will activate as files are read` instead of a server row.

#### Scenario: No preference and no active servers
- **WHEN** `api.state.lsp()` returns an empty list and no collapse preference exists
- **THEN** the panel shows `▼ LSP`, the header separator, the muted activation hint, and the closing separator

#### Scenario: Empty panel is collapsed
- **WHEN** the LSP list is empty and the stored preference is collapsed
- **THEN** the panel shows `▶ LSP` with a right-aligned `0` and only the header separator

### Requirement: Collapsed active-count summary
The collapsed panel SHALL show the number of entries currently returned by `api.state.lsp()` at the right edge of the header and SHALL hide the count while expanded.

#### Scenario: Populated panel is collapsed
- **WHEN** two LSP entries are active and the panel is collapsed
- **THEN** the header shows `▶ LSP` and a right-aligned `2`

#### Scenario: Panel is expanded
- **WHEN** the panel is expanded
- **THEN** the header shows `▼ LSP` without a count

### Requirement: Bounded compact layout
The panel SHALL fit within 37 terminal cells, use full-width separators immediately below the header and after expanded content, truncate long server IDs with U+2026, and avoid trailing whitespace in textual output.

#### Scenario: Expanded panel contains a long ID
- **WHEN** a server ID exceeds the row's available name region
- **THEN** the ID truncates with an ellipsis and the rendered row does not exceed 37 cells

#### Scenario: Sidebar scrollbar narrows the viewport
- **WHEN** a vertical scrollbar reduces the available row width from 37 to 36 cells
- **THEN** the server ID yields the reduced space and the bullet remains visible

#### Scenario: Panel is collapsed
- **WHEN** the compact form is rendered
- **THEN** only the header and its following full-width separator are visible

#### Scenario: Panel is expanded
- **WHEN** the populated or empty extended form is rendered
- **THEN** a full-width separator appears below the header and another after the last row or empty-state hint

### Requirement: Replacement guidance
The project documentation SHALL explain how to install the standalone LSP plugin and disable `internal:sidebar-lsp` to prevent duplicate panels.

#### Scenario: User follows installation documentation
- **WHEN** a user configures `opencode-tools-lsp` as documented
- **THEN** the documentation identifies the built-in LSP plugin that must be disabled and does not claim the external plugin disables it automatically
