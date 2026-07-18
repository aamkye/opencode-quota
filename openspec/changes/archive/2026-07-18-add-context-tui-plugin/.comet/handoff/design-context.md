# Comet Design Handoff

- Change: add-context-tui-plugin
- Phase: design
- Mode: compact
- Context hash: a79f8d240e01f38ae1fb6993792394b4e4c24fc539547e61fee35d3842b1e277

Generated-by: comet-handoff.sh

OpenSpec remains the canonical capability spec. This handoff is a deterministic, source-traceable context pack, not an agent-authored summary.

## openspec/changes/add-context-tui-plugin/proposal.md

- Source: openspec/changes/add-context-tui-plugin/proposal.md
- Lines: 1-25
- SHA256: 6be9f33b0588727fd165bbc91f6fd4bc32bd8af40007c42a53a53775bf5b4955

```md
## Why

The TUI sidebar exposes quota, MCP, LSP, and TODO information but does not expose the active session's context-window usage or accumulated cost. A dedicated Context panel will make those metrics visible in the same compact, collapsible format defined in `AGENTS.md`.

## What Changes

- Add a separate Context TUI sidebar plugin ordered after MCP and before LSP.
- Display the active model's context token limit, OpenCode-compatible context usage percentage, and cumulative session cost.
- Support expanded and collapsed layouts, persisted collapse state, and safe placeholders when metrics are unavailable.
- Register and package the plugin as its own export and build artifact.
- Add model, mounted-component, type, build, and documentation coverage for the plugin.

## Capabilities

### New Capabilities

- `context-tui-panel`: A reactive, collapsible sidebar panel for session context limit, usage, and spend metrics.

### Modified Capabilities

None.

## Impact

The change affects the TUI plugin manifest and runtime descriptor types, package exports, shared presentation/model exports, sidebar slot ordering, plugin build and deployment outputs, tests, and plugin registration documentation. It uses existing OpenCode TUI session-message and provider-model state without adding dependencies or changing host APIs.

```

## openspec/changes/add-context-tui-plugin/design.md

- Source: openspec/changes/add-context-tui-plugin/design.md
- Lines: 1-64
- SHA256: 551b0bafdd612361ffcd451b61e806356662a1a0e9bab1fa84ea95b4ac5e3344

```md
## Context

The project packages each sidebar feature as an independent Solid TUI plugin registered through `sidebar_content`. MCP, LSP, and TODO share `CompactPanel`, persist collapse state through `api.kv`, and obtain reactive data from `api.state`. The Context panel needs the same lifecycle while deriving metrics from session messages and provider model metadata exposed by the OpenCode TUI API.

The target layout is fixed at the 37-column sidebar contract in `AGENTS.md`. OpenCode already defines the desired metric semantics: cumulative assistant-message cost for spend, the latest token-bearing assistant message for current context consumption, and that message's model context limit for the percentage denominator.

## Goals / Non-Goals

**Goals:**

- Ship Context as a separately registerable plugin between MCP and LSP.
- Mirror OpenCode's context-limit, current-usage, and session-cost semantics.
- Remain reactive as the active session, messages, or model metadata changes.
- Match the shared expanded/collapsed panel behavior, 37-column allocation, and persisted state conventions.
- Render stable placeholders when token or model information is not yet available.

**Non-Goals:**

- Estimate costs from external pricing data or change token-report behavior.
- Fetch provider quota data or add a new OpenCode host API.
- Combine Context with an existing plugin bundle.
- Redesign other sidebar panels beyond assigning slot orders that preserve the required sequence.

## Decisions

### Use a pure Context panel model plus a thin TUI component

A shared model function will accept session messages and provider metadata and return already formatted values for `Tokens`, `Used`, `Spent`, and the collapsed summary. The Solid component will own only session selection, collapse persistence, and rendering. This follows the model/mounted-test split used by MCP, LSP, and TODO and keeps host-shape handling testable without mounting Solid.

Alternatives considered:

- Compute values inline in JSX: smaller initially, but couples host data interpretation to rendering and makes boundary coverage harder.
- Extend the generic quota `PanelRenderer`: rejected because Context has only three right-aligned quantities and matches `CompactPanel` more directly.

### Mirror OpenCode's context metric calculation

Spend will sum `cost` across assistant messages in the active session. Current context tokens will come from the newest assistant message with a non-zero token total. The model context limit will be resolved from the provider/model metadata associated with that message, and usage will be the rounded token-total-to-limit percentage. This avoids presenting cumulative historical tokens as the current model context.

When no token-bearing assistant message or model limit is available, `Tokens` and `Used` will render `-`; an empty or zero-cost session will render `Spent` as `$0.00`. The collapsed summary will use the percentage when known and `-` otherwise.

Alternative considered: sum tokens across every message. This was rejected because it diverges from OpenCode's own context meter and can greatly exceed the active context after compaction.

### Reuse CompactPanel and explicit fixed-width quantity rows

The plugin will use `CompactPanel` for arrows, dividers, summary rendering, and footer behavior. A compact quantity-row primitive or equivalent local row will left-align labels and right-align values without trailing whitespace. Expanded state will use `▼`; collapsed state will use `▶` despite the inconsistent expanded arrow in the `AGENTS.md` example, as confirmed during clarification.

### Register a distinct manifest entry

The manifest, runtime `PluginKey`, package exports, build output, deployment/configuration documentation, and tests will include `context`. Its slot order will place it after MCP and before LSP; later existing entries will move only as required to preserve a deterministic order.

## Risks / Trade-offs

- [Risk] OpenCode SDK message or provider model shapes differ across supported host versions. → Mitigation: isolate shape access in the pure model, use the installed SDK types, and return placeholders for absent metadata.
- [Risk] Token totals can be double-counted if a host-provided total and detailed buckets are combined. → Mitigation: follow OpenCode's canonical token-total helper semantics and test representative message shapes.
- [Risk] Long formatted values can exceed the 37-column panel width. → Mitigation: reuse project compact-number formatting and fixed allocation/truncation rules, with mounted layout assertions.
- [Risk] Inserting a slot changes relative ordering for existing plugins. → Mitigation: update manifest order assertions and avoid changing their rendering or state behavior.

## Migration Plan

Add the new plugin artifact without enabling it implicitly. Existing users opt in through the same plugin registration mechanism as MCP, LSP, and TODO. Rollback consists of removing the Context registration; existing plugins remain independently loadable, and the unused persisted collapse key is harmless.

## Open Questions

None. Exact SDK property paths will be verified against the installed `@opencode-ai/plugin` types during deep design and implementation.

```

## openspec/changes/add-context-tui-plugin/tasks.md

- Source: openspec/changes/add-context-tui-plugin/tasks.md
- Lines: 1-19
- SHA256: 6711e4e80a30474e5b0c599d76ef08cccf40afcd769e55da9fe81ce2bccd4903

```md
## 1. Context Metrics Model

- [ ] 1.1 Add failing model tests for populated, compacted, zero-cost, missing-session, and missing-model-metadata scenarios.
- [ ] 1.2 Implement the typed Context panel model with OpenCode-compatible token, usage, cost, and compact-value formatting.

## 2. Context TUI Component

- [ ] 2.1 Add failing mounted-component and TUI-state type fixtures for expanded, collapsed, persisted, reactive, unavailable, and 37-column layouts.
- [ ] 2.2 Implement the Context sidebar component with `CompactPanel`, quantity rows, active-session wiring, and persisted collapse state.

## 3. Plugin Packaging

- [ ] 3.1 Register the Context descriptor, package export, build artifact, and sidebar order between MCP and LSP.
- [ ] 3.2 Update plugin registration and deployment documentation with the new opt-in Context artifact.

## 4. Verification

- [ ] 4.1 Run focused Context model, mounted-component, manifest, and build tests and resolve failures.
- [ ] 4.2 Run the full test suite, typecheck, and plugin build; confirm generated output matches the OpenSpec scenarios and `AGENTS.md` layout.

```

## openspec/changes/add-context-tui-plugin/specs/context-tui-panel/spec.md

- Source: openspec/changes/add-context-tui-plugin/specs/context-tui-panel/spec.md
- Lines: 1-83
- SHA256: 6e05c936e151c4b3bbd5e1ae0c0bba692fdbb923e0a7a65eb52f570fdd735d8f

[TRUNCATED]

```md
## ADDED Requirements

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


```

Full source: openspec/changes/add-context-tui-plugin/specs/context-tui-panel/spec.md
