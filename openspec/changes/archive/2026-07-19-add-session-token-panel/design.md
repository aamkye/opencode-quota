## Context

The repository packages each sidebar capability as an independent TUI plugin selected from `plugin-manifest.json`. LSP, MCP, and TODO keep transformation logic in a pure `tui/features` module, export it through `shared/opencode-tools-shared.ts`, and use a thin Solid component around `CompactPanel`. SesTokens must follow that structure while obtaining data that is not exposed as one ready-made TUI state value: token totals and assistant-turn counts across the current session and every descendant session.

The OpenCode TUI API exposes synchronized session state, client session queries, lifecycle events, plugin slots, KV storage, and disposal hooks. The reference session-token-summary plugin demonstrates that client-backed subtree loading plus event-triggered refreshes is more reliable for complete descendant aggregation than relying only on reactive state repainting.

## Goals / Non-Goals

**Goals:**

- Render the exact SesTokens expanded and collapsed layouts defined in `AGENTS.md` at the 37-cell sidebar width.
- Aggregate turns and token categories over the viewed session's complete descendant tree.
- Keep displayed data current without polling and without allowing stale or partial loads to replace a complete snapshot.
- Follow the existing feature-model, shared-export, runtime, manifest, build, deployment, and test conventions.
- Leave reusable session-tree traversal logic suitable for later consumers without coupling this change to the SubAgent panel.

**Non-Goals:**

- Cost reporting or estimation.
- Per-session or per-agent token breakdowns.
- User-configurable refresh, formatting, or aggregation behavior.
- SubAgent rendering, status tracking, or navigation.
- Supporting OpenCode versions older than the package's declared minimum.

## Decisions

### Use a standalone manifest plugin and the existing compact-panel pattern

Add a `ses-tokens` manifest key and standalone `tui/ses-tokens.tsx` entry point after TODO in sidebar order. The panel will use `defineTuiPlugin`, `pluginDescriptor`, and `CompactPanel`; its pure formatting and aggregation model will live in `tui/features/ses-tokens.ts` and be exported through `shared/opencode-tools-shared.ts`.

This keeps packaging and rendering consistent with LSP, MCP, and TODO. Extending the generic presentation schema was considered, but the fixed metric rows and compact collapsed summary do not require a new generic item type.

### Build a client-backed session-tree snapshot

A session-tree loader will list sessions for the active directory, index them by `parentID`, traverse from the viewed session with a visited set, and fetch messages for every session in the subtree. Message requests will run with a fixed concurrency limit of four. Only assistant messages contribute one turn and their `input`, `output`, `reasoning`, `cache.read`, and `cache.write` values.

Using session-level aggregate tokens was considered, but assistant messages are required to count turns and provide one consistent source for every displayed category. Using only synchronized `api.state.session.messages` was rejected because complete descendant availability and slot repainting are less reliable than event-triggered client snapshots.

### Define arithmetic and display formatting explicitly

`total` is the sum of input, output, reasoning, cache-read, and cache-write tokens. The cache-hit ratio is `cacheRead / (input + cacheWrite)`, formatted to one decimal place with `×`; a zero denominator renders `∞` when cache-read is nonzero and `-` otherwise. Counts use the repository's compact count convention with `K` and `M` suffixes and no unnecessary trailing `.0`.

The expanded panel always renders the rows and internal divider in the AGENTS.md order. The collapsed summary is `Σ <total> / ↻ <turns>`. Muted `Loading...` or `Usage unavailable` content may replace metric rows only before any complete snapshot exists; once a complete snapshot exists, refresh errors retain it unchanged.

### Refresh by relevant events with debounce and generation guards

The plugin tracks the active session ID and the IDs in its last complete subtree. Message updates/removals affecting known IDs and session create/update/delete events affecting a known session or parent schedule one debounced refresh. Slot session changes and `tui.session.select` reset the target and trigger an immediate load.

Each load receives a monotonically increasing generation. Results update Solid state only when the plugin is active, the generation is current, and all subtree requests completed. A bounded retry policy handles transient failures. Failed background refreshes preserve the last complete snapshot; only an initial load with no snapshot exposes an unavailable state.

### Persist only presentation state and clean up all resources

The panel collapse flag uses a feature-specific KV key. Usage snapshots are not persisted because they can become stale and are reconstructible from OpenCode session data. Event unsubscribe functions, debounce/retry timers, and disposal flags are registered through the plugin lifecycle so remounting cannot leak refresh work or update disposed Solid state.

## Risks / Trade-offs

- **Large session trees can require many message requests** -> Bound concurrency to four, debounce bursts, and fetch only after relevant events.
- **Session events can arrive before synchronized state settles** -> Use a short debounce and bounded retries before declaring the initial load unavailable.
- **A session can be deleted during traversal** -> Treat the refresh as incomplete and retain the previous complete snapshot rather than publishing partial totals.
- **SDK/TUI declarations can drift from the installed runtime** -> Extend only the locally used API surface and add compile-time contract fixtures plus build tests.
- **Bundled standalone plugins cannot rely on another plugin being active** -> Keep all SesTokens dependencies in the shared source graph bundled into its own artifact.

## Migration Plan

Add the new manifest/package entry and deploy it alongside existing managed plugins. No persisted usage migration is needed; the collapse key defaults to expanded. Rollback removes the SesTokens plugin entry/artifact and leaves an inert KV preference that is safe to ignore.

## Open Questions

None. Loading/error copy and compact-number edge cases will be finalized by tests without changing the confirmed ready-state layouts.
