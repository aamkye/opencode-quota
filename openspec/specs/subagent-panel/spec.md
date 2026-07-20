# subagent-panel Specification

## Purpose
TBD - created by archiving change add-subagent-panel. Update Purpose after archive.
## Requirements
### Requirement: Direct-child session discovery
The system SHALL list only sessions whose `parentID` exactly matches the currently viewed session. It SHALL order those child sessions newest-first by creation time with a stable tie-breaker.

#### Scenario: Direct and nested children
- **WHEN** the viewed session has direct children and those children have their own descendants
- **THEN** the panel lists only the direct children

#### Scenario: Viewed child session
- **WHEN** the user opens a child session that has its own direct children
- **THEN** the panel rebuilds to show those children rather than siblings from the previous parent

#### Scenario: Stable newest-first ordering
- **WHEN** multiple direct children exist
- **THEN** entries render newest-first and equal creation times are resolved deterministically

### Requirement: Primary and Rest grouping
The system SHALL place the newest five direct children in the primary group and all remaining direct children in an independently collapsible Rest group.

#### Scenario: Five or fewer children
- **WHEN** the viewed session has at most five direct children
- **THEN** all entries appear in the primary group and no Rest group is rendered

#### Scenario: More than five children
- **WHEN** the viewed session has more than five direct children
- **THEN** the newest five appear before the internal divider and all older entries appear under Rest

#### Scenario: Rest is collapsed
- **WHEN** the user collapses Rest
- **THEN** Rest entries are hidden while primary entries and the outer panel remain expanded

### Requirement: Subagent status classification
The system SHALL classify each direct child as successful, running, or failed using observed terminal errors, assistant-message errors, synchronized session status, and assistant-result fallback in that precedence order.

#### Scenario: Busy or retrying child
- **WHEN** synchronized child status is busy or retry
- **THEN** the child is running unless durable failure evidence exists

#### Scenario: Idle child without error
- **WHEN** synchronized child status is idle and no failure evidence exists
- **THEN** the child is successful

#### Scenario: Child session error
- **WHEN** a child emits `session.error` or contains an assistant-message error
- **THEN** the child is failed; `session.error` remains persisted until child pruning, while an assistant error remains reconstructible for as long as that message exists

#### Scenario: Child without synchronized status
- **WHEN** no current status is available
- **THEN** a completed error-free assistant result classifies the child as successful, while an in-progress assistant or a child without a completed result remains running

### Requirement: Duration and detail model
The system SHALL show a child title and compact duration in each entry row. Compact durations and expanded `time` values SHALL use the child's semantic status color. An expanded entry SHALL show agent, status, time, model, and Open Session rows in the AGENTS.md order. Agent and model SHALL use fields from the single newest assistant message, then corresponding fields from the single newest user message, and SHALL fall back independently to `-` without scanning older assistant or user messages.

#### Scenario: Running duration
- **WHEN** a child is running
- **THEN** its duration advances from creation time on a one-second clock

#### Scenario: Successful duration
- **WHEN** a child is successful
- **THEN** its duration remains fixed at the nonnegative difference between updated and created timestamps

#### Scenario: Failed duration
- **WHEN** a child fails
- **THEN** its duration remains fixed at the nonnegative difference between the earliest retained event or assistant-message failure time and creation time

#### Scenario: Status-colored time
- **WHEN** a child renders a compact duration or expanded `time` value
- **THEN** successful time is green, running time is yellow, and failed time is red

#### Scenario: One expanded entry
- **WHEN** the user expands one child and then expands another
- **THEN** only the second child detail block remains expanded

#### Scenario: Open child session
- **WHEN** the user activates Open Session for an expanded child
- **THEN** the TUI navigates to the `session` route with that child's session ID

#### Scenario: Missing child identity
- **WHEN** a child has no assistant or user message that supplies agent or model identity
- **THEN** the corresponding detail value renders `-`

### Requirement: AGENTS.md SubAgent layout
The system SHALL render a plain `SubAgent` panel matching the expanded, semi-collapsed, collapsed, Rest, and one-detail layouts, spacing, alignment, symbols, colors, end ellipsis, dividers, maximum width, and no-trailing-whitespace rules in `AGENTS.md`. Entry rows SHALL use only a disclosure marker, title, one-cell gap, and duration, with no status bullet. The Rest disclosure and explicit three-dash divider segments SHALL use the muted theme color.

#### Scenario: Expanded panel
- **WHEN** the panel and Rest are expanded
- **THEN** disclosure markers, names, status-colored durations, optional detail, spaced internal divider, muted Rest header, and panel divider render in the specified order without status bullets

#### Scenario: Semi-collapsed panel
- **WHEN** the panel is expanded and Rest is collapsed
- **THEN** primary entries and the collapsed Rest header render without Rest entries

#### Scenario: Collapsed panel
- **WHEN** the outer panel is collapsed
- **THEN** its header renders `<successful>/<running>/<failed>` and no entry body, followed by the panel divider

#### Scenario: Long child title
- **WHEN** title plus duration exceeds available width
- **THEN** the title truncates with one ellipsis at its end while disclosure, one-cell title/time gap, duration, and row width remain intact

#### Scenario: Initial title measurement
- **WHEN** an entry row first mounts before any later viewport resize
- **THEN** the child title is visible and end-truncated to its initial rendered width

#### Scenario: Scrollbar-reduced row width
- **WHEN** a visible scrollbar removes one cell from the SubAgent row
- **THEN** the title remeasures and end-truncates while the one-cell title/time gap and complete duration remain visible

#### Scenario: No direct children
- **WHEN** the viewed session has no direct children
- **THEN** the expanded panel renders muted `No subagents` and the collapsed summary is `0/0/0`

#### Scenario: Initial snapshot loading
- **WHEN** the first snapshot or one of its bounded retries is pending
- **THEN** the plugin produces no panel output

#### Scenario: Initial snapshot unavailable
- **WHEN** the first snapshot exhausts its bounded retries without a complete result
- **THEN** the plugin produces no panel output

#### Scenario: Stale expanded header
- **WHEN** a background snapshot exhausts its retries after a complete result and the panel is expanded
- **THEN** the complete entry body remains visible and warning `stale` renders at the right edge of the header

#### Scenario: Stale collapsed header
- **WHEN** a background snapshot exhausts its retries after a complete result and the panel is collapsed
- **THEN** warning `stale` renders before the preserved `<successful>/<running>/<failed>` summary within 37 cells

#### Scenario: Rest visual treatment
- **WHEN** the Rest group is present in expanded or collapsed form
- **THEN** its disclosure and title are muted and the preceding divider renders muted `---`, flexible space, and `---`

### Requirement: Disclosure persistence and state recovery
The system SHALL persist outer panel collapse, Rest collapse, and at most one expanded child ID per viewed parent. It SHALL rebuild child records from current OpenCode state and persist only failure terminals that cannot be reconstructed reliably.

#### Scenario: Panel remount
- **WHEN** the plugin remounts for a previously viewed parent
- **THEN** valid panel, Rest, and child disclosure choices are restored and entries are rebuilt from session state

#### Scenario: Persisted child is gone
- **WHEN** a persisted expanded child no longer exists or no longer belongs to the viewed parent
- **THEN** the stale expansion and retained failure metadata are removed

#### Scenario: Session switch race
- **WHEN** a rebuild for the previous parent completes after the viewed session changes
- **THEN** the stale result does not replace the current parent's entries

### Requirement: Event and lifecycle handling
The system SHALL update child topology and status after relevant session and message events using a 200 ms debounce, one message-request limit of four shared across overlapping generations, 2/4/8-second retry delays, stale-generation cancellation, and complete-only snapshot publication. It SHALL release every subscription, timer, queued request, and scheduled rebuild when disposed.

#### Scenario: Child lifecycle transition
- **WHEN** a direct child is created, becomes idle, retries, fails, updates, or is deleted
- **THEN** the panel immediately invalidates in-flight work, schedules one debounced rebuild, or applies the terminal state and renders the resulting model

#### Scenario: Event during initial reconstruction
- **WHEN** a direct child changes after topology discovery but before the initial complete snapshot publishes
- **THEN** the event supersedes the in-flight generation and the next complete snapshot includes the change

#### Scenario: Background snapshot failure and recovery
- **WHEN** a background snapshot exhausts retries and a later relevant event produces a complete snapshot
- **THEN** the panel retains the previous complete entries as stale, then publishes the new entries and clears stale

#### Scenario: Plugin disposal
- **WHEN** the plugin lifecycle is disposed
- **THEN** all event subscriptions and clocks stop and no later callback mutates panel state

### Requirement: Standalone plugin integration
The system SHALL expose SubAgent as an independently buildable and deployable plugin through the same manifest, package export, shared module, runtime wrapper, and managed deployment paths as LSP, MCP, and TODO. Sidebar slot order SHALL be Home 1, Context 100, SesTokens 110, SubAgent 120, Quota 130, MCP 140, LSP 150, and TODO 160.

#### Scenario: Build and package discovery
- **WHEN** plugin manifest and package wiring are validated
- **THEN** SubAgent has a unique key, ID, source, output artifact, sidebar order, and package export

#### Scenario: Shared feature contract
- **WHEN** tests or the panel consume SubAgent model logic
- **THEN** they import it through `shared/opencode-tools-shared.ts` rather than duplicating feature transformations

#### Scenario: Confirmed sidebar order
- **WHEN** manifest order and slot values are validated
- **THEN** every sidebar plugin appears in the confirmed order and Token Report remains outside sidebar ordering
