## ADDED Requirements

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
The quota panel SHALL preserve provider window groups, derive OpenAI window labels from API durations, and right-align Z.AI Peak/Off-Peak status.

#### Scenario: OpenAI exposes only a weekly primary window
- **WHEN** OpenAI returns one primary window with a seven-day duration and no secondary window
- **THEN** the panel renders one `7D` window
- **AND** it does not render a `5H` window

#### Scenario: Z.AI status and tool details
- **WHEN** Z.AI quota includes Peak/Off-Peak state and tool usage details
- **THEN** the Peak/Off-Peak status is colored and aligned at the right edge of the Z.AI header
- **AND** tool usage details remain below the quota windows
- **AND** tool used and total quantities use the muted text color

### Requirement: Configurable provider refresh
The quota panel SHALL poll provider APIs at a configurable interval and SHALL default that interval to 10 seconds.

#### Scenario: Default polling
- **WHEN** no refresh interval is configured
- **THEN** each available non-exhausted provider polls at a 10-second interval
- **AND** countdown text continues updating once per second

#### Scenario: Custom polling
- **WHEN** a positive `refreshIntervalSeconds` value is configured
- **THEN** non-exhausted provider polling uses that interval

#### Scenario: Exhausted primary quota
- **WHEN** a provider's primary quota is exhausted
- **THEN** regular polling retains the existing five-minute backoff
- **AND** reset-boundary refresh remains immediate

#### Scenario: Invalid polling configuration
- **WHEN** the refresh interval is absent, non-numeric, or non-positive
- **THEN** provider polling falls back to 10 seconds

### Requirement: Active provider prioritization
The quota panel SHALL use the current sidebar session's latest selected model to prioritize and refresh its quota provider.

#### Scenario: Active model changes provider
- **WHEN** the latest user message selects a model from a different supported provider
- **THEN** the panel refreshes that provider immediately
- **AND** moves its quota section above `Other providers`
- **AND** keeps the provider header unchanged without adding the model name

#### Scenario: Session has no selected model
- **WHEN** the current session has no usable user-message model selection
- **THEN** the panel falls back to configured/provider state for provider priority
