---
change: add-opencode-tools-mcp
design-doc: docs/superpowers/specs/2026-07-16-opencode-tools-mcp-design.md
base-ref: ce0960229bdf299dd3ef678f3dbee9d538cbda50
---

# Standalone TUI Plugin Foundation and MCP Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship quota, home, token-report, and MCP as independent manifest-driven TUI plugins, with shared lifecycle/services and a compact reactive MCP sidebar panel.

**Architecture:** A data-only root manifest is the single source for plugin identity, source, output, order, and options. The shared artifact owns registration lifecycle, API-scoped service leases, provider-hub reconciliation, pure feature models, and compact presentation primitives; the four `tui/*.tsx` files remain host/rendering adapters. Build and deployment consume the same validated manifest and migrate historical composed installations deterministically.

**Tech Stack:** TypeScript 6, SolidJS 1.9, OpenTUI Solid, OpenCode TUI API, esbuild, Node.js test runner, JSON plugin manifest.

## Global Constraints

- OpenSpec under `openspec/changes/add-opencode-tools-mcp/` remains the canonical requirement source; do not edit its artifacts during implementation.
- Require OpenCode `>=1.18.1`; do not add compatibility shims for older TUI APIs.
- Ship exactly four standalone feature artifacts plus `opencode-tools-shared.js`; no feature artifact may activate a sibling.
- Use runtime IDs `aamkye/opencode-tools-quota`, `aamkye/opencode-tools-home`, `aamkye/opencode-tools-token-report`, and `aamkye/opencode-tools-mcp`.
- Preserve quota output/options, home output, token-report commands/dialog/persistence behavior, and quota's ephemeral collapse state.
- MCP reads only `api.state.mcp()`, preserves source order, ignores runtime error strings, treats unknown statuses as unhealthy/muted, and never polls or changes MCP lifecycle.
- All compact sidebar representations must fit 37 cells and contain no trailing whitespace.
- MCP persistence key is `aamkye.opencode-tools-mcp.collapsed`; empty state is forced collapsed without writing this preference.
- Deployment preserves unrelated entries in relative order, transfers the highest-priority managed options only to quota, appends manifest entries in manifest order, removes obsolete managed files/commands, writes trailing-newline JSON, and is byte-idempotent.
- Existing planning artifacts belong to this change; do not revert, replace, or fold them into implementation commits.

## Canonical Coverage

| OpenSpec tasks | Plan task |
| --- | --- |
| 1.1 | 1 |
| 1.2, 1.3 | 2 |
| 1.4 | 3 |
| 1.5 | 4 |
| 2.1 | 5 |
| 2.2 | 6 |
| 2.3 | 7 |
| 2.4 | 8 |
| 2.5 | 9 |
| 3.1, 3.2 | 10 |
| 3.3 | 11 |
| 4.1 | 12 |
| 4.2, 4.3 | 13 |
| 4.4, 4.5 | 14 |
| 5.1 | 15 |
| 5.2 | 16 |
| 5.3, 5.4 | 17 |
| 5.5 | 18 |
| 6.1 | Final verification |

## File Structure

**New files**

- `plugin-manifest.json`: data-only records for the four standalone features.
- `plugin-manifest.mjs`: manifest loading, structural validation, uniqueness checks, and key lookup for Node build/deploy code.
- `tui/runtime/manifest.ts`: typed JSON-manifest lookup used by feature source modules.
- `tui/runtime/plugin.ts`: `defineTuiPlugin`, activation scopes, cleanup, and API-scoped service leases.
- `tui/services/quota-provider-hub.ts`: stable provider-hub accessors and demand reconciliation for quota/home.
- `tui/features/quota.ts`: quota option normalization, selection, composition, and provider demand.
- `tui/features/home.ts`: home summary formatting, percentage parts, and semantic color roles.
- `tui/features/token-report.ts`: shared route selection and report persistence behavior.
- `tui/features/mcp.ts`: pure MCP status and aggregate mapper.
- `tui/presentation/compact-panel.tsx`: controlled shell, full-width dividers, and compact status row.
- `tui/mcp.tsx`: standalone MCP host adapter and persisted collapse controller.
- `tests/plugin-manifest.test.mjs`: manifest records and duplicate-field validation.
- `tests/plugin-runtime.test.mjs`: activation scope and service lease behavior.
- `tests/provider-hub.test.mjs`: demand order, reconciliation, replacement, and final disposal.
- `tests/plugin-adapters.test.mjs`: current feature parity and standalone registration isolation.
- `tests/compact-panel-mounted.fixture.ts`: mounted shell/status-row test helper.
- `tests/compact-panel-mounted.test.mjs`: shell and 37-cell status-row behavior.
- `tests/mcp-state-types.fixture.ts`: compile-time coverage for `api.state.mcp()`.
- `tests/mcp-model.test.mjs`: known/unknown statuses, order, and summary semantics.
- `tests/mcp-mounted.fixture.ts`: reactive MCP adapter harness.
- `tests/mcp-mounted.test.mjs`: expanded/collapsed/empty/reactive/KV MCP behavior.

**Modified files**

- `shared/opencode-tools-shared.ts`: export runtime, service, feature, and presentation contracts.
- `tui/quota.tsx`, `tui/home.tsx`, `tui/token-report.tsx`: become thin standalone adapters.
- `tui/presentation/renderer.tsx`: render normalized quota content through the controlled shell.
- `opencode-plugin-tui.d.ts`: declare MCP state and known statuses with a runtime-safe boundary.
- `tests/compile-presentation.mjs`: compile new source and fixtures into `.tmp-test`.
- Existing parity tests under `tests/`: update imports and expectations without deleting behavioral assertions.
- `build-plugins.mjs`: validate and iterate the manifest instead of synthesizing a composed entry.
- `deploy-plugins.mjs`: copy/migrate all manifest artifacts and historical managed paths.
- `tests/plugin-build.test.mjs`, `tests/plugin-deploy.test.mjs`, `tests/plugin-wiring.test.mjs`, `tests/shared-boundary.test.mjs`: enforce standalone packaging and boundaries.
- `package.json`, `package-lock.json`, `tsconfig.json`: exports/files/type inputs and OpenCode engine floor.
- `README.md`: standalone installation, migration, MCP layouts, built-in replacement, and rollback.

---

### Task 1: Add the Authoritative Plugin Manifest (OpenSpec 1.1)

**Files:**
- Create: `plugin-manifest.json`
- Create: `plugin-manifest.mjs`
- Create: `tui/runtime/manifest.ts`
- Create: `tests/plugin-manifest.test.mjs`

**Interfaces:**
- Produces: `PluginManifestEntry`, `PLUGIN_KEYS`, `pluginManifest`, `validatePluginManifest(entries)`, and `pluginDescriptor(key)`.
- Invariant: quota order is `110`, MCP order is `111`, home order is `110`, and token-report has no `slotOrder`.

- [x] **Step 1: Write the manifest test**

```js
import assert from "node:assert/strict"
import test from "node:test"
import { pluginManifest, validatePluginManifest } from "../plugin-manifest.mjs"

const expected = [
  ["quota", "aamkye/opencode-tools-quota", "tui/quota.tsx", "opencode-tools-quota.js", 110, "quota"],
  ["home", "aamkye/opencode-tools-home", "tui/home.tsx", "opencode-tools-home.js", 110, "none"],
  ["token-report", "aamkye/opencode-tools-token-report", "tui/token-report.tsx", "opencode-tools-token-report.js", undefined, "none"],
  ["mcp", "aamkye/opencode-tools-mcp", "tui/mcp.tsx", "opencode-tools-mcp.js", 111, "none"],
]

test("manifest describes the four standalone plugins in deployment order", () => {
  assert.deepEqual(pluginManifest.map((entry) => [entry.key, entry.id, entry.source, entry.outfile, entry.slotOrder, entry.options]), expected)
  assert.doesNotThrow(() => validatePluginManifest(pluginManifest))
})

for (const field of ["key", "id", "source", "outfile"]) {
  test(`manifest rejects duplicate ${field}`, () => {
    const entries = structuredClone(pluginManifest)
    entries[1][field] = entries[0][field]
    assert.throws(() => validatePluginManifest(entries), new RegExp(`duplicate ${field}: ${entries[0][field]}`))
  })
}
```

- [x] **Step 2: Run RED**

Run: `node --test tests/plugin-manifest.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `plugin-manifest.mjs`.

- [x] **Step 3: Add the data-only records and validators**

Write `plugin-manifest.json` as the exact four records from `expected`, omitting `slotOrder` for token-report. In `plugin-manifest.mjs`, import the JSON with `with { type: "json" }`, freeze a cloned record array, validate each required string, restrict `options` to `quota|none`, validate optional finite `slotOrder`, and reject duplicate `key`, `id`, `source`, or `outfile` with the tested message. In `tui/runtime/manifest.ts`, import the same JSON and expose this typed lookup:

```ts
export type PluginKey = "quota" | "home" | "token-report" | "mcp"
export type PluginManifestEntry = {
  key: PluginKey
  id: string
  source: string
  outfile: string
  slotOrder?: number
  options: "quota" | "none"
}

export const pluginManifest = manifest as readonly PluginManifestEntry[]

export function pluginDescriptor(key: PluginKey): PluginManifestEntry {
  const descriptor = pluginManifest.find((entry) => entry.key === key)
  if (!descriptor) throw new Error(`missing plugin descriptor: ${key}`)
  return descriptor
}
```

- [x] **Step 4: Run GREEN**

Run: `node --test tests/plugin-manifest.test.mjs`

Expected: PASS, 5 tests.

- [x] **Step 5: Commit**

```bash
git add plugin-manifest.json plugin-manifest.mjs tui/runtime/manifest.ts tests/plugin-manifest.test.mjs
git commit -m "feat: add standalone plugin manifest"
```

### Task 2: Implement Standalone Activation Scopes (OpenSpec 1.2, 1.3)

**Files:**
- Create: `tui/runtime/plugin.ts`
- Create: `tests/plugin-runtime.test.mjs`
- Modify: `tests/compile-presentation.mjs`
- Modify: `shared/opencode-tools-shared.ts`

**Interfaces:**
- Produces: `defineTuiPlugin(descriptor, activate)`, `TuiFeatureContext`, and `FeatureActivation`.
- Cleanup is async-capable, idempotent, LIFO, exhaustive, and preserves an activation error over cleanup errors.

- [x] **Step 1: Add lifecycle test compilation and failing tests**

Add `tui/runtime/plugin.ts -> .tmp-test/plugin-runtime.mjs` to `tests/compile-presentation.mjs`. In `tests/plugin-runtime.test.mjs`, use a fake lifecycle whose `onDispose` returns an unregister function, then test: descriptor ID/module shape; registered plus returned cleanup order `returned, second, first`; repeated host disposal runs nothing twice; activation throw rolls back and rethrows `activation failed`; cleanup failure does not replace that error; pre-aborted lifecycle unregisters and cleans immediately.

The central success case must contain:

```js
const events = []
const module = defineTuiPlugin(descriptor, async (context) => {
  context.onCleanup(() => events.push("first"))
  context.onCleanup(() => events.push("second"))
  return () => events.push("returned")
})
await module.tui(api, undefined, undefined)
assert.equal(module.id, descriptor.id)
assert.equal(lifecycle.count(), 1)
await lifecycle.dispose()
await lifecycle.dispose()
assert.deepEqual(events, ["returned", "second", "first"])
```

- [x] **Step 2: Run RED**

Run: `node tests/compile-presentation.mjs && node --test tests/plugin-runtime.test.mjs`

Expected: FAIL because `defineTuiPlugin` is not exported.

- [x] **Step 3: Implement the activation scope**

Implement one `cleanup()` promise per activation. Push `context.onCleanup` callbacks as they are acquired, push the returned cleanup after activation resolves, register exactly one host lifecycle callback, and check `api.lifecycle.signal.aborted` immediately after registration. On any activation/registration error, unregister if available, drain the stack, and throw the original error. When cleanup has no activation error, retain the first cleanup error while attempting every callback, then throw it after the stack drains.

Export from `shared/opencode-tools-shared.ts`:

```ts
export { defineTuiPlugin } from "../tui/runtime/plugin.js"
export type { FeatureActivation, TuiFeatureContext } from "../tui/runtime/plugin.js"
export { pluginDescriptor, pluginManifest } from "../tui/runtime/manifest.js"
export type { PluginKey, PluginManifestEntry } from "../tui/runtime/manifest.js"
```

- [x] **Step 4: Run GREEN and regression tests**

Run: `node tests/compile-presentation.mjs && node --test tests/plugin-runtime.test.mjs tests/shared-boundary.test.mjs`

Expected: PASS; shared facade still has no default export or plugin registration.

- [x] **Step 5: Commit**

```bash
git add tui/runtime/plugin.ts shared/opencode-tools-shared.ts tests/plugin-runtime.test.mjs tests/compile-presentation.mjs
git commit -m "feat: add standalone TUI activation runtime"
```

### Task 3: Add API-Scoped Service Leases (OpenSpec 1.4)

**Files:**
- Modify: `tui/runtime/plugin.ts`
- Modify: `tests/plugin-runtime.test.mjs`
- Modify: `shared/opencode-tools-shared.ts`

**Interfaces:**
- Produces: `acquireService<T>(api, key, factory): ServiceLease<T>` and `ServiceLease<T> { value; release() }`.
- `TuiFeatureContext.acquireService` automatically adds the lease release to its activation scope.

- [x] **Step 1: Add failing lease cases**

Add tests using two API objects and one symbol key. Assert one factory call for two same-API leases, separate instances for another API, no disposal after the first release, one disposal after final release, idempotent repeated release, failed factories are retried, and reentrant acquisition during disposal creates a new value because the old record was removed first.

```js
const first = acquireService(apiA, key, factory)
const second = acquireService(apiA, key, factory)
const otherApi = acquireService(apiB, key, factory)
assert.equal(first.value, second.value)
assert.notEqual(first.value, otherApi.value)
first.release()
first.release()
assert.equal(disposals, 0)
second.release()
assert.equal(disposals, 1)
```

- [x] **Step 2: Run RED**

Run: `node tests/compile-presentation.mjs && node --test --test-name-pattern="service|lease|factory|reentrant" tests/plugin-runtime.test.mjs`

Expected: FAIL because `acquireService` is not exported.

- [x] **Step 3: Implement the WeakMap registry**

Use `WeakMap<TuiPluginApi, Map<ServiceKey, ServiceRecord<unknown>>>`. Call the factory before inserting a new record. Increment `references` for every lease. Make each lease's `release` closure idempotent; on the final release, delete the record and empty API map before invoking `dispose`. Have `defineTuiPlugin` wrap direct acquisition as:

```ts
acquireService<T>(key: ServiceKey, factory: ServiceFactory<T>): ServiceLease<T> {
  const lease = acquireService(api, key, factory)
  scope.onCleanup(lease.release)
  return lease
}
```

- [x] **Step 4: Run GREEN**

Run: `node tests/compile-presentation.mjs && node --test tests/plugin-runtime.test.mjs`

Expected: PASS for activation and lease cases.

- [x] **Step 5: Commit**

```bash
git add tui/runtime/plugin.ts shared/opencode-tools-shared.ts tests/plugin-runtime.test.mjs
git commit -m "feat: add API-scoped service leases"
```

### Task 4: Build the Reconciled Provider Hub (OpenSpec 1.5)

**Files:**
- Create: `tui/services/quota-provider-hub.ts`
- Create: `tests/provider-hub.test.mjs`
- Modify: `tests/compile-presentation.mjs`
- Modify: `shared/opencode-tools-shared.ts`

**Interfaces:**
- Produces: `QuotaProviderDemand`, `QuotaProviderHub`, `createQuotaProviderHub(api, factories?)`, and `acquireQuotaProviderHub(context, demand)`.
- Hub exposes stable `providers(): readonly QuotaProviderAdapter[]`; demands are removed before the service lease releases.

- [x] **Step 1: Write reconciliation tests with injected factories**

Compile the service to `.tmp-test/provider-hub.mjs`. Factory spies must record `{ kind, options, disposeCount }`. Cover home-first then quota, quota-first then home, identical demand reuse, quota refresh/hideTools changes replacing only Z.AI/OpenAI, OpenCode Go add/remove, quota release while home remains, and final hub disposal.

```js
const home = acquireQuotaProviderHub(homeContext, { consumer: "home" })
const quota = acquireQuotaProviderHub(quotaContext, {
  consumer: "quota",
  refreshIntervalMs: 20_000,
  zai: { hideTools: true },
  openCodeGo: { config, refreshIntervalMs: 20_000 },
})
assert.equal(home.value, quota.value)
assert.deepEqual(home.value.providers().map((provider) => provider.id), ["zai", "openai", "opencode-go"])
quotaContext.dispose()
assert.deepEqual(home.value.providers().map((provider) => provider.id), ["zai", "openai"])
assert.equal(replaced.every((provider) => provider.disposeCount === 1), true)
```

- [x] **Step 2: Run RED**

Run: `node tests/compile-presentation.mjs && node --test tests/provider-hub.test.mjs`

Expected: FAIL because the provider-hub module does not exist.

- [x] **Step 3: Implement demand reconciliation**

Represent each consumer with a unique demand token. Home requires default Z.AI and OpenAI. While any quota demand exists, its normalized refresh interval, Z.AI `hideTools`, and optional OpenCode Go config win; otherwise use home defaults. Keep each adapter when its construction key is unchanged, dispose and replace only changed adapters, publish providers in Z.AI/OpenAI/OpenCode Go order, and dispose every remaining adapter once on hub shutdown. `acquireQuotaProviderHub` must acquire service key `quota-provider-hub`, add the demand, register demand removal after service acquisition so LIFO removes demand first, and return the shared lease value.

- [x] **Step 4: Run GREEN and provider regressions**

Run: `node tests/compile-presentation.mjs && node --test tests/provider-hub.test.mjs tests/provider-zai.test.mjs tests/provider-openai.test.mjs tests/provider-opencode-go.test.mjs`

Expected: PASS; provider internals retain their current lifecycle behavior.

- [x] **Step 5: Commit**

```bash
git add tui/services/quota-provider-hub.ts shared/opencode-tools-shared.ts tests/provider-hub.test.mjs tests/compile-presentation.mjs
git commit -m "feat: share quota provider demand through a hub"
```

### Task 5: Lock Current Feature Parity (OpenSpec 2.1)

**Files:**
- Create: `tests/plugin-adapters.test.mjs`
- Modify: `tests/compile-presentation.mjs`

**Interfaces:**
- Tests current adapter surfaces before moving logic: quota registers only `sidebar_content`, home only `home_bottom`, token-report only two keymap layers.

- [x] **Step 1: Add adapter activation parity tests**

Compile `tui/quota.tsx`, `tui/home.tsx`, and `tui/token-report.tsx` as separate fixture outputs. Use a complete fake API with lifecycle, slots, keymap, provider/session state, event, KV, route, UI, and client. Assert each module registers only its own surface and disposal removes provider/event resources. Retain the existing detailed assertions in `tests/quota-composition.test.mjs`, `tests/home-quota.test.mjs`, and `tests/token-tui.test.mjs`.

- [x] **Step 2: Run RED**

Run: `node tests/compile-presentation.mjs && node --test tests/plugin-adapters.test.mjs`

Expected: FAIL until fixture outputs and expected isolated activation are wired; quota's direct ID expectation also exposes the old `aamkye/opencode-tools` identity.

- [x] **Step 3: Complete only the parity harness**

Do not migrate feature code in this task. Make the harness observe present registrations and record the intentional old quota ID as a baseline assertion that Task 8 will replace. Ensure fake network calls are injected or disabled and every lifecycle is disposed in `finally`.

- [x] **Step 4: Run GREEN**

Run: `node tests/compile-presentation.mjs && node --test tests/plugin-adapters.test.mjs tests/quota-composition.test.mjs tests/home-quota.test.mjs tests/token-tui.test.mjs`

Expected: PASS with pre-migration behavior captured.

- [x] **Step 5: Commit**

```bash
git add tests/plugin-adapters.test.mjs tests/compile-presentation.mjs
git commit -m "test: lock current TUI feature parity"
```

### Task 6: Move Quota Decisions Behind Shared Exports (OpenSpec 2.2)

**Files:**
- Create: `tui/features/quota.ts`
- Modify: `tui/quota.tsx`
- Modify: `shared/opencode-tools-shared.ts`
- Modify: `tests/compile-presentation.mjs`
- Modify: `tests/quota-composition.test.mjs`
- Modify: `tests/shared-boundary.test.mjs`

**Interfaces:**
- Produces existing `normalizeQuotaOptions`, `composeQuotaPanel`, `selectedQuotaProviderID`, `selectedSessionQuotaProviderID`, and `createQuotaSelection` signatures plus `quotaProviderDemand(options)`.
- Adapter retains slot registration, session prop binding, provider `setSessionID`, JSX, and theme mapping.

- [x] **Step 1: Point tests at the future shared feature module**

Compile `tui/features/quota.ts` as `.tmp-test/quota-composition.mjs`, and update boundary assertions so `tui/quota.tsx` may import only `../shared/opencode-tools-shared.js` plus presentation JSX modules. Add an assertion that option normalization and composition names are absent from the adapter source.

- [x] **Step 2: Run RED**

Run: `node tests/compile-presentation.mjs && node --test tests/quota-composition.test.mjs tests/shared-boundary.test.mjs`

Expected: FAIL because `tui/features/quota.ts` is missing and decisions still live in the adapter.

- [x] **Step 3: Move code without semantic edits**

Move quota option/type definitions, thresholds, ordering, provider composition, selection resolution, and Solid selection controller to `tui/features/quota.ts`. Add `quotaProviderDemand` that derives only adapter-construction inputs from `NormalizedQuotaOptions`. Re-export all consumed values/types from `shared/opencode-tools-shared.ts`. Keep `SIDEBAR_ORDER` out of feature code; the manifest owns it.

- [x] **Step 4: Run GREEN**

Run: `node tests/compile-presentation.mjs && node --test tests/quota-composition.test.mjs tests/plugin-adapters.test.mjs tests/shared-boundary.test.mjs`

Expected: PASS with unchanged quota models and adapter output.

- [x] **Step 5: Commit**

```bash
git add tui/features/quota.ts tui/quota.tsx shared/opencode-tools-shared.ts tests/compile-presentation.mjs tests/quota-composition.test.mjs tests/shared-boundary.test.mjs
git commit -m "refactor: move quota decisions into shared feature logic"
```

### Task 7: Move Home and Token Decisions Behind Shared Exports (OpenSpec 2.3)

**Files:**
- Create: `tui/features/home.ts`
- Create: `tui/features/token-report.ts`
- Modify: `tui/home.tsx`
- Modify: `tui/token-report.tsx`
- Modify: `shared/opencode-tools-shared.ts`
- Modify: `tests/compile-presentation.mjs`
- Modify: `tests/home-quota.test.mjs`
- Modify: `tests/token-tui.test.mjs`
- Modify: `tests/shared-boundary.test.mjs`

**Interfaces:**
- Produces: `formatHomeQuotaLine`, `homeQuotaPercentParts`, `homeQuotaStatusRole`, `activeSessionID`, and `persistTokenReport`.
- TUI adapters retain `HomeQuotaLine` JSX and token keymap/range-dialog ownership.

- [x] **Step 1: Redirect pure tests and strengthen boundaries**

Compile each future feature module. Extend home tests with exact role thresholds: `9.6 -> error`, `30 -> warning`, `30.1 -> success`. Extend token tests to call the adapter while persistence remains observable through `api.client.session.prompt`. Require that adapter source no longer calls `computeTokenReport` or `renderTokenReport` directly.

- [x] **Step 2: Run RED**

Run: `node tests/compile-presentation.mjs && node --test tests/home-quota.test.mjs tests/token-tui.test.mjs tests/shared-boundary.test.mjs`

Expected: FAIL because the new feature modules and role helper do not exist.

- [x] **Step 3: Extract decisions and persistence**

Move home formatting/percentage/role logic into `tui/features/home.ts`. Move route-to-session resolution and the current compute/render/no-reply/toast behavior into `tui/features/token-report.ts`; preserve the exact user-facing strings. Leave range mode push/pop, `DialogPrompt`, Enter confirmation, Escape binding, and keymap registration in `tui/token-report.tsx`. Export the new functions through the shared facade.

- [x] **Step 4: Run GREEN**

Run: `node tests/compile-presentation.mjs && node --test tests/home-quota.test.mjs tests/token-tui.test.mjs tests/plugin-adapters.test.mjs tests/shared-boundary.test.mjs`

Expected: PASS; command names, dialog close behavior, report persistence, and home text/colors remain unchanged.

- [x] **Step 5: Commit**

```bash
git add tui/features/home.ts tui/features/token-report.ts tui/home.tsx tui/token-report.tsx shared/opencode-tools-shared.ts tests/compile-presentation.mjs tests/home-quota.test.mjs tests/token-tui.test.mjs tests/shared-boundary.test.mjs
git commit -m "refactor: share home and token report decisions"
```

### Task 8: Convert Current Features to the Shared Standalone Contract (OpenSpec 2.4)

**Files:**
- Modify: `tui/quota.tsx`
- Modify: `tui/home.tsx`
- Modify: `tui/token-report.tsx`
- Modify: `tests/plugin-adapters.test.mjs`

**Interfaces:**
- Each default export is `defineTuiPlugin(pluginDescriptor(key), activate)` and activates one feature only.

- [ ] **Step 1: Change parity expectations to normalized standalone modules**

Assert exact IDs and one activation surface per module:

```js
assert.deepEqual(
  [quota.id, home.id, tokenReport.id],
  [
    "aamkye/opencode-tools-quota",
    "aamkye/opencode-tools-home",
    "aamkye/opencode-tools-token-report",
  ],
)
assert.deepEqual(quotaApi.slotNames, ["sidebar_content"])
assert.deepEqual(homeApi.slotNames, ["home_bottom"])
assert.equal(tokenApi.slotNames.length, 0)
assert.equal(tokenApi.keymapLayers.length, 2)
```

- [ ] **Step 2: Run RED**

Run: `node tests/compile-presentation.mjs && node --test tests/plugin-adapters.test.mjs`

Expected: FAIL on quota's old runtime ID and direct lifecycle ownership.

- [ ] **Step 3: Adopt descriptors and activation contexts**

Replace hand-built module objects with `defineTuiPlugin`. Use `context.api` for host calls and `context.onCleanup` for adapter-owned Solid roots or dialogs. Remove direct `api.lifecycle.onDispose` calls for resources owned by the activation scope. Do not call another feature's adapter.

- [ ] **Step 4: Run GREEN**

Run: `node tests/compile-presentation.mjs && node --test tests/plugin-adapters.test.mjs tests/token-tui.test.mjs tests/home-quota.test.mjs`

Expected: PASS with normalized IDs and isolated activation.

- [ ] **Step 5: Commit**

```bash
git add tui/quota.tsx tui/home.tsx tui/token-report.tsx tests/plugin-adapters.test.mjs
git commit -m "refactor: register current features as standalone plugins"
```

### Task 9: Integrate Quota and Home with One Hub (OpenSpec 2.5)

**Files:**
- Modify: `tui/quota.tsx`
- Modify: `tui/home.tsx`
- Modify: `tests/provider-hub.test.mjs`
- Modify: `tests/plugin-adapters.test.mjs`

**Interfaces:**
- Quota acquires `quotaProviderDemand(normalizeQuotaOptions(rawOptions))`; home acquires `{ consumer: "home" }`.
- Both read `hub.providers()` reactively and remain independently installable.

- [ ] **Step 1: Add adapter-level activation-order tests**

Activate home then quota against one API, and quota then home against a fresh API. Count provider factory/network/timer ownership through injected hub factories or controlled provider constructors. Assert one hub, quota sees optional OpenCode Go, home continues after quota disposal, quota-alone/home-alone work, and final lifecycle disposal releases all adapters once.

- [ ] **Step 2: Run RED**

Run: `node tests/compile-presentation.mjs && node --test --test-name-pattern="hub|activation order|installed alone" tests/provider-hub.test.mjs tests/plugin-adapters.test.mjs`

Expected: FAIL because adapters still construct private provider arrays.

- [ ] **Step 3: Replace private provider ownership**

Acquire the hub through `TuiFeatureContext`, derive current provider arrays through the stable accessor, and update quota selection/composition and home `<For>` to consume that accessor. When quota's sidebar receives a session ID, call `setSessionID` on the current hub adapters. Remove adapter-level provider disposal; lease cleanup owns it.

- [ ] **Step 4: Run GREEN and all provider tests**

Run: `node tests/compile-presentation.mjs && node --test tests/provider-hub.test.mjs tests/plugin-adapters.test.mjs tests/provider-zai.test.mjs tests/provider-openai.test.mjs tests/provider-opencode-go.test.mjs`

Expected: PASS for both activation orders, standalone installs, demand replacement, and provider regressions.

- [ ] **Step 5: Commit**

```bash
git add tui/quota.tsx tui/home.tsx tests/provider-hub.test.mjs tests/plugin-adapters.test.mjs
git commit -m "refactor: share provider hub across quota and home"
```

### Task 10: Extract the Controlled Compact Panel and Preserve Quota (OpenSpec 3.1, 3.2)

**Files:**
- Create: `tui/presentation/compact-panel.tsx`
- Create: `tests/compact-panel-mounted.fixture.ts`
- Create: `tests/compact-panel-mounted.test.mjs`
- Modify: `tui/presentation/renderer.tsx`
- Modify: `tests/presentation-mounted.fixture.ts`
- Modify: `tests/presentation-mounted.test.mjs`
- Modify: `tests/compile-presentation.mjs`
- Modify: `shared/opencode-tools-shared.ts`

**Interfaces:**
- Produces controlled `CompactPanel` with design fields `title`, `collapsed`, `summary`, `onToggle`, `children`, and `footerDivider`, plus an `Accessor<PanelTheme>` used only to resolve semantic roles.
- `PanelRenderer` continues to own quota panel/group signals and its one-second timer.

- [ ] **Step 1: Add mounted shell tests before extraction**

Mount a controlled shell and assert: two-cell marker; flexible title; collapsed-only segmented summary with independent colors; header click calls `onToggle` without internal state; header divider always renders; children are omitted when collapsed and clipped to parent width when expanded; footer divider obeys `footerDivider`. Add textual snapshots for quota extended, semi-collapsed, and collapsed 37-cell layouts before changing renderer code.

- [ ] **Step 2: Run RED**

Run: `node tests/compile-presentation.mjs && node --test tests/compact-panel-mounted.test.mjs tests/presentation-mounted.test.mjs`

Expected: FAIL because `CompactPanel` does not exist; existing quota tests remain the parity baseline.

- [ ] **Step 3: Extract the shell and migrate quota rendering**

Move only outer header/summary/header-divider/expanded-region/footer-divider JSX into `compact-panel.tsx`. Keep normalized quota items, group collapse, middle dividers, timers, tables, and semantic formatting in `renderer.tsx`. Render quota with `footerDivider={normalized().groups.length > 0}` so existing expanded/collapsed separator counts stay exact. Preserve the current ephemeral `createSignal(Set)` in `PanelRenderer`; do not read or write KV.

- [ ] **Step 4: Run GREEN and all presentation tests**

Run: `node tests/compile-presentation.mjs && node --test tests/compact-panel-mounted.test.mjs tests/presentation-mounted.test.mjs tests/presentation-render-model.test.mjs tests/presentation-layout.test.mjs tests/quota-composition.test.mjs`

Expected: PASS; the three quota snapshots and mounted allocations are unchanged.

- [ ] **Step 5: Commit**

```bash
git add tui/presentation/compact-panel.tsx tui/presentation/renderer.tsx shared/opencode-tools-shared.ts tests/compact-panel-mounted.fixture.ts tests/compact-panel-mounted.test.mjs tests/presentation-mounted.fixture.ts tests/presentation-mounted.test.mjs tests/compile-presentation.mjs
git commit -m "refactor: extract controlled compact panel shell"
```

### Task 11: Add a Bounded Compact Status Row (OpenSpec 3.3)

**Files:**
- Modify: `tui/presentation/compact-panel.tsx`
- Modify: `tui/presentation/layout.ts`
- Modify: `tests/compact-panel-mounted.test.mjs`
- Modify: `tests/presentation-layout.test.mjs`
- Modify: `shared/opencode-tools-shared.ts`

**Interfaces:**
- Produces: `CompactStatusRow({ name, label, status, theme })` and pure `allocateStatusRow(availableCells, labelLength)`.
- Allocation reserves bullet width `2`, one gap before the label, full label width, and gives all remaining cells to a truncating name.

- [ ] **Step 1: Add long-name and exact-width failures**

Test labels `Connected`, `Disabled`, `Failed`, `Needs auth`, `Needs client ID`, and `Unknown` at 37 cells. Assert every allocation sums to 37, label width equals its full text length, mounted label is right-aligned/muted, bullet uses the supplied semantic role, and name has `minWidth={0}`, `overflow="hidden"`, `wrapMode="none"`, and truncation.

- [ ] **Step 2: Run RED**

Run: `node tests/compile-presentation.mjs && node --test --test-name-pattern="status row|status allocation|long name" tests/compact-panel-mounted.test.mjs tests/presentation-layout.test.mjs`

Expected: FAIL because the row and allocator are missing.

- [ ] **Step 3: Implement fixed-edge allocation and JSX**

Clamp available cells to a non-negative integer. Reserve from the right in this order: full label, one gap if possible, two-cell bullet; name receives the remainder. Mount a full-width clipped flex row with a colored `• ` bullet, a shrinking/truncating name box, one spacer cell, and muted fixed-width label. Export both contracts through the shared facade.

- [ ] **Step 4: Run GREEN**

Run: `node tests/compile-presentation.mjs && node --test tests/compact-panel-mounted.test.mjs tests/presentation-layout.test.mjs`

Expected: PASS; no allocation exceeds 37 and labels remain intact.

- [ ] **Step 5: Commit**

```bash
git add tui/presentation/compact-panel.tsx tui/presentation/layout.ts shared/opencode-tools-shared.ts tests/compact-panel-mounted.test.mjs tests/presentation-layout.test.mjs
git commit -m "feat: add compact sidebar status rows"
```

### Task 12: Declare the OpenCode MCP State Boundary (OpenSpec 4.1)

**Files:**
- Create: `tests/mcp-state-types.fixture.ts`
- Modify: `opencode-plugin-tui.d.ts`

**Interfaces:**
- Produces: `TuiMcpKnownStatus`, `TuiMcpStatus`, `TuiMcpEntry`, and `TuiPluginApi.state.mcp()`.
- Runtime mapper still accepts arbitrary status strings; declaration does not make unknown runtime values impossible.

- [ ] **Step 1: Add the compile fixture**

```ts
import type { TuiMcpEntry, TuiMcpKnownStatus, TuiPluginApi } from "@opencode-ai/plugin/tui"

const known: TuiMcpKnownStatus[] = ["connected", "disabled", "failed", "needs_auth", "needs_client_registration"]
export const readMcp = (api: TuiPluginApi): readonly TuiMcpEntry[] => api.state.mcp()
export const statuses: readonly string[] = known
```

- [ ] **Step 2: Run RED**

Run: `npx tsc --noEmit --strict --skipLibCheck --module ESNext --moduleResolution bundler --target ES2022 --types node opencode-plugin-tui.d.ts tests/mcp-state-types.fixture.ts`

Expected: FAIL because `TuiMcpEntry`, `TuiMcpKnownStatus`, and `state.mcp` are missing.

- [ ] **Step 3: Extend the local declaration**

Declare the five known string literals and an open string boundary using `type TuiMcpStatus = TuiMcpKnownStatus | (string & {})`. Define entries with `name`, `status`, and optional `error?: string`; add `mcp(): readonly TuiMcpEntry[]` under `state`.

- [ ] **Step 4: Run GREEN**

Run: `npx tsc --noEmit --strict --skipLibCheck --module ESNext --moduleResolution bundler --target ES2022 --types node opencode-plugin-tui.d.ts tests/mcp-state-types.fixture.ts`

Expected: PASS with no diagnostics.

- [ ] **Step 5: Commit**

```bash
git add opencode-plugin-tui.d.ts tests/mcp-state-types.fixture.ts
git commit -m "feat: declare synchronized MCP TUI state"
```

### Task 13: Implement the Pure MCP Panel Model (OpenSpec 4.2, 4.3)

**Files:**
- Create: `tui/features/mcp.ts`
- Create: `tests/mcp-model.test.mjs`
- Modify: `tests/compile-presentation.mjs`
- Modify: `shared/opencode-tools-shared.ts`

**Interfaces:**
- Produces: `McpPanelModel`, `McpStatusRow`, and `createMcpPanelModel(entries)`.
- Input type is `readonly { name: string; status: string; error?: unknown }[]`.

- [ ] **Step 1: Write the complete status table tests**

Use one ordered input containing all known statuses plus `future_status` and error strings. Assert exact labels/roles and unchanged name order:

```js
assert.deepEqual(model.rows, [
  { name: "connected", label: "Connected", status: "success" },
  { name: "disabled", label: "Disabled", status: "textMuted" },
  { name: "failed", label: "Failed", status: "error" },
  { name: "auth", label: "Needs auth", status: "warning" },
  { name: "client", label: "Needs client ID", status: "error" },
  { name: "future", label: "Unknown", status: "textMuted" },
])
```

Also assert summaries exactly: fully connected `2/2` has success, muted, success segments; partial `2/3` has success, muted, error; empty `0/0` is three muted segments. Verify `connected`, `total`, and absence of every input error string in serialized output.

- [ ] **Step 2: Run RED**

Run: `node tests/compile-presentation.mjs && node --test tests/mcp-model.test.mjs`

Expected: FAIL because the MCP model module is missing.

- [ ] **Step 3: Implement table-driven mapping**

Use a frozen status record for the five known values and one unknown fallback. Count only exact `connected`. Build `summary` as three `PanelTextSegment` values, with all-muted `0/0`, healthy success denominator, and unhealthy error denominator. Map in one pass without sorting and never copy `error` into output.

- [ ] **Step 4: Run GREEN**

Run: `node tests/compile-presentation.mjs && node --test tests/mcp-model.test.mjs`

Expected: PASS for known, unknown, ordered, healthy, unhealthy, and empty cases.

- [ ] **Step 5: Commit**

```bash
git add tui/features/mcp.ts shared/opencode-tools-shared.ts tests/mcp-model.test.mjs tests/compile-presentation.mjs
git commit -m "feat: model MCP sidebar status"
```

### Task 14: Implement the Reactive Persisted MCP Adapter (OpenSpec 4.4, 4.5)

**Files:**
- Create: `tui/mcp.tsx`
- Create: `tests/mcp-mounted.fixture.ts`
- Create: `tests/mcp-mounted.test.mjs`
- Modify: `tests/compile-presentation.mjs`
- Modify: `tests/plugin-adapters.test.mjs`
- Modify: `tests/shared-boundary.test.mjs`

**Interfaces:**
- Default module ID comes from manifest key `mcp`; registers only `sidebar_content` at order `111`.
- Reads `api.state.mcp()` inside a Solid memo and persists only non-empty user toggles.

- [ ] **Step 1: Add mounted adapter scenarios**

Build a harness with a reactive MCP accessor, KV map/write log, captured slot registration, fake theme, and lifecycle. Assert expanded rows/order/colors/separators; collapsed summary and no rows/footer; saved collapsed restore; click writes opposite preference; empty forces `▶ MCP 0/0`, has only header divider, click does not write; servers appearing restore saved signal; additions/removals/reorder/status changes update without reactivation; long names preserve labels and 37-cell text has no trailing whitespace.

The empty-preference assertion must be exact:

```js
assert.equal(view.marker(), "▶ ")
assert.equal(view.summaryText(), "0/0")
view.clickHeader()
assert.deepEqual(api.kvWrites, [])
setMcp([{ name: "docs", status: "connected" }])
assert.equal(view.marker(), savedCollapsed ? "▶ " : "▼ ")
```

- [ ] **Step 2: Run RED**

Run: `node tests/compile-presentation.mjs && node --test tests/mcp-mounted.test.mjs`

Expected: FAIL because `tui/mcp.tsx` and its fixture do not exist.

- [ ] **Step 3: Implement the adapter**

Create one activation-scoped signal initialized with `api.kv.get("aamkye.opencode-tools-mcp.collapsed", false)`. Create a memo from `createMcpPanelModel(api.state.mcp())`; derive `effectiveCollapsed = model().total === 0 || collapsed()`. Ignore header toggles when total is zero. Otherwise flip the signal and write the new boolean. Render `CompactPanel` with summary only when effectively collapsed and `footerDivider` only for expanded non-empty content; render each ordered row with `CompactStatusRow`. Use `defineTuiPlugin(pluginDescriptor("mcp"), activate)`.

- [ ] **Step 4: Run GREEN and adapter regressions**

Run: `node tests/compile-presentation.mjs && node --test tests/mcp-mounted.test.mjs tests/mcp-model.test.mjs tests/plugin-adapters.test.mjs tests/compact-panel-mounted.test.mjs tests/shared-boundary.test.mjs`

Expected: PASS; MCP is reactive, persisted, isolated, bounded, and empty-safe.

- [ ] **Step 5: Commit**

```bash
git add tui/mcp.tsx tests/mcp-mounted.fixture.ts tests/mcp-mounted.test.mjs tests/compile-presentation.mjs tests/plugin-adapters.test.mjs tests/shared-boundary.test.mjs
git commit -m "feat: add standalone MCP sidebar plugin"
```

### Task 15: Build Four Manifest-Driven Artifacts (OpenSpec 5.1)

**Files:**
- Modify: `build-plugins.mjs`
- Modify: `tests/plugin-build.test.mjs`

**Interfaces:**
- `buildPlugins({ logLevel, manifest = pluginManifest })` returns `{ shared, features }`, where `features[key]` is its esbuild result.
- Validation happens before creating feature output; every feature externalizes `./opencode-tools-shared.js` and host runtime packages.

- [ ] **Step 1: Replace composed-build expectations**

Derive expected artifact paths from `pluginManifest`, then assert five non-empty minified ESM files; feature result keys equal manifest keys; every feature imports shared; feature metafiles contain their own source and no sibling source; shared has no default; every feature default has its manifest ID and one `tui`; loading one artifact registers only that feature. Add duplicate-ID/path build rejection and assert the synthetic source name `opencode-tools-quota-entry.js` is absent.

- [ ] **Step 2: Run RED**

Run: `node --test tests/plugin-build.test.mjs`

Expected: FAIL because only shared and composed quota artifacts are emitted.

- [ ] **Step 3: Iterate the validated manifest**

Call `validatePluginManifest(manifest)` before `mkdir` or esbuild. Build shared first. Loop records and call esbuild with `entryPoints: [entry.source]`, `outfile: resolve(distRoot, entry.outfile)`, host-runtime transforms, and shared externalization. Remove the synthetic `stdin` entry. Return feature results keyed by manifest key. Keep stale token artifact cleanup and ensure old composed output is overwritten by standalone quota.

- [ ] **Step 4: Run GREEN**

Run: `node --test tests/plugin-build.test.mjs`

Expected: PASS for manifest validation, all artifacts, external imports, isolation, hermetic loading, and lifecycle cleanup.

- [ ] **Step 5: Commit**

```bash
git add build-plugins.mjs tests/plugin-build.test.mjs
git commit -m "build: emit manifest-driven standalone plugins"
```

### Task 16: Publish Standalone Metadata and Raise the Engine Floor (OpenSpec 5.2)

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `tsconfig.json`
- Modify: `tests/plugin-wiring.test.mjs`

**Interfaces:**
- Package exports expose `./quota`, `./home`, `./token-report`, and `./mcp`; included files cover manifest, TUI, shared source, dist, and README.
- `engines.opencode` is exactly `>=1.18.1`.

- [ ] **Step 1: Add metadata assertions**

Assert each export points at its standalone source, all four source files and shared/runtime files are typechecked through `tui/**/*.ts`, `tui/**/*.tsx`, and `shared/**/*.ts`, `plugin-manifest.json` is packaged, and both package manifests report `>=1.18.1`.

- [ ] **Step 2: Run RED**

Run: `node --test tests/plugin-wiring.test.mjs`

Expected: FAIL on missing exports/manifest inclusion and the current `>=1.4.3` engine.

- [ ] **Step 3: Update metadata deterministically**

Replace the old `./tui` export with four explicit feature exports. Add `plugin-manifest.json` and `shared` to `files`. Replace the narrow TUI include list with the globs above while retaining session-title and declaration inputs. Run `npm install --package-lock-only` to synchronize lock metadata without changing dependency versions.

- [ ] **Step 4: Run GREEN and strict typecheck**

Run: `node --test tests/plugin-wiring.test.mjs && npm run typecheck`

Expected: PASS and `tsc --noEmit` exits 0.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json tsconfig.json tests/plugin-wiring.test.mjs
git commit -m "chore: publish standalone plugin metadata"
```

### Task 17: Migrate Local and Global Deployments (OpenSpec 5.3, 5.4)

**Files:**
- Modify: `deploy-plugins.mjs`
- Modify: `tests/plugin-deploy.test.mjs`

**Interfaces:**
- Copies shared plus every manifest `outfile`.
- Classifies current manifest outputs and historical composed/source/token paths as managed; preserves quota options by existing priority rules.

- [ ] **Step 1: Expand migration fixtures and expected snapshots**

Seed local, project-fallback, and global fixtures with duplicate current standalone entries, old composed entries, old source entries, stale token artifacts/commands, unrelated relative/file/npm entries, and quota options at competing priorities. Expect unrelated entries unchanged in relative order followed by:

```js
[
  ["./opencode-tools-quota.js", selectedQuotaOptions],
  "./opencode-tools-home.js",
  "./opencode-tools-token-report.js",
  "./opencode-tools-mcp.js",
]
```

When no managed options exist, quota must also use string form. Snapshot all five managed files and JSON bytes before and after a second deploy. Assert obsolete token/composed files are absent and JSON ends with one newline.

- [ ] **Step 2: Run RED**

Run: `node --test tests/plugin-deploy.test.mjs`

Expected: FAIL because deployment currently copies/configures only shared plus quota.

- [ ] **Step 3: Drive deployment from the manifest**

Validate the manifest, copy shared and every `outfile`, generate current managed paths from manifest outputs/sources, and retain explicit historical paths. Keep current option priority selection and project-to-global fallback. Remove every managed entry, append entries in manifest order, use tuple form only for quota when options were found, remove stale files and managed token commands, and write `JSON.stringify(config, null, 2) + "\n"` only after deterministic transformation.

- [ ] **Step 4: Run GREEN**

Run: `node --test tests/plugin-deploy.test.mjs tests/plugin-build.test.mjs`

Expected: PASS for local/global/fallback migrations, options, unrelated order, stale cleanup, and byte-identical second deployment.

- [ ] **Step 5: Commit**

```bash
git add deploy-plugins.mjs tests/plugin-deploy.test.mjs
git commit -m "feat: migrate deployments to standalone plugins"
```

### Task 18: Document Installation, Migration, MCP Layouts, and Rollback (OpenSpec 5.5)

**Files:**
- Modify: `README.md`
- Modify: `tests/plugin-wiring.test.mjs`

**Interfaces:**
- Documentation identifies four standalone entries, OpenCode 1.18.1 floor, normalized IDs, automatic migration, built-in MCP replacement, and rollback without claiming automatic built-in deactivation.

- [ ] **Step 1: Add documentation contract assertions**

Require README text for all four filenames and runtime IDs, `OpenCode 1.18.1`, `internal:sidebar-mcp`, explicit user disablement, automatic managed-config migration, quota option preservation, normalized quota ID state warning, and rollback. Require fenced layouts containing extended rows, collapsed healthy/unhealthy summaries, and empty muted `0/0`. Reject wording matching `automatically disables internal:sidebar-mcp`.

- [ ] **Step 2: Run RED**

Run: `node --test --test-name-pattern="documents|documentation" tests/plugin-wiring.test.mjs`

Expected: FAIL because README describes one composed quota artifact and has no MCP replacement guidance.

- [ ] **Step 3: Rewrite affected README sections**

Update overview/features, local configuration, build/deploy artifact count, artifact table, source table, and edit workflow. Show the four manifest-ordered `tui.json` entries with options only on quota. State that deployment migrates managed entries automatically and preserves unrelated entries/options. State users must disable `internal:sidebar-mcp` themselves to avoid duplicate panels. Explain rollback: remove `opencode-tools-mcp.js` from `tui.json`, restore/re-enable `internal:sidebar-mcp`, optionally restore the prior composed release/config, then restart OpenCode. Preserve all existing OpenCode Go secret-safety and provider semantics text required by current tests.

- [ ] **Step 4: Run GREEN**

Run: `node --test tests/plugin-wiring.test.mjs`

Expected: PASS for new documentation contracts and existing secret-safe guidance.

- [ ] **Step 5: Commit**

```bash
git add README.md tests/plugin-wiring.test.mjs
git commit -m "docs: describe standalone MCP plugin migration"
```

## Final Verification (OpenSpec 6.1)

- [ ] **Step 1: Confirm canonical task coverage**

Run: `node -e 'const fs=require("node:fs");const s=fs.readFileSync("docs/superpowers/plans/2026-07-16-opencode-tools-mcp.md","utf8");for(const id of ["1.1","1.2","1.3","1.4","1.5","2.1","2.2","2.3","2.4","2.5","3.1","3.2","3.3","4.1","4.2","4.3","4.4","4.5","5.1","5.2","5.3","5.4","5.5","6.1"])if(!new RegExp(`(?:OpenSpec [^\\n]*\\b${id.replace(".", "\\.")}\\b|\\|[^\\n]*\\b${id.replace(".", "\\.")}\\b[^\\n]*\\|)`).test(s))throw new Error(`missing ${id}`)'`

Expected: exits 0; all 24 canonical task IDs are represented by the coverage table or task heading.

- [ ] **Step 2: Run the complete test suite**

Run: `npm test`

Expected: PASS; `node tests/compile-session-title.mjs`, `node tests/compile-presentation.mjs`, and every `tests/*.test.mjs` complete with zero failures.

- [ ] **Step 3: Run strict TypeScript**

Run: `npm run typecheck`

Expected: PASS; `tsc --noEmit` exits 0 with no diagnostics.

- [ ] **Step 4: Run the production plugin build**

Run: `npm run build:plugins`

Expected: PASS and `dist/` contains non-empty `opencode-tools-shared.js`, `opencode-tools-quota.js`, `opencode-tools-home.js`, `opencode-tools-token-report.js`, and `opencode-tools-mcp.js`.

- [ ] **Step 5: Inspect scope and commit health**

Run: `git status --short && git diff --check && git log --oneline ce0960229bdf299dd3ef678f3dbee9d538cbda50..HEAD`

Expected: `git diff --check` exits 0; no OpenSpec artifact, Comet state, or unrelated file is modified; history contains the 18 focused commits above. If verification exposes a regression, fix only that regression, rerun Steps 2-4, and create one focused `fix:` commit naming the affected subsystem.
