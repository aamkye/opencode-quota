---
comet_change: add-opencode-tools-lsp
role: technical-design
canonical_spec: openspec
archived-with: 2026-07-17-add-opencode-tools-lsp
status: final
---

# OpenCode Tools LSP Technical Design

## Scope

This design implements the behavior in `openspec/changes/add-opencode-tools-lsp/specs/lsp-sidebar-status/spec.md` and the foundation changes in `specs/tui-plugin-foundation/spec.md`. The plugin reads OpenCode's synchronized LSP state and renders the LSP layouts defined in `AGENTS.md`.

The work adds one standalone plugin and extends the existing manifest-driven release pipeline. It does not change LSP configuration, diagnostics, server lifecycle, or any existing panel's visible behavior.

## Existing Boundary

The MCP plugin provides the closest implementation pattern:

- `tui/features/mcp.ts` converts host entries into a pure presentation model.
- `tui/mcp.tsx` binds reactive host state, KV persistence, theme values, and the sidebar slot.
- `CompactPanel` owns the collapse marker, header summary, bounded body, and separators.
- `plugin-manifest.json` drives runtime identity, slot order, build output, and deployment.
- Pure model tests and mounted Solid fixtures cover decisions and rendered behavior separately.

LSP should use the same boundaries. MCP's `CompactStatusRow` reserves a stable right-hand status label, while LSP has no label. Sharing that row would force LSP through allocation logic it does not need and could regress MCP's 36-cell scrollbar behavior.

## Component Design

### Local TUI API declaration

`opencode-plugin-tui.d.ts` will declare:

```ts
type TuiLspKnownStatus = "connected" | "error"
type TuiLspStatus = TuiLspKnownStatus | (string & {})

interface TuiLspEntry {
  id: string
  name: string
  root: string
  status: TuiLspStatus
}
```

`TuiPluginApi.state` gains `lsp(): readonly TuiLspEntry[]`. The open string boundary protects the plugin from future host statuses while preserving autocomplete and exhaustive handling for current statuses. The fields match `LspStatus` from `@opencode-ai/sdk/v2`.

A compile fixture will call `api.state.lsp()` and inspect each field. This catches local declaration drift before runtime tests.

### Pure feature model

`tui/features/lsp.ts` will expose a model shaped for the LSP surface:

```ts
type LspStatusRow = {
  id: string
  status: PanelStatus
}

type LspPanelModel = {
  rows: readonly LspStatusRow[]
  total: number
}
```

`createLspPanelModel(entries)` maps entries without sorting or mutating them:

| Host status | Panel role |
|-------------|------------|
| `connected` | `success`  |
| `error`     | `error`    |
| other       | `textMuted`|

The model retains only `id` and status role because `name` and `root` have no presentation role. `total` equals the host list length, including unknown statuses. Keeping the count independent of status avoids treating erroring clients as inactive.

`shared/opencode-tools-shared.ts` re-exports the model and types. This matches the repository rule that standalone artifacts import reusable decisions from the managed shared artifact.

### Standalone adapter

`tui/lsp.tsx` will create the module through `defineTuiPlugin(pluginDescriptor("lsp"), ...)`.

The adapter owns:

- `createSignal(api.kv.get(COLLAPSED_KEY, false))`
- `createMemo(() => createLspPanelModel(api.state.lsp()))`
- a header toggle that writes the next boolean to the namespaced KV key
- registration of one `sidebar_content` slot
- expanded rows and the empty hint

The empty list does not override collapse state. With no stored preference, the signal starts as `false` and the hint appears. If the user collapses an empty panel, the adapter stores `true` and renders `0` in the header. Empty-to-populated and populated-to-empty transitions keep the same signal and Solid root.

The adapter passes a summary only while collapsed:

```ts
{ text: String(model().total) }
```

The count uses normal header text. It reports quantity rather than health, so semantic success or error coloring would misrepresent mixed-status lists.

### LSP row

A local `LspRow` component renders one full-width row:

```text
| bullet: 2 cells | server id: remaining cells |
```

The bullet has `flexShrink={0}` and receives the model's theme role. The ID region uses `flexBasis={0}`, `flexGrow={1}`, `flexShrink={1}`, `minWidth={0}`, `overflow="hidden"`, `wrapMode="none"`, and `truncate={true}`. It contains no fixed-width padding or right-side label.

At 37 cells, the ID can consume 35 cells. When the scrollbar leaves 36 cells, it can consume 34. OpenTUI truncates an overflowing ID with U+2026 inside that allocation. The row does not append spaces, so textual snapshots contain no trailing whitespace.

The empty body uses one muted `<text>` node with the exact activation hint. `CompactPanel` supplies the header separator and expanded footer separator for both populated and empty bodies.

## State Flow

```text
OpenCode sync store
  api.state.lsp()
          |
          v
Solid createMemo
  createLspPanelModel(entries)
          |
          +---------------------------+
          |                           |
          v                           v
collapsed signal                expanded body
  KV default false                rows or hint
          |                           |
          +------------+--------------+
                       v
                  CompactPanel
                       |
                       v
               sidebar_content slot
```

OpenCode's accessor participates in Solid tracking, so the plugin needs no poller or `api.event` subscription. The shared runtime handles activation cleanup and host disposal. This feature acquires no shared service and creates no timer.

## Runtime Boundaries

### Unknown statuses

The SDK currently defines `connected | error`, but the local boundary accepts future strings. The model maps an unknown value to `textMuted`, preserves its host position, and includes it in `total`. One unknown row cannot block later rows or the footer.

### Empty state

An empty list is a synchronized state that often occurs before the user reads a supported file. The adapter renders guidance rather than treating it as loading failure. It does not write KV state during this transition.

### Host metadata

The model discards `name` and `root`. This prevents long workspace paths from entering the 37-cell panel and keeps the external plugin aligned with the approved layout.

### Persistence

The plugin uses a new key under the `aamkye.opencode-tools-lsp` namespace. Only header interaction writes the key. Reactive LSP updates never write or reset user preference. Since no prior LSP plugin version exists, the design adds no migration branch for older keys.

## Manifest And Release Integration

`plugin-manifest.json` gains an entry with:

- key `lsp`
- normalized runtime ID `aamkye/opencode-tools-lsp`
- source `tui/lsp.tsx`
- output `opencode-tools-lsp.js`
- slot order `112`
- no options

`PluginKey` gains `lsp`, and `package.json` exports `./lsp`. The existing build script will emit the fifth standalone artifact by iterating the manifest.

Deployment will treat the current four-plugin installation as a managed predecessor. A local or global deployment removes stale managed LSP artifacts, writes the five current artifacts, and rewrites managed entries in manifest order. It preserves unrelated entries and transfers existing options only to quota. Running deployment twice must leave files and configuration unchanged.

Documentation will describe the external plugin's layout and persistence and tell users to disable `internal:sidebar-lsp` to prevent duplicate panels. Deployment will not deactivate the built-in plugin.

## Test Design

Implementation follows red-green-refactor at each boundary.

### Type fixture

- `state.lsp()` returns a readonly list.
- Entries expose `id`, `name`, `root`, and a runtime-safe status.

### Pure model tests

- Preserve host order and input immutability.
- Map connected, error, and unknown statuses to the expected roles.
- Count every entry, including errors and unknown values.
- Return an empty model for an empty list.
- Exclude `name` and `root` from rows.

### Mounted adapter tests

- Register the expected plugin ID and slot order.
- Render expanded connected and error rows with plain IDs and colored bullets.
- Render unknown statuses muted without dropping later rows.
- Default an empty panel to expanded and show the muted exact hint.
- Toggle empty and populated panels and record one KV write per interaction.
- Restore expanded and collapsed preferences after plugin restart.
- Update rows, colors, count, and empty content from reactive state without remounting the slot root.
- Render only header and one separator while collapsed.
- Render header and footer separators while expanded, including empty state.
- Truncate long IDs with ellipsis within 37 cells and yield one cell at 36 cells.
- Avoid textual trailing whitespace.
- Dispose the Solid root and plugin lifecycle cleanly.

### Build and deployment tests

- Manifest metadata and package exports include all five plugins.
- Production build emits five plugin artifacts plus the shared artifact.
- Each plugin artifact activates no sibling feature.
- Local and global deployment migrate a four-plugin installation to five.
- Migration preserves quota options and unrelated entries.
- Deployment removes stale managed files and remains idempotent.

### Verification commands

```bash
npm test
npm run typecheck
npm run build
```

## Implementation Order

1. Lock the host boundary with the compile fixture.
2. Write model tests and implement the pure model.
3. Write mounted fixture cases and implement the adapter and row.
4. Extend manifest, package, build, and deployment tests before production code changes.
5. Update documentation and run all verification commands.

This order keeps failures local. Model semantics settle before Solid rendering, and panel behavior settles before release integration.
