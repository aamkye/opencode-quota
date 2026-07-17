## Why

OpenCode's built-in LSP sidebar does not match the compact, bounded layout established by the repository's quota and MCP plugins. A standalone `opencode-tools-lsp` plugin will make active language servers and failures scannable while preserving the 37-column sidebar contract in `AGENTS.md`.

## What Changes

- Add a standalone LSP TUI sidebar plugin driven reactively by OpenCode's synchronized LSP state.
- Render a collapsible `LSP` panel after MCP, with active server IDs in host order and success- or error-colored bullets.
- Show a muted activation hint when no LSP servers are active and a right-aligned active-count summary while collapsed.
- Persist the user's collapsed or expanded preference, including transitions between empty and populated states.
- Extend the shared plugin manifest, package exports, build, local and global deployment, and managed configuration migration with the LSP artifact.
- Add pure model, mounted rendering, typing, build, deployment, and regression coverage for populated, empty, collapsed, reactive, and constrained-width layouts.
- Document installation and replacement of OpenCode's built-in `internal:sidebar-lsp` plugin without deactivating it automatically.

## Capabilities

### New Capabilities
- `lsp-sidebar-status`: A standalone reactive LSP panel with compact and expanded layouts, semantic status bullets, persistent collapse state, empty-state guidance, packaging, and replacement documentation.

### Modified Capabilities
- `tui-plugin-foundation`: Extend the declarative standalone plugin manifest, artifact set, and managed deployment from four plugins to include LSP as the fifth plugin.

## Impact

The change affects local TUI declarations, shared feature exports, standalone plugin metadata, package exports, build and deployment orchestration, managed configuration tests, rendering tests, and user documentation. It reads OpenCode's existing `api.state.lsp()` data and does not change LSP configuration, activation, server lifecycle, or the behavior of existing quota, home, token-report, and MCP plugins.
