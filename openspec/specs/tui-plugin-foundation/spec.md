# tui-plugin-foundation Specification

## Purpose
TBD - created by archiving change add-opencode-tools-mcp. Update Purpose after archive.
## Requirements
### Requirement: Declarative standalone plugin manifest
The system SHALL define quota, home, token-report, MCP, and LSP in one data-only manifest that records each source entry, output artifact, normalized runtime ID, optional slot order, and option ownership.

#### Scenario: Current plugins are described
- **WHEN** build, deployment, or runtime metadata is requested for a current TUI feature
- **THEN** the system obtains it from the manifest instead of a second hard-coded feature list

#### Scenario: Runtime IDs are normalized
- **WHEN** the five current plugins load
- **THEN** their IDs use `aamkye/opencode-tools-quota`, `aamkye/opencode-tools-home`, `aamkye/opencode-tools-token-report`, `aamkye/opencode-tools-mcp`, and `aamkye/opencode-tools-lsp`

### Requirement: Shared standalone registration contract
The system SHALL create each TUI plugin module through one shared standalone registration and lifecycle contract.

#### Scenario: Standalone feature activates
- **WHEN** OpenCode loads one feature artifact
- **THEN** the shared runtime creates its module shape, activates only that feature, and registers returned cleanup with the host lifecycle

#### Scenario: Activation fails after acquiring resources
- **WHEN** feature activation throws after registering cleanup or acquiring shared services
- **THEN** the runtime releases the acquired resources exactly once before propagating the failure

#### Scenario: Lifecycle is already aborted
- **WHEN** a feature activates against an already-aborted lifecycle
- **THEN** the runtime releases its resources and retains no live registration state

### Requirement: Thin TUI adapters and shared feature logic
The system SHALL keep reusable feature decisions, models, services, option normalization, and command definitions in shared modules while limiting TUI entries to host binding and Solid/OpenTUI rendering.

#### Scenario: Current adapters are inspected
- **WHEN** quota, home, token-report, MCP, and LSP entries are reviewed
- **THEN** each entry delegates reusable decisions to shared exports and contains only surface-specific host and rendering code

### Requirement: API-scoped ref-counted services
The shared runtime SHALL allow standalone plugins to acquire one service instance per TUI API and service key through idempotent reference-counted leases.

#### Scenario: Quota and home run together
- **WHEN** quota and home acquire the provider hub through the same TUI API
- **THEN** they share one hub and one set of provider adapters

#### Scenario: Home activates before configured quota
- **WHEN** home creates the default provider hub before quota supplies normalized provider options
- **THEN** the same hub reconciles its adapters to quota's active construction options and disposes each replaced adapter once

#### Scenario: One consumer releases the provider hub
- **WHEN** one of multiple active leases releases
- **THEN** the hub remains active for the other consumer

#### Scenario: Configured quota releases while home remains
- **WHEN** quota releases its lease and home still holds a lease
- **THEN** the same hub reconciles to the home-only default provider set without interrupting the home consumer

#### Scenario: Final consumer releases the provider hub
- **WHEN** the final active lease releases
- **THEN** the runtime disposes the provider hub exactly once and removes it from the registry

#### Scenario: Feature runs without siblings
- **WHEN** quota or home is the only installed consumer
- **THEN** it creates, uses, and disposes the provider hub without requiring another plugin

### Requirement: Shared compact-sidebar presentation
The system SHALL provide controlled compact-sidebar primitives for headers, collapse markers, collapsed summary segments, full-width separators, bounded content, and status rows.

#### Scenario: Quota migrates to shared primitives
- **WHEN** quota renders through the shared compact-panel shell
- **THEN** its extended, semi-collapsed, and collapsed layouts retain their existing content, colors, ordering, and 37-cell bounds

#### Scenario: Features choose collapse ownership
- **WHEN** a sidebar feature uses the shared shell
- **THEN** the feature supplies its own controlled collapse state and callback, allowing quota to remain ephemeral and MCP to persist its preference

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

### Requirement: Supported OpenCode version
The package SHALL declare OpenCode 1.18.1 as the minimum engine version for this standalone plugin foundation and MCP state API.

#### Scenario: Package metadata is inspected
- **WHEN** a user or package tool reads the OpenCode engine requirement
- **THEN** it reports `>=1.18.1`
