## ADDED Requirements

### Requirement: Session-tree token aggregation
The system SHALL aggregate token usage for the currently viewed session and every reachable descendant session exactly once. Each assistant message SHALL add one turn and SHALL contribute its input, output, reasoning, cache-read, and cache-write token values.

#### Scenario: Root session without descendants
- **WHEN** the viewed session has assistant messages and no child sessions
- **THEN** SesTokens reports the turns and token categories from that session only

#### Scenario: Nested descendant tree
- **WHEN** the viewed session has direct and deeply nested child sessions
- **THEN** SesTokens includes every reachable descendant exactly once regardless of tree depth

#### Scenario: Non-assistant messages
- **WHEN** the session tree contains user or other non-assistant messages
- **THEN** those messages do not affect turns or token totals

### Requirement: Token arithmetic and formatting
The system SHALL define total tokens as input plus output plus reasoning plus cache-read plus cache-write tokens. It SHALL define cache-hit ratio as cache-read divided by input plus cache-write and SHALL format counts using compact `K` and `M` suffixes without unnecessary trailing zeroes.

#### Scenario: Normal cache ratio
- **WHEN** cache-read is nonzero and input plus cache-write is nonzero
- **THEN** the panel renders their ratio to one decimal place followed by `×`

#### Scenario: Zero cache denominator
- **WHEN** input plus cache-write is zero
- **THEN** the panel renders `∞` if cache-read is nonzero and `-` otherwise

#### Scenario: Compact values
- **WHEN** a count crosses a thousand or million boundary
- **THEN** the panel renders the value with the corresponding compact uppercase suffix

### Requirement: AGENTS.md SesTokens layout
The system SHALL render a plain `SesTokens` panel matching the expanded and collapsed layouts, row order, dividers, spacing, alignment, symbols, colors, maximum width, and no-trailing-whitespace rules in `AGENTS.md`.

#### Scenario: Expanded panel
- **WHEN** SesTokens is expanded with a complete snapshot
- **THEN** it renders turns, input, output, cache write, cache read, cache hit ratio, reasoning, an internal divider, and total in the specified order, followed by the panel divider

#### Scenario: Collapsed panel
- **WHEN** SesTokens is collapsed
- **THEN** its header renders `Σ <total> / ↻ <turns>` and no metric body rows, followed by the panel divider

#### Scenario: Sidebar width boundary
- **WHEN** the panel is rendered at 37 cells or narrower
- **THEN** every row respects available width and produces no trailing whitespace

#### Scenario: Initial snapshot loading
- **WHEN** the initial snapshot request or a bounded retry is pending
- **THEN** the expanded panel renders muted `Loading...` and the collapsed panel uses muted `Loading...` as its summary without claiming token totals

#### Scenario: Initial snapshot unavailable
- **WHEN** every bounded initial attempt fails and no complete snapshot exists
- **THEN** the expanded panel renders muted `Usage unavailable` and the collapsed panel uses muted `Usage unavailable` as its summary without claiming token totals

#### Scenario: Stale expanded header
- **WHEN** a background refresh fails after a complete snapshot and the panel is expanded
- **THEN** the panel retains every metric row and renders warning `stale` right-aligned in the header

#### Scenario: Stale collapsed header
- **WHEN** a background refresh fails after a complete snapshot and the panel is collapsed
- **THEN** the panel renders warning `stale` before `Σ <total> / ↻ <turns>` and preserves the one-cell separator and 37-cell limit

### Requirement: Event-driven resilient refresh
The system SHALL refresh the active session-tree snapshot after relevant session and message lifecycle events using debounce, bounded request concurrency, bounded retry, and stale-generation protection. It MUST publish only complete snapshots.

#### Scenario: Relevant message update
- **WHEN** an assistant message in the known session tree is updated or removed
- **THEN** SesTokens schedules one debounced refresh and publishes the new complete totals

#### Scenario: Descendant topology change
- **WHEN** a child session is created, updated, or deleted beneath the viewed session
- **THEN** SesTokens refreshes the traversed tree and its aggregate

#### Scenario: Stale request completion
- **WHEN** an older refresh finishes after the viewed session changes or a newer refresh completes
- **THEN** the older result does not replace the current snapshot

#### Scenario: Background refresh failure
- **WHEN** a refresh fails after a complete snapshot has been displayed
- **THEN** SesTokens retains the last complete snapshot, marks it stale, and does not publish partial values

#### Scenario: Stale snapshot recovery
- **WHEN** a refresh succeeds after SesTokens marked the previous snapshot stale
- **THEN** SesTokens publishes the new complete snapshot and removes the stale status

### Requirement: Session switching and lifecycle cleanup
The system SHALL target only the currently viewed session, persist only collapse state, and release every timer and event subscription when disposed.

#### Scenario: Viewed session changes
- **WHEN** the sidebar slot or TUI selection changes to another session
- **THEN** SesTokens loads that session tree and prevents results from the previous session from appearing

#### Scenario: Collapse state remount
- **WHEN** the user toggles SesTokens and the plugin later remounts
- **THEN** the panel restores the persisted collapsed or expanded state

#### Scenario: Plugin disposal
- **WHEN** the plugin lifecycle is disposed
- **THEN** all subscriptions and scheduled refresh work are cancelled and no later callback mutates panel state

### Requirement: Standalone plugin integration
The system SHALL expose SesTokens as an independently buildable and deployable plugin through the same manifest, package export, shared module, runtime wrapper, and managed deployment paths as LSP, MCP, and TODO.

#### Scenario: Build and package discovery
- **WHEN** plugin manifest and package wiring are validated
- **THEN** SesTokens has a unique key, ID, source, output artifact, sidebar order, and package export

#### Scenario: Shared feature contract
- **WHEN** tests or the panel consume SesTokens model logic
- **THEN** they import it through `shared/opencode-tools-shared.ts` rather than duplicating feature transformations
