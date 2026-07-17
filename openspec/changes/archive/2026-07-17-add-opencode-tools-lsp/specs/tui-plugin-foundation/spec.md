## MODIFIED Requirements

### Requirement: Declarative standalone plugin manifest
The system SHALL define quota, home, token-report, MCP, and LSP in one data-only manifest that records each source entry, output artifact, normalized runtime ID, optional slot order, and option ownership.

#### Scenario: Current plugins are described
- **WHEN** build, deployment, or runtime metadata is requested for a current TUI feature
- **THEN** the system obtains it from the manifest instead of a second hard-coded feature list

#### Scenario: Runtime IDs are normalized
- **WHEN** the five current plugins load
- **THEN** their IDs use `aamkye/opencode-tools-quota`, `aamkye/opencode-tools-home`, `aamkye/opencode-tools-token-report`, `aamkye/opencode-tools-mcp`, and `aamkye/opencode-tools-lsp`

### Requirement: Thin TUI adapters and shared feature logic
The system SHALL keep reusable feature decisions, models, services, option normalization, and command definitions in shared modules while limiting TUI entries to host binding and Solid/OpenTUI rendering.

#### Scenario: Current adapters are inspected
- **WHEN** quota, home, token-report, MCP, and LSP entries are reviewed
- **THEN** each entry delegates reusable decisions to shared exports and contains only surface-specific host and rendering code

### Requirement: Standalone current plugin artifacts
The build SHALL emit independent quota, home, token-report, MCP, and LSP artifacts that import the managed shared artifact and activate no sibling feature.

#### Scenario: Production build completes
- **WHEN** the plugin build runs
- **THEN** it emits all manifest artifacts without generating a composed activation entry

#### Scenario: One artifact is installed alone
- **WHEN** a user configures any current feature artifact without its siblings
- **THEN** that feature activates without requiring another current feature artifact

### Requirement: Managed configuration migration
Deployment SHALL replace legacy managed entries with manifest-ordered standalone entries for quota, home, token-report, MCP, and LSP while preserving unrelated configuration and applying legacy options only to quota.

#### Scenario: Existing managed installation is deployed
- **WHEN** deployment finds a legacy or current managed installation with quota options
- **THEN** it removes obsolete managed entries and artifacts, writes the five standalone entries once, and attaches the options only to quota

#### Scenario: Deployment repeats
- **WHEN** deployment runs more than once against the migrated configuration
- **THEN** the resulting files and configuration remain unchanged and contain no duplicate managed entry

#### Scenario: Unrelated plugins are configured
- **WHEN** deployment migrates a configuration containing unrelated plugin entries
- **THEN** it preserves those entries and their order relative to each other
