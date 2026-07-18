# mcp-sidebar-status Specification

## Purpose
TBD - created by archiving change add-opencode-tools-mcp. Update Purpose after archive.
## Requirements
### Requirement: Standalone MCP sidebar registration
The system SHALL ship `opencode-tools-mcp` as a standalone TUI plugin artifact that registers an MCP panel immediately after the existing quota panel.

#### Scenario: Plugin is enabled
- **WHEN** the standalone MCP plugin is present in OpenCode's TUI plugin configuration
- **THEN** it registers one MCP panel in the sidebar after the quota panel

#### Scenario: Plugin is built and deployed
- **WHEN** the repository's plugin build or deployment workflow runs
- **THEN** it produces or installs the standalone MCP artifact together with its shared runtime dependency

### Requirement: Reactive MCP status source
The system SHALL derive the panel from the ordered reactive list returned by `api.state.mcp()` and SHALL preserve the order supplied by OpenCode.

#### Scenario: MCP state changes
- **WHEN** OpenCode adds, removes, reorders, or changes the status of an MCP entry
- **THEN** the aggregate and expanded rows update without restarting or polling

### Requirement: Collapsed aggregate summary
The system SHALL show the connected MCP count over the total MCP count at the right edge of the header only while the panel is collapsed.

#### Scenario: Every configured MCP is connected
- **WHEN** two of two MCP entries have status `connected` and the panel is collapsed
- **THEN** the header shows `▶ MCP` and right-aligned `2/2` with both numbers in the success color and the slash muted

#### Scenario: At least one configured MCP is not connected
- **WHEN** two of three MCP entries are connected and the remaining entry is disabled, failed, needs authentication, or needs client registration
- **THEN** the header shows a success-colored `2`, a muted slash, and an error-colored `3`

#### Scenario: Panel is expanded
- **WHEN** the panel is expanded
- **THEN** the header shows `▼ MCP` without the aggregate count

### Requirement: Expanded MCP status rows
The expanded panel SHALL render one row per MCP entry with a status-colored bullet, a truncating server-name region, and a stable muted status label aligned to the right edge.

#### Scenario: Native status roles are rendered
- **WHEN** expanded rows include all supported MCP states
- **THEN** connected uses success, failed and needs-client-registration use error, needs-auth uses warning, and disabled uses muted for their bullets

#### Scenario: Stable labels are rendered
- **WHEN** an MCP row is visible
- **THEN** its right edge shows one of `Connected`, `Disabled`, `Failed`, `Needs auth`, or `Needs client ID` in the muted color
- **AND** runtime error text is not displayed

#### Scenario: Unknown future status is received
- **WHEN** OpenCode supplies an MCP status outside the declared status union
- **THEN** the entry counts as non-connected and renders a muted bullet with the muted label `Unknown`
- **AND** the remaining panel continues to render

### Requirement: Persistent collapse interaction
The panel SHALL always expose a collapse or expand marker and SHALL persist the user's non-empty-panel preference through the plugin KV store.

#### Scenario: User collapses or expands the panel
- **WHEN** the non-empty MCP panel is expanded or collapsed and the user activates its header once
- **THEN** the visible panel immediately toggles between expanded and collapsed forms and stores that preference under a namespaced key
- **AND** the state change does not require a second activation

#### Scenario: Plugin restarts with configured MCP servers
- **WHEN** the plugin starts after a collapse preference has been stored
- **THEN** the panel restores that preference

### Requirement: Compact empty state
The system SHALL render a configured-empty MCP panel as a forced-collapsed header with a muted `0/0` summary and no rows, and SHALL preserve an expand activation received while reactive MCP state is temporarily empty so it takes effect when entries become available.

#### Scenario: No MCP servers are configured
- **WHEN** `api.state.mcp()` returns an empty list
- **THEN** the panel shows `▶ MCP` with right-aligned muted `0/0` and the header separator
- **AND** the forced state does not overwrite the user's stored non-empty preference

#### Scenario: User expands before MCP state hydration completes
- **WHEN** a collapsed preference is stored, the user activates the MCP header while `api.state.mcp()` is empty, and MCP entries then become available
- **THEN** the empty panel remains forced collapsed and performs no KV write before entries arrive
- **AND** the first non-empty state renders expanded and stores the expanded preference without requiring another activation

### Requirement: Bounded quota-like layout
The panel SHALL use the shared compact-sidebar primitives, fit within 37 terminal cells, use full-width separators immediately below the header and at the end of expanded content, and avoid trailing whitespace in textual output.

#### Scenario: Shared shell renders MCP
- **WHEN** the MCP adapter supplies its model and controlled collapse state to the shared compact-panel shell
- **THEN** the shell renders the same marker, header, summary-segment, and separator conventions used by quota

#### Scenario: Expanded panel contains long names
- **WHEN** server names compete with their status labels for horizontal space
- **THEN** names truncate before the right-aligned status labels and no rendered row exceeds 37 cells

#### Scenario: Sidebar scrollbar narrows the viewport
- **WHEN** a vertical scrollbar reduces the available row width from 37 to 36 cells
- **THEN** the server name yields the reduced space and the complete right-aligned status label remains visible

#### Scenario: Panel is collapsed
- **WHEN** the compact form is rendered
- **THEN** only the header and its following full-width separator are visible

#### Scenario: Panel is expanded
- **WHEN** one or more MCP rows are rendered
- **THEN** a full-width separator appears below the header and another appears after the last row

### Requirement: Replacement guidance
The project documentation SHALL explain how to install the standalone MCP plugin and disable `internal:sidebar-mcp` to prevent duplicate panels.

#### Scenario: User follows installation documentation
- **WHEN** a user configures `opencode-tools-mcp` as documented
- **THEN** the documentation identifies the built-in MCP plugin that must be disabled and does not claim the external plugin disables it automatically

