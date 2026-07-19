## Why

OpenCode users can inspect token usage through commands, but the sidebar does not provide a live, compact view of the current session's aggregate usage. A SesTokens panel makes root and nested subagent consumption visible without leaving the active session while preserving the repository's established TUI layout conventions.

## What Changes

- Add a standalone SesTokens sidebar plugin with the expanded and collapsed layouts specified in `AGENTS.md`.
- Aggregate assistant turns and token categories across the viewed session and its complete descendant session tree.
- Refresh usage from session and message lifecycle events with bounded concurrency, debouncing, stale-request protection, and last-complete-snapshot retention.
- Persist panel collapse state and clean up timers, subscriptions, and in-flight work when the plugin is disposed.
- Add manifest, package, build, deployment, shared-module, type declaration, model, and mounted-panel integration coverage.

## Capabilities

### New Capabilities

- `session-token-panel`: Live aggregate session-tree token usage in an AGENTS.md-compliant SesTokens sidebar panel.

### Modified Capabilities

None.

## Impact

- Adds a new TUI plugin entry point and pure feature model under `tui/`.
- Extends the shared TUI module, plugin manifest, package exports, deployment expectations, and local TUI API declarations.
- Uses existing OpenCode TUI/SDK session, message, provider state, event, slot, lifecycle, and KV APIs without changing a public application API or adding a dependency.
- Adds focused model, mounted rendering, lifecycle, manifest, build, deployment, and type tests.
