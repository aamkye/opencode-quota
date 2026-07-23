# lsp-show-operating-dir

The LSP sidebar panel shows each language server's operating directory
(`TuiLspEntry.root`) alongside the existing server `id`, in the expanded view.
The collapsed count summary and empty-list fallback are unchanged.

## Scenario: expanded panel shows a server's operating directory

**Trigger:** The expanded LSP panel renders one or more servers from
`api.state.lsp()`, each exposing a non-empty `root`.

**Result:** Each server row shows the status-colored bullet and `id` on the left
and the `root` basename (final path segment) right-aligned in the muted label
color, on the same row — the same layout MCP uses for its status label. For
example, a server with `id: "typescript"` and
`root: "/Users/aam/Projects/priv/opencode-tools"` renders
`• typescript         opencode-tools`.

## Scenario: empty root renders no label

**Trigger:** A server exposes an empty or missing `root`.

**Result:** The row renders only the status-colored bullet and `id`, with no
right-aligned label.

## Scenario: collapsed summary is unchanged

**Trigger:** The panel is collapsed.

**Result:** The header shows the server count only (`▶ LSP  <count>`), identical
to the prior behavior.

## Scenario: empty list fallback is unchanged

**Trigger:** The expanded panel has no servers.

**Result:** The panel shows `LSPs will activate as files are read`.

## Scenario: identifier and ordering preserved

**Trigger:** Servers are rendered in the expanded panel.

**Result:** Rows keep the existing `id` label and status-colored bullet, in
synchronized source order, without polling.
