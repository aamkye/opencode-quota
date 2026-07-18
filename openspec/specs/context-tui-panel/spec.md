# context-tui-panel Specification

## Purpose
Define the standalone Context TUI sidebar panel that reports the active model's context limit, current usage, and cumulative session spend with reactive, width-safe, persistent expanded and collapsed presentation.
## Requirements
### Requirement: Context plugin registration
The system SHALL package Context as a separate TUI plugin that can be registered independently and SHALL order its sidebar panel after MCP and before LSP.

#### Scenario: Context plugin is built
- **WHEN** the plugin build runs
- **THEN** it produces the declared Context plugin artifact and exposes the corresponding package export

#### Scenario: Sidebar plugins render in order
- **WHEN** Context, MCP, and LSP plugins are registered together
- **THEN** Context is ordered after MCP and before LSP

### Requirement: Expanded context metrics
The Context panel SHALL display the active model's context token limit as `Tokens`, the OpenCode-compatible current context percentage as `Used`, and cumulative assistant-message session cost as `Spent` while expanded.

#### Scenario: Session has complete metrics
- **WHEN** the active session has a token-bearing assistant message, resolvable model context limit, and message costs
- **THEN** the expanded panel displays compact token-limit text, a rounded usage percentage, and USD cost with two decimal places

#### Scenario: Multiple assistant messages have costs
- **WHEN** the active session contains multiple assistant messages with costs
- **THEN** `Spent` equals the sum of those assistant-message costs

### Requirement: OpenCode-compatible usage calculation
The system SHALL calculate current context usage from the newest assistant message with a non-zero token total and the context limit of the model associated with that message.

#### Scenario: Earlier messages contain token data
- **WHEN** multiple assistant messages contain token data
- **THEN** `Used` is based on the newest token-bearing assistant message rather than cumulative session tokens

#### Scenario: Context has been compacted
- **WHEN** older session messages remain but a newer post-compaction assistant message has a lower token total
- **THEN** `Used` reflects the newer message's context consumption

#### Scenario: Current context exceeds the model limit
- **WHEN** the newest token-bearing assistant message totals 105 percent of the model context limit
- **THEN** `Used` and the collapsed summary display `105%` without clamping to `100%`

### Requirement: Collapsible persistent presentation
The Context panel SHALL support expanded and collapsed presentation using the shared panel conventions and SHALL persist the user's state through TUI key-value storage.

#### Scenario: User collapses a populated panel
- **WHEN** the user toggles an expanded Context panel with known usage
- **THEN** the panel renders `▶ Context` with the usage percentage summary and hides metric rows

#### Scenario: User expands the panel
- **WHEN** the user toggles a collapsed Context panel
- **THEN** the panel renders `▼ Context`, the divider, and all three metric rows

#### Scenario: Plugin remounts
- **WHEN** the Context plugin remounts after the user changed its collapse state
- **THEN** it restores the persisted state

### Requirement: Safe unavailable state
The Context panel MUST remain renderable when the session, token-bearing message, or model context limit is unavailable.

#### Scenario: New session has no assistant response
- **WHEN** the active session has no token-bearing assistant message
- **THEN** `Tokens` and `Used` display `-`, `Spent` displays `$0.00`, and the plugin does not throw

#### Scenario: Model metadata is unavailable
- **WHEN** token data exists but its model context limit cannot be resolved
- **THEN** `Tokens` and `Used` display `-` while `Spent` still displays the available cumulative cost

#### Scenario: Unavailable panel is collapsed
- **WHEN** usage is unavailable and the panel is collapsed
- **THEN** its summary displays `-`

### Requirement: Reactive and width-safe rendering
The Context panel SHALL update from reactive TUI state and SHALL fit the 37-column sidebar layout without trailing whitespace in its content values.

#### Scenario: Assistant response completes
- **WHEN** the active session receives updated message token or cost data
- **THEN** the visible Context metrics update without remounting the plugin

#### Scenario: Active session changes
- **WHEN** the sidebar switches to another session
- **THEN** the Context panel displays metrics for the new session only

#### Scenario: Values are large
- **WHEN** token or cost values require compact formatting
- **THEN** labels and values stay within the 37-column panel allocation
