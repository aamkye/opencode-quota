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
