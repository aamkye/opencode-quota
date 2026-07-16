# quota-panel-rendering Specification

## Purpose
TBD - created by archiving change fix-quota-panel-rendering. Update Purpose after archive.
## Requirements
### Requirement: Responsive quota rows
The quota panel SHALL allocate mounted rows from the actual parent width, SHALL begin progress bars immediately after a three-cell label region, and SHALL keep the percentage at the right edge.

#### Scenario: Normal sidebar width
- **WHEN** a progress row is rendered in the sidebar
- **THEN** its bar consumes only the flexible space between the three-cell label and four-cell percentage
- **AND** the percentage remains visible at the right edge

#### Scenario: Constrained sidebar width
- **WHEN** the sidebar narrows
- **THEN** the bar shrinks before the label or percentage is removed
- **AND** no precomputed 80-cell row overflows the parent

#### Scenario: Constrained compact table
- **WHEN** a mounted compact table renders in a constrained sidebar
- **THEN** each row stays within the actual parent width
- **AND** its cells shrink and clip without wrapping
- **AND** production table layout does not use the deterministic 80-cell fallback allocation

### Requirement: Standard panel framing
The quota panel SHALL render a spaced collapse marker, a divider immediately below the `Quota` title, muted short group dividers, indented muted reset details without repeating the window label, and the active provider summary at the right edge when collapsed.

#### Scenario: Expanded panel
- **WHEN** the quota panel is expanded
- **THEN** its title begins with `▼ Quota`
- **AND** a divider follows the title row
- **AND** short `---` group-divider marks use the muted text color
- **AND** reset rows begin with three spaces followed by the reset text
- **AND** reset rows use the muted text color

#### Scenario: Collapsed panel
- **WHEN** the quota panel is collapsed with active provider percentages available
- **THEN** it begins with `▶ Quota`
- **AND** the active provider percentage summary is colored and aligned at the right edge

### Requirement: Configurable progress colors
The quota panel SHALL color progress bars and percentages by remaining quota using native plugin options and SHALL support disabling those colors.

#### Scenario: Default thresholds
- **WHEN** no progress color options are supplied
- **THEN** remaining quota at or below 10 percent uses error status
- **AND** remaining quota at or below 30 percent uses warning status
- **AND** higher remaining quota uses success status
- **AND** the status colors only the filled bar segment and percentage
- **AND** the label stays neutral and the empty bar stays muted

#### Scenario: Custom thresholds
- **WHEN** valid `progressColors.errorBelow` and `progressColors.warningBelow` values are supplied
- **THEN** progress status uses those thresholds
- **AND** thresholds evaluate remaining quota when the displayed percentage mode is `used`

#### Scenario: Colors disabled
- **WHEN** `progressColors.enabled` is false
- **THEN** progress bars and percentages render without a semantic color status

### Requirement: Accurate provider presentation
The quota panel SHALL preserve provider window groups, derive OpenAI window labels from API durations, right-align Z.AI Peak/Off-Peak status, and allow the Z.AI tool section to be hidden by configuration.

#### Scenario: OpenAI exposes only a weekly primary window
- **WHEN** OpenAI returns one primary window with a seven-day duration and no secondary window
- **THEN** the panel renders one `7D` window
- **AND** it does not render a `5H` window

#### Scenario: Z.AI status and visible tool details
- **WHEN** Z.AI quota includes Peak/Off-Peak state and tool usage details and `quota.zai.hideTools` is not true
- **THEN** the Peak/Off-Peak status is colored and aligned at the right edge of the Z.AI header
- **AND** tool usage details remain below the quota windows
- **AND** tool used and total quantities use the muted text color

#### Scenario: Z.AI tool details are hidden
- **WHEN** Z.AI quota includes tool usage details and `quota.zai.hideTools` is true
- **THEN** no tool progress, reset, quantity, spacer, or model-table item is rendered

#### Scenario: Provider groups and items arrive out of physical order
- **WHEN** a provider model contains multiple groups or items whose array order differs from semantic `order`
- **THEN** each provider group is sorted and partitioned independently
- **AND** reset, quantity, text, and table details remain attached to the progress window in their own group
- **AND** one group's preamble or details do not attach to another group's window

#### Scenario: Provider quota is stale
- **WHEN** OpenAI displays stale quota
- **THEN** yellow `stale` text is right-aligned in the provider header
- **AND** no standalone stale row is rendered
- **WHEN** Z.AI displays stale quota
- **THEN** its Peak/Off-Peak header segment retains its semantic color
- **AND** a muted ` / ` separator precedes yellow `stale` text
- **AND** no standalone stale row is rendered

### Requirement: Configurable provider refresh
The quota panel SHALL poll provider APIs at a configurable interval from `quota.refreshIntervalSeconds` and SHALL default that interval to 10 seconds.

#### Scenario: Default polling
- **WHEN** no refresh interval is configured
- **THEN** each available non-exhausted provider polls at a 10-second interval
- **AND** countdown text continues updating once per second

#### Scenario: Custom polling
- **WHEN** a positive `quota.refreshIntervalSeconds` value is configured
- **THEN** non-exhausted provider polling uses that interval

#### Scenario: Exhausted primary quota
- **WHEN** a provider's primary quota is exhausted
- **THEN** regular polling retains the existing five-minute backoff
- **AND** reset-boundary refresh remains immediate

#### Scenario: Invalid polling configuration
- **WHEN** the refresh interval is absent, non-numeric, or non-positive
- **THEN** provider polling falls back to 10 seconds

### Requirement: Credential-safe provider lifecycle
The OpenAI and Z.AI quota adapters SHALL prevent replaced-credential requests from publishing current data and SHALL abort active requests when their provider lifecycle ends.

#### Scenario: Credentials change while quota is visible
- **WHEN** a replacement credential arrives while a request is active
- **THEN** the existing quota remains visible with `stale` status
- **AND** the active old-credential request is aborted
- **AND** its result cannot publish current provider state
- **AND** exactly one request starts for the replacement credential
- **AND** a successful replacement response publishes new quota with ready status
- **AND** a failed replacement response leaves the prior quota stale

#### Scenario: Credentials are removed
- **WHEN** the current provider credential is removed
- **THEN** prior account quota is cleared
- **AND** the provider becomes unavailable

#### Scenario: Provider is disposed during a request
- **WHEN** the provider lifecycle is disposed while a request is unresolved
- **THEN** the active request is aborted immediately
- **AND** its timeout is cleared
- **AND** late fulfillment or rejection cannot mutate provider state

### Requirement: Active provider prioritization
The quota panel SHALL use the current sidebar session's latest selected model to prioritize and refresh its configured supported quota provider, and SHALL honor configured inactive-provider visibility.

#### Scenario: Active model changes provider
- **WHEN** the latest user message selects a model from a different configured supported provider
- **THEN** the panel refreshes that provider immediately
- **AND** moves its quota section above `Other providers`
- **AND** keeps the provider header unchanged without adding the model name

#### Scenario: Configured inactive providers are hidden
- **WHEN** the effective `hideInactive` setting for a configured non-selected provider is true
- **THEN** the panel SHALL omit that provider from `Other providers`

#### Scenario: Session has no selected model
- **WHEN** the current session has no usable user-message model selection
- **THEN** the panel falls back to configured/provider state for provider priority

### Requirement: Unconfigured provider suppression
The quota panel SHALL exclude Z.AI and OpenAI adapters with no usable credential and an OpenCode Go adapter with no valid workspace configuration from selected and inactive provider rendering.

#### Scenario: A known provider is unconfigured
- **WHEN** a quota provider lacks its required local credential or configuration
- **THEN** the quota panel SHALL not render that provider or a configuration placeholder

#### Scenario: A configured provider cannot retrieve quota
- **WHEN** a provider has usable local credential or configuration but cannot retrieve quota
- **THEN** the quota panel SHALL retain its existing unavailable or stale behavior

### Requirement: Unsupported active provider status
The quota panel SHALL render an explicitly selected session provider without a quota adapter as unsupported. The expanded status and fully collapsed summary SHALL identify the provider and render `unsupported` as a right-aligned error-status segment.

#### Scenario: Session selects an unsupported provider
- **WHEN** the latest user-message model uses a provider without a quota adapter
- **THEN** the expanded quota panel SHALL render that provider with a right-aligned red `unsupported` status
- **AND** the fully collapsed quota panel SHALL render the provider and the same right-aligned red `unsupported` status

#### Scenario: No session model is selected
- **WHEN** the current session has no usable user-message model selection
- **THEN** provider fallback SHALL continue to prefer a configured supported quota provider
