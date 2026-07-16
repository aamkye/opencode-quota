# quota-provider-configuration Specification

## Purpose
TBD - created by archiving change refine-quota-provider-visibility. Update Purpose after archive.
## Requirements
### Requirement: Unified quota configuration hierarchy
The quota plugin SHALL read all quota settings from the `quota` object. It SHALL read refresh interval and progress colors from `quota.refreshIntervalSeconds` and `quota.progressColors`, percentage mode from `quota.percentageMode`, and inactive-provider ordering from `quota.otherProviders.sortDirection`. It SHALL ignore former top-level quota option paths.

#### Scenario: Nested configuration is valid
- **WHEN** valid values are supplied under `quota`
- **THEN** the plugin SHALL apply those values to polling, progress colors, percentage mode, and inactive-provider ordering

#### Scenario: Legacy top-level configuration is supplied
- **WHEN** a former top-level quota option is supplied without its `quota.*` replacement
- **THEN** the plugin SHALL ignore it and use the documented default for that setting

### Requirement: Configurable inactive provider visibility
The quota plugin SHALL support `quota.hideInactive` and the provider-specific `quota.openai.hideInactive`, `quota.zai.hideInactive`, and `quota.opencodego.hideInactive` options. Each provider-specific value SHALL override the global value when defined; otherwise it SHALL inherit the global value; all omitted values SHALL default to false.

#### Scenario: Global inactive hiding is enabled
- **WHEN** `quota.hideInactive` is true and no provider-specific override exists
- **THEN** each configured non-selected quota provider SHALL be hidden

#### Scenario: Provider-specific visibility overrides global hiding
- **WHEN** `quota.hideInactive` is true and a provider-specific `hideInactive` is false
- **THEN** that configured non-selected provider SHALL remain visible

#### Scenario: Provider-specific hiding overrides global visibility
- **WHEN** `quota.hideInactive` is false and a provider-specific `hideInactive` is true
- **THEN** that configured non-selected provider SHALL be hidden

### Requirement: Configurable Z.AI tool section
The quota plugin SHALL support `quota.zai.hideTools`, which defaults to false.

#### Scenario: Tool section is hidden
- **WHEN** `quota.zai.hideTools` is true and Z.AI quota includes a time limit
- **THEN** the Z.AI panel SHALL omit the time-limit bar, reset, spacer, usage quantities, and model table
