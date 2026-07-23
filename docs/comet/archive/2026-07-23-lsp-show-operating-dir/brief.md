# Outcome

The LSP sidebar panel shows, for each language server, the directory where that
server operates (the `root` field from `api.state.lsp()`), in addition to the
existing server id. This matches the behavior the user references as "the
internal LSP plugin".

# Scope

- `tui/lsp.tsx` and `tui/features/lsp.ts`: surface each `TuiLspEntry.root` in the
  expanded panel.
- Likely a small path-formatting helper (e.g. home → `~`) in the presentation
  layer, consistent with existing `format.ts` utilities and the 37-cell layout.
- Update the README "LSP sidebar layouts" section to document the new line.
- Add/extend mounted tests for the LSP panel model and rendering.

# Non-goals

- Not changing which identifier labels a row: the existing `id` (e.g.
  `typescript`) is preserved.
- Not changing status-colored bullets, synchronized source order, or the empty
  fallback (`LSPs will activate as files are read`).
- Not changing the collapsed summary (`▶ LSP  <count>`).
- Not changing any other sidebar panel.

# Acceptance examples

- Expanded panel with one connected server whose `root` is
  `/Users/aam/Projects/priv/opencode-tools` renders:
  `• typescript         opencode-tools` — the status-colored bullet and `id` on
  the left, the `root` basename right-aligned in the muted label color, mirroring
  MCP's status row.
- A server with an empty `root` renders only `• <id>` (no right-aligned label),
  identical to the prior row.
- Collapsed summary remains the server count.
- Empty list still shows `LSPs will activate as files are read`.

# Constraints and invariants

- Panel width is 37 cells; no trailing whitespace; lines must fit the sidebar.
- Reactive, synchronized source order without polling; no change to status colors.
- Preserve the existing `id` label and status-colored bullet.

# Decisions

- Use the published `TuiLspEntry.root` field as the operating directory source.
- Preserve the existing `id` row (existing behavior) rather than switching to
  `name`.
- Render the directory on the same row as the `id`, right-aligned, showing only
  the basename (final path segment) of `root`, in the muted label color — the
  same `CompactStatusRow` layout MCP uses for its status label. Confirmed by the
  user over second-line and full/`~`-path alternatives.
- Leave the collapsed count summary unchanged.

# Open questions

_None._

# Verification expectations

- `npm run typecheck` and `npm test` pass.
- A mounted test covers the LSP panel showing the operating directory.
- README "LSP sidebar layouts" documents the new appearance.
