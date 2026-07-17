## Why

OpenCode's built-in MCP sidebar does not match the compact, bounded layout used by the existing quota plugin. A standalone `opencode-tools-mcp` plugin will make MCP health scannable within the 37-column sidebar.

The repository also defines each current TUI feature with a different activation shape and composes quota, home, and token-report through build-script glue. Adding more plugins on that base would duplicate registration, lifecycle, packaging, and deployment code. This change establishes one standalone plugin foundation before adding MCP.

## What Changes

- Add a standalone MCP TUI sidebar plugin driven reactively by OpenCode's synchronized MCP state.
- Show a collapsible `MCP` header with a right-aligned, semantically colored connected/total summary and full-width separators.
- Show expanded MCP rows with native status-colored bullets, names, and stable right-aligned muted status labels.
- Persist the user's collapsed or expanded preference while forcing an empty `0/0` panel into its compact form.
- Add a shared standalone registration and lifecycle contract used by quota, home, token-report, and MCP.
- Add a declarative manifest that drives normalized runtime IDs, source entries, output artifacts, slot order, option ownership, build, and deployment.
- Split the current composed quota artifact into standalone quota, home, and token-report artifacts, then migrate managed configuration without losing quota options.
- Add shared ref-counted services so standalone quota and home reuse one provider hub instead of duplicating provider polling.
- Move feature decisions into shared models and services while keeping host binding and Solid/OpenTUI rendering in thin TUI adapters.
- Share compact sidebar primitives between quota and MCP without changing quota's visible behavior.
- Document how to use the plugin as a replacement for `internal:sidebar-mcp` without deactivating the built-in plugin automatically.
- Require OpenCode 1.18.1 or newer for the synchronized MCP and standalone TUI APIs used by this release.

## Capabilities

### New Capabilities
- `tui-plugin-foundation`: A manifest-driven standalone plugin contract, shared lifecycle and service runtime, thin adapter boundaries, current-plugin migration, and deterministic build and deployment workflow.
- `mcp-sidebar-status`: A standalone, reactive MCP health panel with compact and expanded layouts, status semantics, persistence, packaging, and replacement guidance.

### Modified Capabilities

None.

## Impact

The change affects every current TUI entry, shared provider ownership, local TUI declarations, the presentation layer, plugin metadata, build and deployment orchestration, package exports, automated tests, and documentation. It intentionally changes runtime plugin IDs and managed configuration from one composed artifact to four standalone artifacts. It preserves quota output and options, does not change MCP configuration or server lifecycle, and raises the OpenCode engine floor to 1.18.1.
