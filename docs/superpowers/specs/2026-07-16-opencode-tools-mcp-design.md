---
comet_change: add-opencode-tools-mcp
role: technical-design
canonical_spec: openspec
archived-with: 2026-07-17-add-opencode-tools-mcp
status: final
---

# Standalone TUI Plugin Foundation and MCP Panel

## Scope

This design adds the MCP sidebar and restructures the current TUI features around a standalone-only plugin foundation. OpenSpec remains the requirements source. This document defines module boundaries, contracts, lifecycle behavior, migration mechanics, and tests.

The release ships four independent plugins:

| Feature | Runtime ID | Artifact | Options |
|---|---|---|---|
| Quota | `aamkye/opencode-tools-quota` | `opencode-tools-quota.js` | Quota options |
| Home | `aamkye/opencode-tools-home` | `opencode-tools-home.js` | None |
| Token report | `aamkye/opencode-tools-token-report` | `opencode-tools-token-report.js` | None |
| MCP | `aamkye/opencode-tools-mcp` | `opencode-tools-mcp.js` | None |

The shared artifact remains `opencode-tools-shared.js`. Each feature artifact imports it through the existing host-safe external import mechanism.

## Architecture

```text
plugin-manifest.json
       |
       +-------------------+-------------------+
       |                   |                   |
       v                   v                   v
 shared runtime       build iteration     deploy migration
       |
       +-- defineTuiPlugin
       +-- service leases
       +-- shared feature models/services
       +-- compact sidebar primitives
       |
       v
 thin standalone adapters
 quota.tsx  home.tsx  token-report.tsx  mcp.tsx
```

The manifest and runtime solve different problems. The manifest stores static identity and packaging data. The runtime controls activation and resource ownership. Feature modules keep pure decisions and reusable services in the shared layer. TUI adapters bind OpenCode state, register slots or commands, and render the surface.

## Manifest

Use a data-only manifest that both JavaScript build scripts and TypeScript source can consume. Each record contains:

```ts
type PluginManifestEntry = {
  key: "quota" | "home" | "token-report" | "mcp"
  id: string
  source: string
  outfile: string
  slotOrder?: number
  options: "quota" | "none"
}
```

The implementation validates unique keys, IDs, source paths, and output paths before building or deploying. Source modules read their own descriptor by key rather than restating IDs or slot orders. Build and deployment tests derive expected artifacts from this manifest.

The manifest records quota at its existing sidebar order and MCP immediately after it. Home retains its current surface order. Token-report has no slot order.

## Registration Runtime

The shared runtime exposes one factory:

```ts
type FeatureActivation = (
  context: TuiFeatureContext,
  options: Record<string, unknown> | undefined,
) => void | TuiDispose | Promise<void | TuiDispose>

function defineTuiPlugin(
  descriptor: PluginManifestEntry,
  activate: FeatureActivation,
): TuiPluginModule & { id: string }
```

`TuiFeatureContext` exposes the host API, a cleanup registrar, and service acquisition. The adapter does not call `api.lifecycle.onDispose` for resources that the context owns.

Activation follows this sequence:

1. Create an activation scope with an empty LIFO cleanup stack.
2. Invoke the feature activation callback.
3. Add a returned cleanup function to the stack.
4. Register one idempotent scope cleanup with `api.lifecycle.onDispose`.
5. If the lifecycle is already aborted, unregister the host callback and clean the scope at once.
6. If any step throws, clean the scope and rethrow the original error.

Cleanup runs each registered function once in reverse acquisition order. It attempts all cleanups even if one fails, then reports the first cleanup error only when no activation error already exists. This keeps the original activation failure actionable.

The runtime does not compose features. Every adapter calls `defineTuiPlugin` once and activates one feature.

## Shared Service Leases

Standalone quota and home need the same provider data. Creating separate adapters would retain the current duplicate network polling. The runtime therefore stores services in a `WeakMap<TuiPluginApi, Map<ServiceKey, ServiceRecord>>`.

```ts
type ServiceRecord<T> = {
  value: T
  references: number
  dispose: TuiDispose
}

type ServiceLease<T> = {
  value: T
  release(): void
}
```

`acquireService` creates the service only when no record exists. A successful acquisition increments `references` and registers the idempotent lease release with the activation scope. The final release removes the record before calling `dispose`, which prevents reentrant acquisition from receiving a service that is shutting down.

A failed factory never enters the registry. One plugin's activation rollback releases only its lease. The service stays alive if another plugin still holds a lease.

The first shared service is `quota-provider-hub`. It owns Z.AI, OpenAI, and optional OpenCode Go adapters plus disposal. Quota consumes all configured providers. Home consumes the summaries it supports. The hub starts through either plugin, so each artifact works alone.

The hub keeps a demand record for each consumer lease. Home requests Z.AI and OpenAI with default polling. Quota requests its normalized polling interval, provider visibility, and optional OpenCode Go configuration. While quota holds a lease, its normalized construction options control shared Z.AI and OpenAI adapters and add OpenCode Go when configured. With only home active, the hub uses defaults.

When the active demands change, the hub recreates only adapters whose construction options changed. It exposes the current adapter set through stable reactive accessors, so quota and home retain the same hub reference during reconciliation. This rule lets home start before quota without creating a second provider hub. Tests cover both activation orders, quota release while home remains, and adapter replacement cleanup.

## Feature Boundaries

### Quota

Move option normalization, selected-provider resolution, session selection, panel composition, and provider-hub construction behind shared exports. Keep slot registration, session prop binding, and JSX item rendering in the TUI layer.

Quota becomes quota-only. It no longer activates home or token-report through generated glue. Its collapse state remains ephemeral to preserve current behavior.

### Home

Move summary formatting, percentage parts, and color-role selection into shared pure functions. The adapter acquires the provider hub, registers `home_bottom`, and renders the centered summary rows.

### Token Report

Command definitions, report computation, rendering, and persistence behavior remain shared. The adapter owns keymap registration and the Solid/OpenTUI prompt dialog because those depend on host components.

### MCP

The adapter reads `api.state.mcp()` inside a Solid memo. A shared pure mapper returns:

```ts
type McpPanelModel = {
  connected: number
  total: number
  summary: PanelTextSegment[]
  rows: McpStatusRow[]
}

type McpStatusRow = {
  name: string
  label: "Connected" | "Disabled" | "Failed" | "Needs auth" | "Needs client ID" | "Unknown"
  status: "success" | "error" | "warning" | "textMuted"
}
```

The mapper preserves input order. It ignores runtime error strings. Unknown statuses use `Unknown`, `textMuted`, and the unhealthy aggregate path.

## Compact Sidebar Primitives

Extract a controlled shell from the existing panel renderer:

```ts
type CompactPanelProps = {
  title: string
  collapsed: boolean
  summary?: readonly PanelTextSegment[]
  onToggle(): void
  children: JSX.Element
  footerDivider?: boolean
}
```

The shell renders the two-cell marker, flexible title, optional right-aligned summary segments, header divider, bounded child region, and optional final divider. It does not store collapse state or read KV. Each feature owns those decisions.

Quota's semantic normalizer and mounted items remain separate and render inside the shell. MCP uses `CompactStatusRow`, which reserves the bullet, gap, and full status-label width. The name is the only flexible child and consumes the remaining width with `flexBasis={0}`, `flexGrow={1}`, `flexShrink={1}`, `minWidth={0}`, `overflow="hidden"`, `wrapMode="none"`, and truncation. If a vertical scrollbar narrows the sidebar viewport, the name gives up that cell while the right-aligned status label remains intact.

The pure layout helpers continue to enforce the 37-cell representation used by tests. Mounted tests verify that the OpenTUI flex implementation matches those allocations.

## MCP Collapse State

Use a namespaced key such as `aamkye.opencode-tools-mcp.collapsed`. The adapter reads it once with a default of `false`, then controls the shell through a signal.

For non-empty lists, a header click toggles the signal and writes the new preference. For an empty list, the rendered state is collapsed regardless of the signal. The adapter does not write KV for that override. When servers appear, the saved signal state takes effect.

Collapsed headers show summary segments. Expanded headers omit them. Empty state shows muted `0/0`, the collapsed marker, and the header divider. Expanded state renders ordered rows and a final full-width divider.

## MCP Status Semantics

| Host status | Counted connected | Bullet role | Label |
|---|---:|---|---|
| `connected` | Yes | success | Connected |
| `disabled` | No | textMuted | Disabled |
| `failed` | No | error | Failed |
| `needs_auth` | No | warning | Needs auth |
| `needs_client_registration` | No | error | Needs client ID |
| unknown | No | textMuted | Unknown |

For `N/N` where `N > 0`, both numbers use success and the slash uses muted text. For `C/T` where `C < T`, `C` uses success, the slash uses muted text, and `T` uses error. For `0/0`, every segment uses muted text.

## Build

The build script first emits `opencode-tools-shared.js`. It then loops through the manifest and bundles each source entry into its declared output. Every feature bundle externalizes the shared artifact and host runtime packages.

Remove the synthetic stdin module that calls quota, home, and token-report. A build result maps feature keys to esbuild results so tests and deployment can inspect all outputs.

The build fails before partial feature output when manifest validation fails. Existing cleanup removes stale composed and obsolete token artifacts.

## Deployment Migration

Deployment copies the shared artifact and all manifest artifacts. It classifies managed config entries through manifest outputs plus historical paths. During migration it:

1. Preserves unrelated entries in their existing relative order.
2. Chooses quota options from the highest-priority historical or current managed quota entry.
3. Removes all managed entries.
4. Appends standalone manifest entries in manifest order.
5. Uses the tuple form only for quota when preserved options exist.
6. Removes stale managed files and token commands.
7. Writes deterministic JSON with a trailing newline.

Project-to-global option fallback keeps the current priority rules. Repeated deployment produces byte-identical files.

The migration intentionally changes quota's runtime ID. Documentation calls out plugin-manager state that may key off the old ID. Feature-owned KV keys do not derive from the runtime ID, so the code can preserve any explicit persisted state.

## Compatibility

Update the local `@opencode-ai/plugin/tui` declaration with `state.mcp()` and the five known status variants. Keep the mapper's input boundary runtime-safe so an unknown string does not throw.

Set `engines.opencode` to `>=1.18.1`. Do not add compatibility shims for older APIs. TypeScript, build scripts, tests, and documentation use that floor.

## Testing

### Runtime

- Creates a module with the manifest ID and one activation callback.
- Runs returned and registered cleanup once in LIFO order.
- Rolls back partial activation and preserves the original error.
- Cleans an already-aborted activation without retaining state.
- Shares one provider hub across activation order, reconciles changed consumer demands, and disposes replaced adapters and the final hub once.

### Current Feature Parity

- Existing quota composition, provider selection, status colors, layouts, and lifecycle tests remain green.
- Mounted quota snapshots before and after shell extraction match for extended, semi-collapsed, and collapsed forms.
- Home output and token-report commands, dialogs, persistence, and escape cleanup retain current behavior.
- Each feature registers only its own slots or commands when loaded alone.

### MCP

- Pure mapper covers every known status, unknown status, source order, all-connected, partially connected, and empty summaries.
- Mounted tests cover expanded and collapsed content, KV restore and writes, forced empty collapse, reactive additions and status changes, long names, right-aligned labels, semantic colors, and both separators.
- Layout tests assert no row exceeds 37 cells and textual output has no trailing whitespace.

### Build And Deployment

- Manifest validation rejects duplicate IDs and paths.
- Build emits the shared artifact and all four standalone artifacts with correct external imports.
- No emitted feature activates a sibling.
- Local and global deployment migrate historical config, preserve quota options and unrelated entries, remove stale files, and remain byte-identical on a second run.

### Release Gates

Run the complete test suite, strict TypeScript check, and production plugin build. A failure returns the change to implementation; it cannot advance to Comet verification.

## Documentation

Update README installation examples for four standalone entries and the OpenCode 1.18.1 floor. Show the MCP extended, collapsed, unhealthy, and empty layouts. Explain that users must disable `internal:sidebar-mcp` themselves to avoid duplicate panels. Include rollback steps for restoring the built-in MCP panel.
