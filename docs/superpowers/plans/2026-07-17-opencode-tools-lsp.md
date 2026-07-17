---
change: add-opencode-tools-lsp
design-doc: docs/superpowers/specs/2026-07-17-opencode-tools-lsp-design.md
base-ref: 6c42ac95493852d5791bb4e037cea8394081c365
archived-with: 2026-07-17-add-opencode-tools-lsp
---

# OpenCode Tools LSP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a standalone, reactive LSP sidebar plugin whose type boundary, model, mounted behavior, release artifacts, deployment migration, and documentation match the approved OpenSpec change.

**Architecture:** Follow the MCP split without sharing MCP's fixed status-label row: `opencode-plugin-tui.d.ts` defines the host boundary, `tui/features/lsp.ts` maps synchronized host entries into a pure presentation model, and `tui/lsp.tsx` owns Solid state, KV persistence, and rendering through `CompactPanel`. Keep build and deployment manifest-driven so one new descriptor produces and migrates the fifth standalone artifact without adding another release feature list.

**Tech Stack:** TypeScript 6, SolidJS 1.9, OpenTUI Solid, esbuild, Node.js test runner, JSON plugin manifest, OpenCode TUI plugin API.

## Global Constraints

- Use English for code-facing prose, tests, and documentation added by this change.
- Preserve the exact runtime ID `aamkye/opencode-tools-lsp`, source `tui/lsp.tsx`, output `opencode-tools-lsp.js`, slot order `112`, and package export `./lsp`.
- Treat `api.state.lsp()` as an ordered reactive `readonly TuiLspEntry[]`; do not sort, mutate, poll, or subscribe through `api.event`.
- Define known statuses as `"connected" | "error"` while accepting future strings through `TuiLspKnownStatus | (string & {})`.
- Map `connected` to `success`, `error` to `error`, and every unknown status to `textMuted`; count every entry regardless of status.
- Display only each entry's `id`; never render `name`, `root`, or a textual status label.
- Default collapse state to expanded (`false`) even when the list is empty, persist only header interactions under `aamkye.opencode-tools-lsp.collapsed`, and never rewrite preference because LSP state changed.
- Render the exact empty hint `LSPs will activate as files are read` in `textMuted`.
- Keep rows within 37 cells and 36 cells with a scrollbar: reserve 2 cells for `• `, let the ID consume the remainder, truncate with U+2026, and emit no trailing whitespace.
- Expanded populated and empty panels have header and footer separators; collapsed panels have only the header separator.
- A collapsed summary is the uncolored total count; expanded panels have no summary.
- Build five standalone feature artifacts plus `dist/opencode-tools-shared.js`; no artifact may activate a sibling feature.
- Deployment must migrate an existing four-plugin installation, preserve unrelated entries and their relative order, keep options only on quota, remove stale managed files, and remain byte-for-byte idempotent on a second run.
- Document that users must disable `internal:sidebar-lsp`; deployment must not change `plugin_enabled` or deactivate the built-in panel.
- Retain the existing OpenCode engine floor `>=1.18.1` and add no compatibility branch for a prior LSP collapse key because no prior LSP plugin exists.

---

## File Map

| Path | Responsibility |
| --- | --- |
| `opencode-plugin-tui.d.ts` | Local synchronized LSP state declaration and open future-status boundary. |
| `tests/lsp-state-types.fixture.ts` | Compile-only proof for `state.lsp()`, readonly entries, all host fields, and future statuses. |
| `tsconfig.json` | Includes state API compile fixtures in strict typechecking. |
| `tui/features/lsp.ts` | Pure ordered mapping from host entries to `LspPanelModel`. |
| `tests/lsp-model.test.mjs` | Pure model ordering, status, count, immutability, empty, and metadata-elision tests. |
| `shared/opencode-tools-shared.ts` | Managed shared-artifact exports for the LSP model and types. |
| `tests/shared-boundary.test.mjs` | Enforces the thin-adapter/shared-facade boundary for LSP. |
| `tui/lsp.tsx` | Standalone Solid adapter, local `LspRow`, collapse state, KV writes, empty hint, and slot registration. |
| `tests/lsp-mounted.fixture.ts` | Mounted Solid host fixture with reactive LSP state, persistent KV store, viewport simulation, and lifecycle observation. |
| `tests/lsp-mounted.test.mjs` | Expanded, collapsed, empty, reactive, constrained-width, separator, whitespace, and disposal behavior. |
| `tests/compile-presentation.mjs` | Builds LSP model and mounted fixtures into `.tmp-test` before Node tests run. |
| `plugin-manifest.json` | Canonical fifth plugin descriptor immediately after MCP. |
| `tui/runtime/manifest.ts` | Adds `lsp` to the typed runtime manifest key union. |
| `package.json` | Exposes `./lsp`; existing scripts continue to drive manifest-based build and deploy. |
| `tests/plugin-manifest.test.mjs` | Exact five-plugin order, descriptor, and package-export contract. |
| `tests/plugin-build.test.mjs` | Six output files, standalone LSP activation, shared import, slot order, and sibling isolation. |
| `tests/plugin-deploy.test.mjs` | Four-to-five local/global migration, stale-file cleanup, option preservation, unrelated order, and idempotency. |
| `deploy-plugins.mjs` | Existing manifest iteration supplies managed LSP paths, copy, configuration rewrite, and cleanup; edit only if the new tests expose a non-manifest feature list. |
| `build-plugins.mjs` | Existing manifest iteration emits LSP; no feature-specific branch is expected. |
| `README.md` | LSP features, configuration, layouts, persistence, built-in replacement, build/deploy counts, artifact table, rollback, and source map. |

## OpenSpec Coverage

| OpenSpec task | Plan task |
| --- | --- |
| `1.1` compile fixture and local declaration | Task 1 |
| `1.2` failing pure model tests | Task 2 |
| `1.3` pure model and shared export | Task 2 |
| `2.1` mounted rows, colors, count, KV, placement | Task 3 |
| `2.2` empty state and reactive root-preserving transitions | Task 4 |
| `2.3` 37/36-cell layout, ellipsis, separators, whitespace | Task 5 |
| `2.4` LSP row and standalone persistent adapter | Tasks 3-5 |
| `3.1` manifest, export, and build RED expectations | Tasks 3 and 6 |
| `3.2` manifest, key type, package, shared, and build output | Tasks 2, 3, and 6 |
| `3.3` local/global migration RED expectations | Task 3 |
| `3.4` manifest-driven deployment and quota-only options | Tasks 3 and 6 |
| `4.1` layouts, install, persistence, built-in replacement | Task 7 |
| `4.2` complete verification and regression resolution | Task 8 |

### Task 1: Lock the synchronized LSP host contract

**Files:**
- Create: `tests/lsp-state-types.fixture.ts`
- Modify: `tsconfig.json:21-28`
- Modify: `opencode-plugin-tui.d.ts:33-48,91-98`

**Interfaces:**
- Consumes: `TuiPluginApi` from `@opencode-ai/plugin/tui`.
- Produces: `TuiLspKnownStatus`, `TuiLspStatus`, `TuiLspEntry`, and `TuiPluginApi.state.lsp(): readonly TuiLspEntry[]`.

- [x] **Step 1: Add the strict compile fixture and include state fixtures in typecheck**

Create `tests/lsp-state-types.fixture.ts` with field reads and an exact readonly return-type assertion:

```ts
import type {
  TuiLspEntry,
  TuiLspKnownStatus,
  TuiPluginApi,
} from "@opencode-ai/plugin/tui"

type Equal<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends
  (<Value>() => Value extends Right ? 1 : 2) ? true : false
type Expect<Value extends true> = Value

export type LspStateIsReadonly = Expect<Equal<
  ReturnType<TuiPluginApi["state"]["lsp"]>,
  readonly TuiLspEntry[]
>>

export const knownStatuses: readonly TuiLspKnownStatus[] = ["connected", "error"]
export const futureStatus: TuiLspEntry["status"] = "future_status"

export function inspectLsp(api: TuiPluginApi) {
  return api.state.lsp().map((entry) => ({
    id: entry.id,
    name: entry.name,
    root: entry.root,
    status: entry.status,
  }))
}
```

Extend `tsconfig.json`'s `include` array after `shared/**/*.ts` so both the existing MCP fixture and this fixture are actually compiled:

```json
"shared/**/*.ts",
"tests/*-state-types.fixture.ts"
```

- [x] **Step 2: Run strict typecheck to verify RED**

Run: `npm run typecheck`

Expected: FAIL in `tests/lsp-state-types.fixture.ts` because `TuiLspEntry`, `TuiLspKnownStatus`, and `TuiPluginApi.state.lsp` do not exist. The existing `tests/mcp-state-types.fixture.ts` must still compile.

- [x] **Step 3: Add the minimal local TUI LSP declaration**

Insert the LSP types after `TuiMcpEntry` in `opencode-plugin-tui.d.ts`:

```ts
export type TuiLspKnownStatus = "connected" | "error"
export type TuiLspStatus = TuiLspKnownStatus | (string & {})

export interface TuiLspEntry {
  id: string
  name: string
  root: string
  status: TuiLspStatus
}
```

Add the accessor immediately after `mcp()` in `TuiPluginApi.state`:

```ts
state: {
  mcp(): readonly TuiMcpEntry[]
  lsp(): readonly TuiLspEntry[]
  provider: readonly Provider[]
```

- [x] **Step 4: Run strict typecheck to verify GREEN**

Run: `npm run typecheck`

Expected: PASS with no TypeScript diagnostics; the fixture proves the list is readonly, every SDK-compatible field is accessible, and an unknown runtime string remains assignable.

- [x] **Step 5: Commit the host contract**

```bash
git add opencode-plugin-tui.d.ts tsconfig.json tests/lsp-state-types.fixture.ts
git commit -m "feat(lsp): declare synchronized state contract"
```

### Task 2: Build the pure ordered LSP panel model

**Files:**
- Create: `tui/features/lsp.ts`
- Create: `tests/lsp-model.test.mjs`
- Modify: `tests/compile-presentation.mjs:5-7,10-41`
- Modify: `shared/opencode-tools-shared.ts:21-25`
- Modify: `tests/shared-boundary.test.mjs:63-66,72-113`

**Interfaces:**
- Consumes: `PanelStatus` from `tui/presentation/types.ts` and readonly entries shaped as `{ id: string; status: string }`.
- Produces: `LspStatusRow`, `LspPanelModel`, and `createLspPanelModel(entries): LspPanelModel` through both `tui/features/lsp.ts` and `shared/opencode-tools-shared.ts`.

- [x] **Step 1: Add pure model tests for every mapping and invariant**

Create `tests/lsp-model.test.mjs`:

```js
import assert from "node:assert/strict"
import test from "node:test"

const { createLspPanelModel } = await import("../.tmp-test/lsp-model.mjs")

test("maps LSP statuses in host order without mutating or exposing metadata", () => {
  const entries = Object.freeze([
    Object.freeze({ id: "typescript", name: "TypeScript", root: "/workspace/a", status: "connected" }),
    Object.freeze({ id: "yaml-ls", name: "YAML", root: "/workspace/b", status: "error" }),
    Object.freeze({ id: "future-ls", name: "Future", root: "/workspace/c", status: "starting" }),
  ])
  const before = structuredClone(entries)

  const model = createLspPanelModel(entries)

  assert.deepEqual(model, {
    rows: [
      { id: "typescript", status: "success" },
      { id: "yaml-ls", status: "error" },
      { id: "future-ls", status: "textMuted" },
    ],
    total: 3,
  })
  assert.deepEqual(entries, before)
  assert.equal(JSON.stringify(model).includes("TypeScript"), false)
  assert.equal(JSON.stringify(model).includes("/workspace"), false)
})

test("counts errors and unknown statuses and returns an empty model", () => {
  assert.equal(createLspPanelModel([
    { id: "broken", status: "error" },
    { id: "future", status: "initializing" },
  ]).total, 2)
  assert.deepEqual(createLspPanelModel([]), { rows: [], total: 0 })
})
```

In `tests/compile-presentation.mjs`, add `"lsp-model"` to the cleanup names and add this build tuple immediately after the MCP model tuple:

```js
["tui/features/lsp.ts", ".tmp-test/lsp-model.mjs", ["browser"]],
```

Add the LSP model-export assertion to `tests/shared-boundary.test.mjs`:

```js
assert.match(source("shared/opencode-tools-shared.ts"), /createLspPanelModel/)
```

- [x] **Step 2: Run the model and boundary tests to verify RED**

Run: `node tests/compile-presentation.mjs && node --test tests/lsp-model.test.mjs tests/shared-boundary.test.mjs`

Expected: FAIL while compiling because `tui/features/lsp.ts` is absent; after only that file exists, the boundary test must remain RED until the shared facade exports it.

- [x] **Step 3: Implement the minimal pure model**

Create `tui/features/lsp.ts`:

```ts
import type { PanelStatus } from "../presentation/types.js"

export type LspStatusRow = {
  id: string
  status: PanelStatus
}

export type LspPanelModel = {
  rows: readonly LspStatusRow[]
  total: number
}

type LspEntry = {
  id: string
  status: string
}

function statusRole(status: string): PanelStatus {
  if (status === "connected") return "success"
  if (status === "error") return "error"
  return "textMuted"
}

export function createLspPanelModel(entries: readonly LspEntry[]): LspPanelModel {
  return {
    rows: entries.map((entry) => ({ id: entry.id, status: statusRole(entry.status) })),
    total: entries.length,
  }
}
```

- [x] **Step 4: Export the model through the managed shared artifact**

Add beside the MCP exports in `shared/opencode-tools-shared.ts`:

```ts
export { createLspPanelModel } from "../tui/features/lsp.js";
export type { LspPanelModel, LspStatusRow } from "../tui/features/lsp.js";
```

- [x] **Step 5: Run targeted tests and strict typecheck to verify GREEN**

Run: `node tests/compile-presentation.mjs && node --test tests/lsp-model.test.mjs tests/shared-boundary.test.mjs && npm run typecheck`

Expected: PASS; rows preserve input order, unknown values remain present and muted, all entries contribute to `total`, inputs remain unchanged, and `name`/`root` do not enter the model.

- [x] **Step 6: Commit the pure model**

```bash
git add tui/features/lsp.ts tests/lsp-model.test.mjs tests/compile-presentation.mjs shared/opencode-tools-shared.ts tests/shared-boundary.test.mjs
git commit -m "feat(lsp): add ordered panel model"
```

### Task 3: Register, release-test, and mount the standalone panel

**Files:**
- Create: `tui/lsp.tsx`
- Create: `tests/lsp-mounted.fixture.ts`
- Create: `tests/lsp-mounted.test.mjs`
- Modify: `tests/compile-presentation.mjs:5-7,10-41`
- Modify: `tests/plugin-manifest.test.mjs:5-15`
- Modify: `tests/plugin-build.test.mjs:65-106,135-267`
- Modify: `tests/plugin-deploy.test.mjs:49-69,82-130,182-457`
- Modify: `tests/shared-boundary.test.mjs:63-66,72-113`
- Modify: `plugin-manifest.json:25-33`
- Modify: `tui/runtime/manifest.ts:3-11`

**Interfaces:**
- Consumes: `CompactPanel`, `createLspPanelModel`, `defineTuiPlugin`, and `pluginDescriptor` from `shared/opencode-tools-shared.ts`.
- Produces: the canonical LSP manifest descriptor, typed `lsp` key, default plugin module `{ id: "aamkye/opencode-tools-lsp", tui }`, one `sidebar_content` registration at order `112`, and `mountLspPanel(options)` for mounted tests.

- [x] **Step 1: Add the mounted fixture harness**

Create `tests/lsp-mounted.fixture.ts` using the existing MCP fixture's element expansion rules, but expose LSP-specific state, persistent storage, viewport rendering, and lifecycle evidence. The exported surface must be:

```ts
import { createRoot, createSignal } from "solid-js"
import lspPlugin from "../tui/lsp.js"

export type LspFixtureEntry = {
  id: string
  name: string
  root: string
  status: string
}

export type LspFixtureOptions = {
  entries?: readonly LspFixtureEntry[]
  savedCollapsed?: boolean
  store?: Map<string, unknown>
}

const COLLAPSED_KEY = "aamkye.opencode-tools-lsp.collapsed"

export async function mountLspPanel(options: LspFixtureOptions = {}) {
  const [entries, setEntries] = createSignal<readonly LspFixtureEntry[]>(options.entries ?? [])
  const store = options.store ?? new Map<string, unknown>()
  if (options.savedCollapsed !== undefined) store.set(COLLAPSED_KEY, options.savedCollapsed)
  const kvWrites: Array<[string, unknown]> = []
  const kvReads: string[] = []
  const registrations: Array<{ order?: number; slots: Record<string, () => unknown> }> = []
  const controller = new AbortController()
  let cleanups: Array<() => void | Promise<void>> = []
  const theme = {
    error: "#ff0000",
    warning: "#ffaa00",
    success: "#00ff00",
    text: "#ffffff",
    textMuted: "#888888",
  }
  const api = {
    lifecycle: {
      signal: controller.signal,
      onDispose(cleanup: () => void | Promise<void>) {
        cleanups.push(cleanup)
        return () => { cleanups = cleanups.filter((candidate) => candidate !== cleanup) }
      },
    },
    slots: { register: (registration: typeof registrations[number]) => registrations.push(registration) },
    state: { lsp: entries },
    kv: {
      get<T>(key: string, fallback: T): T {
        kvReads.push(key)
        return store.has(key) ? store.get(key) as T : fallback
      },
      set<T>(key: string, value: T) {
        store.set(key, value)
        kvWrites.push([key, value])
      },
    },
    theme: { current: theme },
  }

  await lspPlugin.tui(api as never, undefined, undefined)
  const slot = registrations[0]?.slots.sidebar_content
  if (!slot) throw new Error("LSP sidebar slot was not registered")

  let disposeRoot: () => void = () => undefined
  let tree: unknown
  let slotMounts = 0
  createRoot((dispose) => {
    disposeRoot = dispose
    slotMounts += 1
    tree = mount(slot())
  })

  return {
    pluginID: lspPlugin.id,
    registrations,
    kvReads,
    kvWrites,
    store,
    setLsp: setEntries,
    slotMounts: () => slotMounts,
    lifecycleCleanups: () => cleanups.length,
    lifecycleAborted: () => controller.signal.aborted,
    view: (width = 37) => readLspView(tree, width),
    async dispose() {
      disposeRoot()
      controller.abort()
      const queue = cleanups.reverse()
      cleanups = []
      for (const cleanup of queue) await cleanup()
    },
  }
}
```

In the same fixture, define `MountedElement`, `MountedNode`, `isElement`, `mount`, `expand`, `descendantsOf`, and `textOf` with the MCP fixture's recursive behavior. `expand` must render a false `Show` through `props.fallback`, and `readLspView(tree, width)` must return this exact observation shape:

```ts
type LspView = {
  marker: string
  summaryText: string
  summaryColors: Array<string | undefined>
  hint: string
  hintColor: unknown
  dividerCount: number
  rows: Array<{
    id: string
    bullet: string
    bulletColor: unknown
    renderedText: string
    cells: number
    idProps: Record<string, unknown>
  }>
  clickHeader(): void
}
```

For each row, derive `available = Math.max(0, width - Number(bullet.props.width))`, truncate the ID with U+2026 to `available`, set `renderedText` to the bullet plus the truncated ID without `padEnd`, and set `cells` to `bullet width + rendered ID length`. Count divider boxes only when `width="100%"`, `height={1}`, and `border[0] === "top"`.

Add `"lsp-mounted"` to the cleanup names and this tuple after `mcp-mounted` in `tests/compile-presentation.mjs`:

```js
["tests/lsp-mounted.fixture.ts", ".tmp-test/lsp-mounted.mjs", ["browser"]],
```

- [x] **Step 2: Add RED tests for registration, rows, unknown status, collapse count, and KV restart**

Create the first section of `tests/lsp-mounted.test.mjs`:

```js
import assert from "node:assert/strict"
import test from "node:test"

globalThis.React = {
  createElement(type, props, ...children) {
    return { type, props: { ...props, children: children.length === 1 ? children[0] : children } }
  },
  Fragment: Symbol.for("react.fragment"),
}

const { mountLspPanel } = await import("../.tmp-test/lsp-mounted.mjs")
const entries = [
  { id: "typescript", name: "TypeScript", root: "/workspace/ts", status: "connected" },
  { id: "future-ls", name: "Future", root: "/workspace/future", status: "starting" },
  { id: "yaml-ls", name: "YAML", root: "/workspace/yaml", status: "error" },
]

test("registers after MCP and renders ordered IDs with semantic bullets", async () => {
  const mounted = await mountLspPanel({ entries })
  try {
    const view = mounted.view()
    assert.equal(mounted.pluginID, "aamkye/opencode-tools-lsp")
    assert.equal(mounted.registrations.length, 1)
    assert.equal(mounted.registrations[0].order, 112)
    assert.deepEqual(Object.keys(mounted.registrations[0].slots), ["sidebar_content"])
    assert.equal(view.marker, "▼ ")
    assert.equal(view.summaryText, "")
    assert.deepEqual(view.rows.map((row) => [row.id, row.bullet, row.bulletColor]), [
      ["typescript", "• ", "#00ff00"],
      ["future-ls", "• ", "#888888"],
      ["yaml-ls", "• ", "#ff0000"],
    ])
    assert.equal(JSON.stringify(view).includes("TypeScript"), false)
    assert.equal(JSON.stringify(view).includes("/workspace"), false)
  } finally {
    await mounted.dispose()
  }
})

test("persists populated collapse toggles and restores them after restart", async () => {
  const first = await mountLspPanel({ entries })
  const store = first.store
  first.view().clickHeader()
  assert.equal(first.view().marker, "▶ ")
  assert.equal(first.view().summaryText, "3")
  assert.deepEqual(first.view().summaryColors, [undefined])
  assert.deepEqual(first.kvWrites, [["aamkye.opencode-tools-lsp.collapsed", true]])
  await first.dispose()

  const second = await mountLspPanel({ entries, store })
  try {
    assert.equal(second.view().marker, "▶ ")
    second.view().clickHeader()
    assert.equal(second.view().marker, "▼ ")
    assert.deepEqual(second.kvWrites, [["aamkye.opencode-tools-lsp.collapsed", false]])
  } finally {
    await second.dispose()
  }
})
```

Add the adapter import-boundary assertion to `tests/shared-boundary.test.mjs` now that Task 3 creates `tui/lsp.tsx`:

```js
assertRelativeImports("tui/lsp.tsx", ["../shared/opencode-tools-shared.js"])
```

In the same RED phase, extend `tests/plugin-manifest.test.mjs` with the exact descriptor after MCP:

```js
["lsp", "aamkye/opencode-tools-lsp", "tui/lsp.tsx", "opencode-tools-lsp.js", 112, "none"],
```

Rename its first test to `manifest describes the five standalone plugins in deployment order`.

In `tests/plugin-build.test.mjs`, add `lsp() { return [] }` beside `mcp()` in `createApi`, assert `expectedArtifacts.length === 6` and `Object.keys(buildResults.features).length === 5`, and add this activation expectation:

```js
lsp: { slots: ["sidebar_content"], keymaps: 0 },
```

In `tests/plugin-deploy.test.mjs`, keep every initial managed config at the shipped four entries, but assert the deployed managed specs are:

```js
[
  "./opencode-tools-quota.js",
  "./opencode-tools-home.js",
  "./opencode-tools-token-report.js",
  "./opencode-tools-mcp.js",
  "./opencode-tools-lsp.js",
]
```

Seed `opencode-tools-lsp.js` with `stale managed LSP artifact` and `tui/lsp.tsx` with `stale managed LSP source` before local, project-fallback, and global deployment. Assert afterward that the output equals `dist/opencode-tools-lsp.js`, the stale source is absent, LSP is a string entry with no options, unrelated entries retain their relative order, quota keeps its selected options, and the second deployment snapshot equals the first.

- [x] **Step 3: Run mounted and release tests to verify RED**

Run these separately so both boundaries produce RED evidence:

```bash
node tests/compile-presentation.mjs
node --test tests/shared-boundary.test.mjs tests/plugin-manifest.test.mjs tests/plugin-build.test.mjs tests/plugin-deploy.test.mjs
```

Expected: FAIL while compiling because `tui/lsp.tsx` is absent, and independently fail the release assertions because the manifest still has four features, build output still has five total files, and deployment does not install LSP. The tests must not be weakened to accept MCP order `111`, status labels, colored count text, forced-empty collapse behavior, or a fifth feature list outside the manifest.

- [x] **Step 4: Add the canonical descriptor and implement the minimal populated standalone adapter**

Append this descriptor immediately after MCP in `plugin-manifest.json`:

```json
{
  "key": "lsp",
  "id": "aamkye/opencode-tools-lsp",
  "source": "tui/lsp.tsx",
  "outfile": "opencode-tools-lsp.js",
  "slotOrder": 112,
  "options": "none"
}
```

Update the runtime key before compiling the adapter:

```ts
export type PluginKey = "quota" | "home" | "token-report" | "mcp" | "lsp"
```

Create `tui/lsp.tsx` with a local row and persistent signal. At this stage the adapter may render an empty expanded body without the hint; Task 4 adds the exact fallback under a new failing test.

```tsx
import { createMemo, createSignal, For, type JSX } from "solid-js"

import {
  CompactPanel,
  createLspPanelModel,
  defineTuiPlugin,
  pluginDescriptor,
  type LspStatusRow,
  type PanelTheme,
} from "../shared/opencode-tools-shared.js"

const descriptor = pluginDescriptor("lsp")
const COLLAPSED_KEY = "aamkye.opencode-tools-lsp.collapsed"

function LspRow(props: { row: LspStatusRow; theme: () => PanelTheme }) {
  return (
    <box flexDirection="row" width="100%" overflow="hidden">
      <text width={2} flexShrink={0} fg={props.theme()[props.row.status]}>• </text>
      <text overflow="hidden" wrapMode="none" truncate={true}>{props.row.id}</text>
    </box>
  )
}

const plugin = defineTuiPlugin(descriptor, (_context, api) => {
  function LspPanel() {
    const [collapsed, setCollapsed] = createSignal(api.kv.get(COLLAPSED_KEY, false))
    const model = createMemo(() => createLspPanelModel(api.state.lsp()))
    const toggle = () => {
      const next = !collapsed()
      setCollapsed(next)
      api.kv.set(COLLAPSED_KEY, next)
    }

    const render = () => (
      <CompactPanel
        title="LSP"
        collapsed={collapsed()}
        summary={collapsed() ? { text: String(model().total) } : undefined}
        onToggle={toggle}
        footerDivider={!collapsed()}
        theme={() => api.theme.current}
      >
        <For each={model().rows}>
          {(row) => <LspRow row={row} theme={() => api.theme.current} />}
        </For>
      </CompactPanel>
    )

    return render as unknown as JSX.Element
  }

  api.slots.register({
    order: descriptor.slotOrder,
    slots: { sidebar_content: () => <LspPanel /> },
  })
})

export default plugin
```

- [x] **Step 5: Run mounted and release tests to verify GREEN**

Run: `node tests/compile-presentation.mjs && node --test tests/lsp-mounted.test.mjs tests/shared-boundary.test.mjs tests/plugin-manifest.test.mjs tests/plugin-build.test.mjs tests/plugin-deploy.test.mjs && npm run typecheck`

Expected: PASS for registration, order, plain ordered IDs, all three color roles, uncolored count, one KV write per populated interaction, preference restoration, six build outputs, isolated LSP activation, and idempotent local/global four-to-five migration. `build-plugins.mjs` and `deploy-plugins.mjs` should pass unchanged because they iterate the canonical manifest.

- [x] **Step 6: Commit the mounted foundation**

```bash
git add tui/lsp.tsx tests/lsp-mounted.fixture.ts tests/lsp-mounted.test.mjs tests/compile-presentation.mjs tests/shared-boundary.test.mjs tests/plugin-manifest.test.mjs tests/plugin-build.test.mjs tests/plugin-deploy.test.mjs plugin-manifest.json tui/runtime/manifest.ts
git commit -m "feat(lsp): register standalone sidebar panel"
```

### Task 4: Add the empty state and root-preserving reactive transitions

**Files:**
- Modify: `tests/lsp-mounted.test.mjs`
- Modify: `tui/lsp.tsx`

**Interfaces:**
- Consumes: `mountLspPanel`, `setLsp`, `slotMounts`, KV observations, and the adapter signal created in Task 3.
- Produces: exact empty hint behavior and list transitions that retain collapse preference and one mounted slot root.

- [x] **Step 1: Add RED tests for empty interaction and reactive transitions**

Append to `tests/lsp-mounted.test.mjs`:

```js
test("defaults empty LSP expanded and persists empty collapse interaction", async () => {
  const mounted = await mountLspPanel()
  try {
    let view = mounted.view()
    assert.equal(view.marker, "▼ ")
    assert.equal(view.summaryText, "")
    assert.equal(view.hint, "LSPs will activate as files are read")
    assert.equal(view.hintColor, "#888888")
    assert.equal(view.dividerCount, 2)
    assert.deepEqual(mounted.kvWrites, [])

    view.clickHeader()
    view = mounted.view()
    assert.equal(view.marker, "▶ ")
    assert.equal(view.summaryText, "0")
    assert.equal(view.hint, "")
    assert.equal(view.dividerCount, 1)
    assert.deepEqual(mounted.kvWrites, [["aamkye.opencode-tools-lsp.collapsed", true]])
  } finally {
    await mounted.dispose()
  }
})

test("reacts between empty and populated lists without remounting or resetting preference", async () => {
  const mounted = await mountLspPanel()
  try {
    assert.equal(mounted.slotMounts(), 1)
    assert.deepEqual(mounted.kvReads, ["aamkye.opencode-tools-lsp.collapsed"])
    mounted.setLsp([
      { id: "yaml-ls", name: "YAML", root: "/workspace", status: "error" },
      { id: "typescript", name: "TypeScript", root: "/workspace", status: "connected" },
    ])
    assert.deepEqual(mounted.view().rows.map((row) => [row.id, row.bulletColor]), [
      ["yaml-ls", "#ff0000"],
      ["typescript", "#00ff00"],
    ])
    mounted.view().clickHeader()
    assert.equal(mounted.view().summaryText, "2")
    mounted.setLsp([{ id: "future", name: "Future", root: "/workspace", status: "loading" }])
    assert.equal(mounted.view().summaryText, "1")
    mounted.setLsp([])
    assert.equal(mounted.view().summaryText, "0")
    assert.equal(mounted.view().marker, "▶ ")
    assert.equal(mounted.slotMounts(), 1)
    assert.equal(mounted.registrations.length, 1)
    assert.deepEqual(mounted.kvReads, ["aamkye.opencode-tools-lsp.collapsed"])
    assert.deepEqual(mounted.kvWrites, [["aamkye.opencode-tools-lsp.collapsed", true]])
  } finally {
    await mounted.dispose()
  }
})

test("restores expanded and collapsed preferences for an empty list", async () => {
  for (const savedCollapsed of [false, true]) {
    const mounted = await mountLspPanel({ savedCollapsed })
    try {
      assert.equal(mounted.view().marker, savedCollapsed ? "▶ " : "▼ ")
      assert.equal(mounted.view().hint, savedCollapsed ? "" : "LSPs will activate as files are read")
      assert.deepEqual(mounted.kvWrites, [])
    } finally {
      await mounted.dispose()
    }
  }
})
```

- [x] **Step 2: Run the empty/reactive tests to verify RED**

Run: `node tests/compile-presentation.mjs && node --test --test-name-pattern="empty|reacts" tests/lsp-mounted.test.mjs`

Expected: FAIL because the expanded empty body lacks `LSPs will activate as files are read`; collapse and reactive assertions must otherwise show no state-driven KV writes or remounts.

- [x] **Step 3: Render the exact muted fallback without changing collapse logic**

Import `Show` and replace the adapter's body with:

```tsx
<Show
  when={model().rows.length > 0}
  fallback={<text fg={api.theme.current.textMuted}>LSPs will activate as files are read</text>}
>
  <For each={model().rows}>
    {(row) => <LspRow row={row} theme={() => api.theme.current} />}
  </For>
</Show>
```

Keep `collapsed={collapsed()}`, `footerDivider={!collapsed()}`, and the unconditional header toggle. Do not introduce `model().total === 0` into collapse or toggle decisions.

- [x] **Step 4: Run the full mounted file to verify GREEN**

Run: `node tests/compile-presentation.mjs && node --test tests/lsp-mounted.test.mjs`

Expected: PASS; empty defaults expanded, empty toggles persist, state transitions update hint/rows/colors/count in place, and neither list changes nor initial state write KV.

- [x] **Step 5: Commit empty and reactive behavior**

```bash
git add tui/lsp.tsx tests/lsp-mounted.test.mjs
git commit -m "feat(lsp): handle empty reactive state"
```

### Task 5: Enforce compact 37/36-cell row layout and clean disposal

**Files:**
- Modify: `tests/lsp-mounted.test.mjs`
- Modify: `tui/lsp.tsx`

**Interfaces:**
- Consumes: local `LspRow`, `CompactPanel`, fixture viewport simulation, and plugin lifecycle registration.
- Produces: a 2-cell fixed bullet plus a zero-basis shrinking ID region, correct separators in both forms, no textual trailing whitespace, and complete lifecycle cleanup.

- [x] **Step 1: Add RED constrained-width, separator, whitespace, and disposal tests**

Append to `tests/lsp-mounted.test.mjs`:

```js
test("truncates long IDs inside 37 and 36 cells without trailing whitespace", async () => {
  const longID = "typescript-language-server-with-an-extremely-long-id"
  const mounted = await mountLspPanel({
    entries: [{ id: longID, name: "ignored", root: "/ignored", status: "connected" }],
  })
  try {
    const wide = mounted.view(37).rows[0]
    const narrow = mounted.view(36).rows[0]
    assert.equal(wide.renderedText, `• ${longID.slice(0, 34)}…`)
    assert.equal(narrow.renderedText, `• ${longID.slice(0, 33)}…`)
    assert.equal(wide.renderedText.length, 37)
    assert.equal(narrow.renderedText.length, 36)
    assert.equal(wide.renderedText.trimEnd(), wide.renderedText)
    assert.equal(narrow.renderedText.trimEnd(), narrow.renderedText)
    assert.equal(wide.bullet, "• ")
    assert.deepEqual({
      flexBasis: wide.idProps.flexBasis,
      flexGrow: wide.idProps.flexGrow,
      flexShrink: wide.idProps.flexShrink,
      minWidth: wide.idProps.minWidth,
      overflow: wide.idProps.overflow,
      wrapMode: wide.idProps.wrapMode,
      truncate: wide.idProps.truncate,
      width: wide.idProps.width,
    }, {
      flexBasis: 0,
      flexGrow: 1,
      flexShrink: 1,
      minWidth: 0,
      overflow: "hidden",
      wrapMode: "none",
      truncate: true,
      width: undefined,
    })
  } finally {
    await mounted.dispose()
  }
})

test("uses two full-width separators expanded and one collapsed", async () => {
  for (const entries of [[], [
    { id: "typescript", name: "TypeScript", root: "/workspace", status: "connected" },
  ]]) {
    const mounted = await mountLspPanel({ entries })
    try {
      assert.equal(mounted.view().dividerCount, 2)
      mounted.view().clickHeader()
      assert.equal(mounted.view().dividerCount, 1)
      assert.equal(mounted.view().rows.length, 0)
      assert.equal(mounted.view().hint, "")
    } finally {
      await mounted.dispose()
    }
  }
})

test("disposes the Solid root and plugin lifecycle", async () => {
  const mounted = await mountLspPanel({ entries })
  assert.equal(mounted.slotMounts(), 1)
  assert.equal(mounted.lifecycleAborted(), false)
  assert.ok(mounted.lifecycleCleanups() >= 1)
  await mounted.dispose()
  assert.equal(mounted.lifecycleAborted(), true)
  assert.equal(mounted.lifecycleCleanups(), 0)
})
```

- [x] **Step 2: Run constrained mounted tests to verify RED**

Run: `node tests/compile-presentation.mjs && node --test --test-name-pattern="37 and 36|separators|disposes" tests/lsp-mounted.test.mjs`

Expected: FAIL because the initial ID `<text>` lacks `flexBasis`, `flexGrow`, `flexShrink`, and `minWidth`; width assertions must still prove the bullet remains visible at 36 cells.

- [x] **Step 3: Apply the exact flexible ID allocation**

Replace only the ID node in `LspRow`:

```tsx
<text
  flexBasis={0}
  flexGrow={1}
  flexShrink={1}
  minWidth={0}
  overflow="hidden"
  wrapMode="none"
  truncate={true}
>
  {props.row.id}
</text>
```

Keep the row at `width="100%"`, keep the bullet at `width={2}` and `flexShrink={0}`, and add no spacer or right-side label.

- [x] **Step 4: Run all LSP and existing MCP mounted tests to verify GREEN and non-regression**

Run: `node tests/compile-presentation.mjs && node --test tests/lsp-mounted.test.mjs tests/mcp-mounted.test.mjs`

Expected: PASS; LSP gives 35 ID cells at width 37 and 34 at width 36 with no padding, while MCP retains its existing fixed-label 37-cell behavior unchanged.

- [x] **Step 5: Commit compact layout behavior**

```bash
git add tui/lsp.tsx tests/lsp-mounted.test.mjs
git commit -m "feat(lsp): constrain compact row layout"
```

### Task 6: Complete package export and audit release integration

**Files:**
- Modify: `tests/plugin-manifest.test.mjs:1-30`
- Verify: `tests/plugin-build.test.mjs`
- Verify: `tests/plugin-deploy.test.mjs`
- Modify: `package.json:7-12`
- Verify unchanged unless tests expose a defect: `build-plugins.mjs:86-110`
- Verify unchanged unless tests expose a defect: `deploy-plugins.mjs:30-49,161-207`

**Interfaces:**
- Consumes: the five-entry manifest and release tests made GREEN in Task 3.
- Produces: the public `./lsp` source export plus final evidence that build and deployment remain entirely manifest-driven.

- [x] **Step 1: Add the exact package export RED expectation**

Add this package export assertion to `tests/plugin-manifest.test.mjs` after the five-entry manifest test:

```js
test("package exports every standalone plugin", async () => {
  const pkg = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"))
  assert.deepEqual(pkg.exports, {
    "./quota": "./tui/quota.tsx",
    "./home": "./tui/home.tsx",
    "./token-report": "./tui/token-report.tsx",
    "./mcp": "./tui/mcp.tsx",
    "./lsp": "./tui/lsp.tsx",
  })
})
```

Import `readFile` from `node:fs/promises` at the top of that test file.

- [x] **Step 2: Run the package contract to verify RED**

Run: `node --test tests/plugin-manifest.test.mjs`

Expected: FAIL only in `package exports every standalone plugin` because `package.json` omits `./lsp`; the five-entry manifest assertion added in Task 3 remains GREEN.

- [x] **Step 3: Add the public LSP source export**

Add the package export immediately after MCP in `package.json`:

```json
"./mcp": "./tui/mcp.tsx",
"./lsp": "./tui/lsp.tsx"
```

- [x] **Step 4: Run package, build, and deployment tests to verify GREEN**

Run: `node --test tests/plugin-manifest.test.mjs tests/plugin-build.test.mjs tests/plugin-deploy.test.mjs && npm run build`

Expected: PASS and emit these non-empty files:

```text
dist/opencode-tools-shared.js
dist/opencode-tools-quota.js
dist/opencode-tools-home.js
dist/opencode-tools-token-report.js
dist/opencode-tools-mcp.js
dist/opencode-tools-lsp.js
```

The build test proves every feature imports the external shared artifact and activates no sibling. Deployment proves both modes migrate four initial entries to five, overwrite stale LSP output, remove stale `tui/lsp.tsx`, retain unrelated entries and quota options, give LSP no options, and produce an unchanged second snapshot.

- [x] **Step 5: Audit the generic release loops rather than adding LSP branches**

Confirm `build-plugins.mjs` still uses:

```js
for (const entry of manifest) {
  features[entry.key] = await build({
    ...common,
    entryPoints: [entry.source],
    outfile: resolve(distRoot, entry.outfile),
  })
}
```

Confirm `deploy-plugins.mjs` still derives artifacts and managed entries from the manifest:

```js
const artifacts = [sharedArtifact, ...pluginManifest.map((entry) => entry.outfile)]
const managedEntries = pluginManifest.map((entry) => (
  entry.options === "quota" && configured?.priority < Infinity
    ? [`./${entry.outfile}`, configured.options]
    : `./${entry.outfile}`
))
```

Expected: no edit to either script. If the tests expose a literal feature list, replace it with the shown manifest iteration and rerun Step 4; do not add an LSP-only release branch.

- [x] **Step 6: Commit the package export**

```bash
git add package.json tests/plugin-manifest.test.mjs
git commit -m "feat(lsp): export standalone plugin source"
```

### Task 7: Document installation, layouts, persistence, deployment, and rollback

**Files:**
- Modify: `README.md:8-10,59-68,86-138,182-223,225-319`

**Interfaces:**
- Consumes: the final runtime ID, artifact name, collapse key behavior, exact layouts, and manifest order from Tasks 1-6.
- Produces: user-facing installation and replacement guidance that never claims automatic built-in deactivation.

- [x] **Step 1: Add a documentation contract check before editing prose**

Run this read-only check to establish RED:

```bash
node -e 'const fs=require("node:fs");const s=fs.readFileSync("README.md","utf8");for(const x of ["opencode-tools-lsp.js","internal:sidebar-lsp","LSPs will activate as files are read","aamkye/opencode-tools-lsp"])if(!s.includes(x))throw new Error(`missing ${x}`)'
```

Expected: FAIL on `opencode-tools-lsp.js` before the README update.

- [x] **Step 2: Update every count, example, layout, and replacement instruction**

Make these concrete README changes:

```text
- Add LSP status to the opening capability sentence.
- Add an LSP feature section: ordered synchronized IDs, success/error/muted bullets, no polling, persistent collapse, and the exact empty hint.
- Add "./opencode-tools-lsp.js" immediately after MCP in the configuration example.
- Add "internal:sidebar-lsp": false beside "internal:sidebar-mcp": false.
- State that LSP is a string entry with no options and that neither external panel deactivates its built-in counterpart.
- Add expanded, empty-expanded, and collapsed LSP layout blocks exactly as shown below.
- Change all "four standalone" release wording to "five standalone".
- Add LSP to the artifact tree, artifact table, source-files table, build description, and edit-workflow comment.
- Add LSP rollback instructions that remove the external artifact entry and re-enable internal:sidebar-lsp.
```

Use these exact layout blocks:

```text
▼ LSP
-------------------------------------
• typescript
• yaml-ls
-------------------------------------
```

```text
▼ LSP
-------------------------------------
LSPs will activate as files are read
-------------------------------------
```

```text
▶ LSP                               2
-------------------------------------
```

Explain that the count uses normal header text, unknown statuses remain present with a muted bullet, long IDs truncate with an ellipsis at 37 or 36 cells, and only header clicks write the persisted collapse preference.

- [x] **Step 3: Run documentation checks and inspect changed terminology**

Run:

```bash
node -e 'const fs=require("node:fs");const s=fs.readFileSync("README.md","utf8");for(const x of ["opencode-tools-lsp.js","internal:sidebar-lsp","LSPs will activate as files are read","aamkye/opencode-tools-lsp","five standalone"])if(!s.includes(x))throw new Error(`missing ${x}`);if(/builds? the four standalone|migrates? managed configuration entries to the four standalone/i.test(s))throw new Error("stale four-plugin release wording")'
```

Expected: PASS. Then run `git diff --check -- README.md`; expected PASS with no trailing whitespace. Confirm the prose says users disable `internal:sidebar-lsp` themselves and does not say deployment edits `plugin_enabled`.

- [x] **Step 4: Commit documentation**

```bash
git add README.md
git commit -m "docs(lsp): add sidebar installation guide"
```

### Task 8: Run final regression and artifact verification

**Files:**
- Verify: all files changed in Tasks 1-7
- Modify if full-suite verification exposes stale four-plugin expectations: `tests/plugin-wiring.test.mjs`
- Modify only when a verification failure identifies a regression in an in-scope file.

**Interfaces:**
- Consumes: the complete host, model, adapter, release, deployment, and documentation implementation.
- Produces: evidence that all OpenSpec scenarios pass together and the worktree contains only intended implementation changes.

- [x] **Step 1: Run the complete automated verification sequence**

Run each command separately so the failing boundary is visible:

```bash
npm test
npm run typecheck
npm run build
```

Expected: all three commands exit `0`. `npm test` includes fixture compilation, all LSP tests, existing MCP tests, manifest/build/deploy tests, and the remaining regression suite. Typecheck has no diagnostics. Build emits five feature artifacts plus shared.

- [x] **Step 2: Verify artifact shape and no sibling activation**

Run:

```bash
node --test tests/plugin-build.test.mjs tests/plugin-deploy.test.mjs
```

Expected: PASS, including isolated activation of each artifact, one LSP `sidebar_content` registration at order `112`, no sibling source in its metafile, local/global four-to-five migration, stale cleanup, quota-only options, unrelated-entry preservation, and idempotency.

- [x] **Step 3: Verify formatting, metadata scope, and OpenSpec coverage**

Run:

```bash
git diff --check
git status --short
git diff --name-only 6c42ac95493852d5791bb4e037cea8394081c365
```

Expected: `git diff --check` exits `0`; status and changed-file output contain only files named in this plan and the OpenSpec task checkoff file if the execution workflow records completed tasks. Review `openspec/changes/add-opencode-tools-lsp/tasks.md` and check all 13 items only after their corresponding RED/GREEN evidence above has passed.

- [x] **Step 4: Commit verification-only fixes if the prior steps required any**

If no files changed during verification, make no commit. If an in-scope regression required a fix, rerun all commands from Steps 1-3 and then commit only those fix files:

```bash
git add opencode-plugin-tui.d.ts tsconfig.json tests/lsp-state-types.fixture.ts tui/features/lsp.ts tests/lsp-model.test.mjs shared/opencode-tools-shared.ts tests/shared-boundary.test.mjs tui/lsp.tsx tests/lsp-mounted.fixture.ts tests/lsp-mounted.test.mjs tests/compile-presentation.mjs plugin-manifest.json tui/runtime/manifest.ts package.json tests/plugin-manifest.test.mjs tests/plugin-build.test.mjs tests/plugin-deploy.test.mjs tests/plugin-wiring.test.mjs README.md
git commit -m "fix(lsp): resolve verification regressions"
```

Expected: no unverified application change remains, all 13 OpenSpec tasks are checked, and the final commit range starts at `6c42ac95493852d5791bb4e037cea8394081c365`.
