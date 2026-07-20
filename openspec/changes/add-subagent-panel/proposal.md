## Why

OpenCode can run multiple child sessions, but the sidebar does not provide a compact view of which direct subagents are running, successful, or failed. A SubAgent panel makes child-session activity, elapsed time, identity, and navigation visible while preserving the repository's established TUI layout conventions.

## What Changes

- Add a standalone SubAgent sidebar plugin with the expanded, semi-collapsed, collapsed, Rest-group, and per-entry detail layouts specified in `AGENTS.md`.
- Rebuild direct child-session entries from synchronized session and message state, ordered newest-first, and update their successful/running/failed status from session lifecycle events.
- Keep the newest five entries in the primary group and place remaining entries in an independently collapsible Rest group.
- Persist panel, Rest-group, and single-entry expansion state plus only terminal failure metadata that cannot be reconstructed reliably.
- Navigate Open Session actions to the selected child session.
- Adopt the confirmed sidebar order with SubAgent immediately after SesTokens and shift the later sidebar panels to stable ten-point slots.
- Add manifest, package, build, deployment, shared-module, type declaration, model, and mounted-panel integration coverage.

## Capabilities

### New Capabilities

- `subagent-panel`: Live direct-child session monitoring and navigation in an AGENTS.md-compliant SubAgent sidebar panel.

### Modified Capabilities

None.

## Impact

- Adds a new TUI plugin entry point and pure feature model under `tui/`.
- Extends the shared TUI module, plugin manifest, package exports, deployment expectations, and local TUI API declarations.
- Reorders existing sidebar manifest entries to Home 1, Context 100, SesTokens 110, SubAgent 120, Quota 130, MCP 140, LSP 150, and TODO 160.
- Uses existing OpenCode TUI/SDK session, message, status, event, route, slot, lifecycle, and KV APIs without changing a public application API. Declares the already-installed `string-width` package directly for responsive terminal-cell end truncation because OpenTUI 0.4.x exposes only middle truncation.
- May reuse general session indexing utilities introduced by the separate SesTokens change, but remains independently buildable and testable.
- Adds focused model, mounted rendering, lifecycle, navigation, manifest, build, deployment, and type tests.
