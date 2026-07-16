---
change: fix-quota-panel-rendering
design-doc: docs/superpowers/specs/2026-07-14-quota-panel-rendering-design.md
base-ref: 67c36679448d9b45890006ae2bf728241756c09b
---

# Quota Panel Rendering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the aggregate quota panel responsive, correctly grouped and labeled, color-configurable, polled every 10 seconds by default, driven by the active session model's provider, and safe across credential replacement and disposal.

**Architecture:** Keep provider adapters responsible for semantic quota models and request lifecycle, keep `tui/quota.tsx` responsible for native option normalization, provider selection, and group-local aggregate composition, and keep `tui/presentation/renderer.tsx` responsible for pure deterministic rendering plus parent-responsive mounted JSX. Preserve explicit cell allocation for pure tests, but make mounted headers, progress bars, and compact tables use OpenTUI flex sizing rather than a guessed 80-cell width.

**Tech Stack:** TypeScript 6, SolidJS 1.9, OpenTUI Solid 0.4, Node.js test runner, esbuild, npm scripts.

## Global Constraints

- Use strict TDD for Tasks 1-6: add the focused test first, run it and capture the stated RED failure, then edit production code.
- `refreshIntervalSeconds` accepts positive finite numbers and defaults to `10`; invalid values fall back to `10`.
- `progressColors.enabled` defaults to `true`; thresholds normalize to `0-100`, enforce `errorBelow <= warningBelow`, and default to `10` and `30` when invalid.
- Progress status always evaluates remaining quota, even when `otherProviders.percentageMode` displays used quota.
- Only the filled bar and percentage use semantic progress status; labels remain normal text and empty bars use `textMuted`.
- Preserve immediate adapter fetch, exhausted-window backoff, fetch timeout, stale expiry, one-second countdown clock, reset-boundary refresh, and lifecycle cleanup.
- Do not change provider endpoints, authentication formats, quota arithmetic, the 20-second timeout duration, reset-boundary behavior, home summaries, or token reports.
- Do not display the selected model name, add providers, add keyboard collapse controls, or perform unrelated refactors.
- Run each focused command from `/Users/aam/Projects/priv/opencode-quota`.
- Use strict RED-GREEN TDD for Tasks 10-15: add the focused test first, run the stated command and observe the stated failure, then make the minimum production edit and rerun the focused command before committing.
- Mounted compact tables must use parent-width flex layout; keep `CompactTableAllocation` only in pure normalization and `renderPanelLayout()`.
- Sort each provider panel group by semantic `order`, partition and order each group independently, and only then concatenate a provider's aggregate range.
- Preserve `detail?: string` on semantic header items and add only `detailSegments?: readonly PanelTextSegment[]` for ordered independently colored header detail text.
- OpenAI and Z.AI adapters own separate active request controllers and credential generations; do not introduce a shared refresh coordinator.
- Credential replacement retains prior quota as stale, credential removal clears it, and disposal aborts the active request and clears its request timeout immediately.
- Expected request aborts return `null` without diagnostics; non-abort transport and parsing failures retain their existing `console.error` diagnostics.
- Published quota, pending reset boundaries, and refreshed-boundary markers are credential-generation owned; credential transition synchronously cancels the old boundary before starting its one replacement request.
- Keep reactive credential test ownership in a browser-conditioned TypeScript fixture that imports the public provider constructors; do not add production test injection hooks.

## File Map

- `tui/presentation/layout.ts`: deterministic header/progress cell allocation used by pure tests.
- `tui/presentation/renderer.tsx`: normalization, deterministic render model, and mounted OpenTUI JSX.
- `tests/presentation-mounted.fixture.ts`: expands mounted JSX into inspectable elements.
- `tests/presentation-layout.test.mjs`, `tests/presentation-render-model.test.mjs`, `tests/presentation-mounted.test.mjs`: responsive rendering and framing coverage.
- `tui/presentation/types.ts`, `tests/presentation-types.fixture.ts`, `tests/presentation-types.test.mjs`: compatible semantic `PanelTextSegment` and optional header `detailSegments` contract.
- `tui/quota.tsx`: option normalization, progress semantics, grouping, active-session selection, aggregate composition, and sidebar registration.
- `tests/quota-composition.test.mjs`: option, color, grouping, selection, refresh, and aggregate-order coverage.
- `tui/providers/openai.ts`, `tests/provider-openai.test.mjs`: duration-derived OpenAI labels/IDs, segmented stale header, polling, credential generations, and request cancellation.
- `tui/providers/zai.ts`, `tests/provider-zai.test.mjs`: Z.AI Peak/Off-Peak/stale segments, polling, credential generations, and request cancellation.
- `tests/provider-lifecycle.fixture.ts`, `tests/compile-presentation.mjs`: same-bundle browser-conditioned Solid signals and provider constructors used only by credential lifecycle tests.
- `tui/providers/types.ts`: shared provider-constructor polling option.
- `README.md`: native option/polling documentation and OpenAI window descriptions derived from API-reported durations rather than fixed primary/secondary labels.

---

### Task 1: Render Responsive Rows And Standard Panel Framing

**Files:**
- Modify: `tests/presentation-layout.test.mjs:11-28`
- Modify: `tests/presentation-render-model.test.mjs:6-162`
- Modify: `tests/presentation-mounted.test.mjs:12-87`
- Modify: `tests/presentation-mounted.fixture.ts:32-41`
- Modify: `tui/presentation/layout.ts:25-49`
- Modify: `tui/presentation/renderer.tsx:28-402`
- Modify: `tui/quota.tsx:202-205`

**Interfaces:**
- Consumes: existing `PanelModel`, `PanelItem`, `PanelStatus`, and `PanelTheme` types from `tui/presentation/types.ts` and `tui/presentation/renderer.tsx`.
- Produces: `PanelRenderer(props: { model: Accessor<PanelModel>; theme: Accessor<PanelTheme> })`, with no `availableCells` production prop.
- Produces: mounted progress JSX with a fixed 3-cell label, two `flexBasis={0}` bar children, a fixed 1-cell separator, and a fixed 4-cell percentage.
- Preserves: `normalizePanelModel(model, { availableCells, now })` and `renderPanelLayout(model, options)` for deterministic pure tests.

- [x] **Step 1: Add focused failing pure allocation and render-model assertions**

Update `tests/presentation-layout.test.mjs` so the collapse marker includes its trailing space and the bar starts after exactly three cells:

```javascript
test("reserves a spaced marker and the header summary at the right edge", () => {
  assert.deepEqual(allocateHeader(20, "Quota", "51%/80%"), {
    marker: 2,
    label: 10,
    beforeSummaryGap: 1,
    summary: 7,
  })
})

test("starts the flexible progress bar after a three-cell label", () => {
  assert.deepEqual(allocateProgressRow(20), {
    marker: 3,
    beforeBarGap: 0,
    bar: 12,
    beforePercentGap: 1,
    percent: 4,
  })
})
```

Update the header/progress expectations in `tests/presentation-render-model.test.mjs`, and add a timer to the fixture model:

```javascript
{ id: "reset", order: 15, kind: "timer", label: "5H reset", state: "countdown", epoch: 3_600_000 },
```

```javascript
assert.deepEqual(layout.header.cells, [
  { text: "▼ ", width: 2, align: "start" },
  { text: "Usage…", width: 6, align: "start" },
  { text: " ", width: 1, align: "start" },
  { text: "51%/80%", width: 7, align: "end" },
])
assert.deepEqual(layout.groups[0].items[0], {
  kind: "progress",
  cells: [
    { text: "We…", width: 3, align: "start" },
    { text: "████░░░░", width: 8, align: "start" },
    { text: " ", width: 1, align: "start" },
    { text: " 51%", width: 4, align: "end" },
  ],
})
assert.equal(layout.groups[0].items[1].text, "resets in 1h 0m")
assert.deepEqual(layout.divider, { width: "100%", border: ["top"] })
```

Also replace the earlier normalization assertion at `tests/presentation-render-model.test.mjs:82`:

```javascript
assert.equal(timer.text, "resets in 1h 0m")
```

- [x] **Step 2: Add a focused failing mounted JSX test**

Add progress and timer items to the `model` in `tests/presentation-mounted.test.mjs`:

```javascript
{ id: "five-hour", order: 30, kind: "progress", label: "5H", value: 25, total: 100, status: "warning" },
{ id: "five-hour-reset", order: 40, kind: "timer", label: "5H reset", state: "countdown", epoch: Date.now() + 3_600_000 },
```

Replace the first mounted test completely with structural assertions that do not simulate an 80-cell parent. This also replaces the old `"Primary: Limited"` flattened-header assertion:

```javascript
test("mounts responsive framing, bars, reset indentation, and right-aligned status", () => {
  const { elements, dispose } = mountPanel(model)
  const text = elements.filter((element) => element.type === "text")

  try {
    const quotaMarker = text.find((element) => element.props.children === "▼ ")
    const title = text.find((element) => element.props.children === "Very long usage overview")
    const providerTitle = text.find((element) => element.props.children === "Primary")
    const providerStatus = text.find((element) => element.props.children === "Limited")
    const filled = text.find((element) => element.props.children === "█".repeat(100))
    const empty = text.find((element) => element.props.children === "░".repeat(100))
    const percent = text.find((element) => element.props.children === " 25%")
    const indent = text.find((element) => element.props.children === "   ")

    assert.equal(quotaMarker?.props.width, 2)
    assert.equal(title?.props.flexBasis, 0)
    assert.equal(title?.props.flexGrow, 1)
    assert.equal(providerTitle?.props.flexBasis, 0)
    assert.equal(providerTitle?.props.flexGrow, 1)
    assert.equal(providerStatus?.props.fg, "#ff0000")
    assert.equal(filled?.props.flexBasis, 0)
    assert.equal(filled?.props.flexGrow, 25)
    assert.equal(filled?.props.fg, "#ffaa00")
    assert.equal(empty?.props.flexBasis, 0)
    assert.equal(empty?.props.flexGrow, 75)
    assert.equal(empty?.props.fg, "#888888")
    assert.equal(percent?.props.width, 4)
    assert.equal(percent?.props.fg, "#ffaa00")
    assert.equal(indent?.props.width, 3)

    const dividers = elements.filter((element) =>
      element.type === "box"
      && element.props.width === "100%"
      && element.props.height === 1
      && element.props.border?.[0] === "top")
    assert.equal(dividers.length, 2, "one top divider and one group divider")
  } finally {
    dispose()
  }
})
```

Change `mountPanel` in `tests/presentation-mounted.fixture.ts` to call the new production interface:

```typescript
export function mountPanel(model: Parameters<typeof PanelRenderer>[0]["model"] extends () => infer Model ? Model : never) {
  let tree: unknown
  let dispose: () => void = () => undefined
  createRoot((cleanup) => {
    dispose = cleanup
    tree = PanelRenderer({
      model: () => model,
      theme: () => ({ error: "#ff0000", warning: "#ffaa00", success: "#00ff00", text: "#ffffff", textMuted: "#888888" }),
    })
  })

  try {
    return { elements: expand(tree).filter(isElement), dispose }
  } catch (error) {
    dispose()
    throw error
  }
}
```

- [x] **Step 3: Run responsive renderer focused tests and verify RED**

Run:

```bash
node tests/compile-presentation.mjs && node --test tests/presentation-layout.test.mjs tests/presentation-render-model.test.mjs tests/presentation-mounted.test.mjs
```

Expected: FAIL because `allocateHeader()` returns `marker: 1`, `allocateProgressRow()` returns `beforeBarGap: 1`, timer text repeats `5H reset:`, `PanelRenderer` still requires `availableCells`, no divider follows the title, and mounted rows still contain numeric widths computed from the guessed width.

- [x] **Step 4: Implement the minimal deterministic allocation changes**

Update `tui/presentation/layout.ts`:

```typescript
export function allocateHeader(availableCells: number, _label: string, summary?: string): HeaderAllocation {
  const available = Math.max(0, Math.floor(availableCells))
  const marker = Math.min(2, available)
  const remaining = available - marker
  const summaryWidth = Math.min(summary?.length ?? 0, remaining)
  const beforeSummaryGap = summaryWidth > 0 && remaining > summaryWidth ? 1 : 0
  const labelWidth = Math.max(0, remaining - beforeSummaryGap - summaryWidth)

  return { marker, label: labelWidth, beforeSummaryGap, summary: summaryWidth }
}

export function allocateProgressRow(availableCells: number): ProgressRowAllocation {
  const available = Math.max(0, Math.floor(availableCells))
  const marker = 3
  const beforeBarGap = 0
  const percent = 4
  const beforePercentGap = 1
  const bar = Math.max(0, available - marker - beforeBarGap - beforePercentGap - percent)

  return { marker, beforeBarGap, bar, beforePercentGap, percent }
}
```

In `normalizeItem()` in `tui/presentation/renderer.tsx`, remove the redundant timer label:

```typescript
case "timer":
  return {
    id: item.id,
    kind: item.kind,
    text: formatTimer(item, now),
    detail: item.detail,
    status: item.status,
  }
```

In `renderPanelLayout()`, include the marker's trailing space:

```typescript
renderCell(panelCollapsed ? "▶ " : "▼ ", allocation.marker, "start"),
```

- [x] **Step 5: Replace mounted fixed widths with responsive JSX**

Keep `renderPanelLayout()` for pure tests, but have mounted JSX consume `normalizePanelModel()` directly. Replace mounted item rendering and `PanelRenderer` in `tui/presentation/renderer.tsx` with this shape:

```tsx
function MountedItem(props: { item: NormalizedItem; theme: Accessor<PanelTheme> }) {
  const color = (status?: PanelStatus) => (status ? props.theme()[status] : undefined)

  switch (props.item.kind) {
    case "header":
      return (
        <box flexDirection="row" width="100%">
          <text flexBasis={0} flexGrow={1}>{props.item.title}</text>
          <Show when={props.item.detail}>
            <text fg={color(props.item.status)}>{props.item.detail}</text>
          </Show>
        </box>
      )
    case "text":
      return <text fg={color(props.item.status)}>{props.item.text}</text>
    case "quantity":
      return <text fg={color(props.item.status)}>{`${props.item.label}: ${props.item.value}`}</text>
    case "progress": {
      const filled = Math.max(0, Math.min(100, Number.parseInt(props.item.percent, 10)))
      return (
        <box flexDirection="row" width="100%">
          <text width={3}>{props.item.label}</text>
          <box flexDirection="row" flexBasis={0} flexGrow={1}>
            <text flexBasis={0} flexGrow={filled} fg={color(props.item.status)}>{"█".repeat(100)}</text>
            <text flexBasis={0} flexGrow={100 - filled} fg={props.theme().textMuted}>{"░".repeat(100)}</text>
          </box>
          <text width={1}> </text>
          <text width={4} fg={color(props.item.status)}>{props.item.percent.padStart(4)}</text>
        </box>
      )
    }
    case "timer":
      return (
        <box flexDirection="column">
          <box flexDirection="row" width="100%">
            <text width={3}>   </text>
            <text fg={color(props.item.status)}>{props.item.text}</text>
          </box>
          <Show when={props.item.detail}>
            <box flexDirection="row" width="100%">
              <text width={3}>   </text>
              <text fg={color(props.item.status)}>{props.item.detail}</text>
            </box>
          </Show>
        </box>
      )
    case "table": {
      const rendered = renderItemLayout(props.item)
      if (rendered.kind !== "table") return null
      return (
        <box flexDirection="column">
          <For each={rendered.rows}>
            {(row) => <box flexDirection="row"><For each={row}>{(cell) => <text width={cell.width} fg={color(cell.status)}>{cell.text}</text>}</For></box>}
          </For>
        </box>
      )
    }
  }
}

export function PanelRenderer(props: { model: Accessor<PanelModel>; theme: Accessor<PanelTheme> }) {
  const [collapsed, setCollapsed] = createSignal(new Set<string>())
  const [now, setNow] = createSignal(Date.now())
  const interval = setInterval(() => setNow(Date.now()), 1_000)
  onCleanup(() => clearInterval(interval))

  const toggle = (id: string) => setCollapsed((current) => toggleCollapsed(current, id))
  const normalized = () => normalizePanelModel(props.model(), { now: now() })
  const panelCollapsed = () => collapsed().has(`panel:${props.model().id}`)

  return (
    <box flexDirection="column" width="100%">
      <box flexDirection="row" width="100%" onMouseDown={() => toggle(`panel:${props.model().id}`)}>
        <text width={2}>{panelCollapsed() ? "▶ " : "▼ "}</text>
        <text flexBasis={0} flexGrow={1}>{normalized().title}</text>
        <Show when={normalized().header.summary}>
          {(summary) => <text fg={summary().status ? props.theme()[summary().status!] : undefined}>{summary().text}</text>}
        </Show>
      </box>
      <Divider />
      <Show when={!panelCollapsed()}>
        <For each={normalized().groups}>
          {(group) => {
            const groupCollapsed = () => group.header?.collapsible === true && collapsed().has(`group:${group.id}`)
            return (
              <box flexDirection="column" width="100%">
                <Show when={group.header}>
                  {(header) => (
                    <box flexDirection="row" width="100%" onMouseDown={header().collapsible ? () => toggle(`group:${group.id}`) : undefined}>
                      <text>{header().collapsible ? (groupCollapsed() ? "▶ " : "▼ ") : ""}</text>
                      <text>{header().title}</text>
                    </box>
                  )}
                </Show>
                <Show when={!groupCollapsed()}>
                  <For each={group.items}>{(item) => <MountedItem item={item} theme={props.theme} />}</For>
                </Show>
                <Divider />
              </box>
            )
          }}
        </For>
      </Show>
    </box>
  )
}
```

Update the sidebar return in `tui/quota.tsx`:

```tsx
return <PanelRenderer model={model} theme={theme} />
```

- [x] **Step 6: Run responsive renderer focused tests and typecheck to verify GREEN**

Run:

```bash
node tests/compile-presentation.mjs && node --test tests/presentation-layout.test.mjs tests/presentation-render-model.test.mjs tests/presentation-mounted.test.mjs && npm run typecheck
```

Expected: all focused tests PASS and TypeScript exits `0`. If OpenTUI rejects a flex prop, use the installed `@opentui/solid` prop spelling that preserves the tested `flexBasis`, `flexGrow`, and fixed-width structure; do not restore numeric parent-width allocation.

- [x] **Step 7: Commit the responsive renderer slice**

```bash
git add tui/presentation/layout.ts tui/presentation/renderer.tsx tui/quota.tsx tests/presentation-mounted.fixture.ts tests/presentation-layout.test.mjs tests/presentation-render-model.test.mjs tests/presentation-mounted.test.mjs
git commit -m "fix(tui): render quota rows responsively"
```

### Task 2: Normalize Native Options And Apply Progress Color Semantics

**Files:**
- Modify: `tests/quota-composition.test.mjs:34-272`
- Modify: `tui/quota.tsx:13-172`

**Interfaces:**
- Consumes: `PanelStatus`, provider percentages as remaining quota, and native `TuiPluginOptions`.
- Produces: `ProgressColorOptions`, `QuotaPluginOptions`, `NormalizedQuotaOptions`, and `normalizeQuotaOptions(value?: TuiPluginOptions): NormalizedQuotaOptions` in `tui/quota.tsx`.
- Produces: `composeQuotaPanel(..., requestedOptions?: QuotaCompositionOptions)` where `QuotaCompositionOptions` includes optional `progressColors`.
- Produces for Task 5: normalized `refreshIntervalMs: number`, default `10_000`.

- [x] **Step 1: Add failing default, custom, disabled, and invalid-option tests**

Import `normalizeQuotaOptions` in `tests/quota-composition.test.mjs`, then add:

```javascript
test("normalizes native polling and progress color defaults", () => {
  assert.deepEqual(normalizeQuotaOptions(), {
    percentageMode: "remaining",
    sortDirection: "desc",
    refreshIntervalMs: 10_000,
    progressColors: { enabled: true, errorBelow: 10, warningBelow: 30 },
  })
})

test("normalizes custom thresholds and rejects invalid native options", () => {
  assert.deepEqual(normalizeQuotaOptions({
    refreshIntervalSeconds: 2.5,
    progressColors: { enabled: false, errorBelow: -5, warningBelow: 120 },
    otherProviders: { percentageMode: "used", sortDirection: "asc" },
  }), {
    percentageMode: "used",
    sortDirection: "asc",
    refreshIntervalMs: 2_500,
    progressColors: { enabled: false, errorBelow: 0, warningBelow: 100 },
  })

  assert.deepEqual(normalizeQuotaOptions({
    refreshIntervalSeconds: 0,
    progressColors: { enabled: "yes", errorBelow: 80, warningBelow: 20 },
  }), {
    percentageMode: "remaining",
    sortDirection: "desc",
    refreshIntervalMs: 10_000,
    progressColors: { enabled: true, errorBelow: 10, warningBelow: 30 },
  })
})

test("colors progress by remaining quota even when displaying used quota", () => {
  const selected = provider({ id: "zai", title: "Z.AI", order: 110, primaryPct: 8, secondaryPct: 25 })
  const model = composeQuotaPanel("zai", [selected], {
    percentageMode: "used",
    progressColors: { errorBelow: 10, warningBelow: 30 },
  })

  assert.equal(item(model, "zai:5H").value, 92)
  assert.equal(item(model, "zai:5H").status, "error")
  assert.equal(item(model, "zai:7D").status, "error")
  assert.equal(model.collapsedSummary.text, "92%/75%")
  assert.equal(model.collapsedSummary.status, "error")
})

test("uses custom thresholds and omits semantic status when colors are disabled", () => {
  const selected = provider({ id: "zai", title: "Z.AI", order: 110, primaryPct: 40 })
  const warning = composeQuotaPanel("zai", [selected], {
    progressColors: { errorBelow: 20, warningBelow: 50 },
  })
  const disabled = composeQuotaPanel("zai", [selected], {
    progressColors: { enabled: false },
  })

  assert.equal(item(warning, "zai:5H").status, "warning")
  assert.equal(warning.collapsedSummary.status, "warning")
  assert.equal("status" in item(disabled, "zai:5H"), false)
  assert.equal("status" in disabled.collapsedSummary, false)
})
```

- [x] **Step 2: Run quota option focused tests and verify RED**

Run:

```bash
node tests/compile-presentation.mjs && node --test tests/quota-composition.test.mjs
```

Expected: FAIL because `normalizeQuotaOptions` is not exported, `QuotaCompositionOptions` has no `progressColors`, disabled colors still retain provider statuses, and progress items do not receive threshold-derived status.

- [x] **Step 3: Add exact option types and normalization**

Replace the option declarations and defaults near the top of `tui/quota.tsx` with:

```typescript
export type PercentageMode = "remaining" | "used"
export type SortDirection = "desc" | "asc"

export type ProgressColorOptions = {
  enabled?: boolean
  errorBelow?: number
  warningBelow?: number
}

export type QuotaCompositionOptions = {
  percentageMode?: PercentageMode
  sortDirection?: SortDirection
  progressColors?: ProgressColorOptions
}

export type QuotaPluginOptions = {
  refreshIntervalSeconds?: number
  progressColors?: ProgressColorOptions
  otherProviders?: Pick<QuotaCompositionOptions, "percentageMode" | "sortDirection">
}

type NormalizedProgressColors = {
  enabled: boolean
  errorBelow: number
  warningBelow: number
}

type NormalizedCompositionOptions = {
  percentageMode: PercentageMode
  sortDirection: SortDirection
  progressColors: NormalizedProgressColors
}

export type NormalizedQuotaOptions = NormalizedCompositionOptions & {
  refreshIntervalMs: number
}

const DEFAULT_PROGRESS_COLORS: NormalizedProgressColors = {
  enabled: true,
  errorBelow: 10,
  warningBelow: 30,
}

const DEFAULT_OPTIONS: NormalizedQuotaOptions = {
  percentageMode: "remaining",
  sortDirection: "desc",
  refreshIntervalMs: 10_000,
  progressColors: DEFAULT_PROGRESS_COLORS,
}

function threshold(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.min(100, value))
    : fallback
}

function normalizeProgressColors(value: unknown): NormalizedProgressColors {
  if (!value || typeof value !== "object") return DEFAULT_PROGRESS_COLORS
  const input = value as ProgressColorOptions
  const errorBelow = threshold(input.errorBelow, DEFAULT_PROGRESS_COLORS.errorBelow)
  const warningBelow = threshold(input.warningBelow, DEFAULT_PROGRESS_COLORS.warningBelow)

  return {
    enabled: typeof input.enabled === "boolean" ? input.enabled : true,
    ...(errorBelow <= warningBelow
      ? { errorBelow, warningBelow }
      : {
          errorBelow: DEFAULT_PROGRESS_COLORS.errorBelow,
          warningBelow: DEFAULT_PROGRESS_COLORS.warningBelow,
        }),
  }
}

function compositionOptions(options?: QuotaCompositionOptions): NormalizedCompositionOptions {
  return {
    percentageMode: options?.percentageMode === "used" ? "used" : "remaining",
    sortDirection: options?.sortDirection === "asc" ? "asc" : "desc",
    progressColors: normalizeProgressColors(options?.progressColors),
  }
}

export function normalizeQuotaOptions(value?: TuiPluginOptions): NormalizedQuotaOptions {
  const input = value && typeof value === "object" ? value as QuotaPluginOptions : {}
  const otherProviders = input.otherProviders && typeof input.otherProviders === "object"
    ? input.otherProviders
    : undefined
  const refreshIntervalMs = typeof input.refreshIntervalSeconds === "number"
    && Number.isFinite(input.refreshIntervalSeconds)
    && input.refreshIntervalSeconds > 0
    ? input.refreshIntervalSeconds * 1_000
    : DEFAULT_OPTIONS.refreshIntervalMs

  return {
    ...compositionOptions({ ...otherProviders, progressColors: input.progressColors }),
    refreshIntervalMs,
  }
}
```

- [x] **Step 4: Apply remaining-quota status during composition**

Replace `percentStatus()` and update `orderedProviderItems()` and `summary()` in `tui/quota.tsx`:

```typescript
function percentStatus(remainingPct: number, options: NormalizedCompositionOptions): PanelStatus | undefined {
  if (!options.progressColors.enabled) return undefined
  if (remainingPct <= options.progressColors.errorBelow) return "error"
  if (remainingPct <= options.progressColors.warningBelow) return "warning"
  return "success"
}
```

Change the option parameter type on `metric()`, `orderedProviderItems()`, `providerItems()`, and `summary()` from `Required<QuotaCompositionOptions>` to `NormalizedCompositionOptions`. `composeQuotaPanel()` continues accepting the public optional `QuotaCompositionOptions` and immediately calls `compositionOptions(requestedOptions)`.

Within the final item mapping in `orderedProviderItems()`, apply display mode after status is calculated:

```typescript
.map(({ item }, index) => {
  if (item.kind !== "progress") return { ...item, order: orderOffset + index }
  const { status: _providerStatus, ...progress } = item
  const remainingPct = item.total > 0 ? (item.value / item.total) * 100 : 0
  const status = percentStatus(remainingPct, options)
  const value = options.percentageMode === "used"
    ? Math.max(0, item.total - item.value)
    : item.value
  return {
    ...progress,
    order: orderOffset + index,
    value,
    ...(status ? { status } : {}),
  }
})
```

```typescript
function summary(provider: QuotaProviderAdapter | undefined, options: NormalizedCompositionOptions) {
  const home = provider?.home()
  if (!home) return undefined

  const primary = metric(home.primaryPct, options)
  const secondary = typeof home.secondaryPct === "number"
    ? `/${Math.round(metric(home.secondaryPct, options))}%`
    : ""
  const status = percentStatus(home.primaryPct, options)
  return {
    kind: "text" as const,
    text: `${Math.round(primary)}%${secondary}`,
    ...(status ? { status } : {}),
  }
}
```

Use `normalizeQuotaOptions(rawOptions)` in `tui()` and pass the normalized object to `composeQuotaPanel()`.

- [x] **Step 5: Run quota option focused tests and verify GREEN**

Run:

```bash
node tests/compile-presentation.mjs && node --test tests/quota-composition.test.mjs tests/presentation-mounted.test.mjs && npm run typecheck
```

Expected: all tests PASS; mounted coverage proves labels are uncolored and empty bars use `textMuted`, while composition coverage proves semantic status and disabled-color omission.

- [x] **Step 6: Commit the option and color slice**

```bash
git add tui/quota.tsx tests/quota-composition.test.mjs
git commit -m "fix(tui): normalize quota progress colors"
```

### Task 3: Preserve Progress-Led Groups And Surface Z.AI Peak Status

**Files:**
- Modify: `tests/quota-composition.test.mjs:195-252`
- Modify: `tests/provider-zai.test.mjs:154-235`
- Modify: `tui/quota.tsx:56-106`
- Modify: `tui/providers/zai.ts:265-346`

**Interfaces:**
- Consumes: normalized `NormalizedCompositionOptions` from Task 2.
- Produces: preamble items followed by progress-led groups sorted shortest-duration first; unknown-duration groups retain source order.
- Produces: ready/stale Z.AI header item `{ title: "Z.AI: <plan>", detail: "Peak (3x)" | "Off-Peak (1x)", status: "error" | "success" }`.

- [x] **Step 1: Add a failing composition test for atomic window groups**

Add to `tests/quota-composition.test.mjs`:

```javascript
test("keeps window details attached and leaves unknown tool quota last", () => {
  const zai = provider({
    id: "zai",
    title: "Z.AI",
    order: 110,
    primaryPct: 75,
    groups: [{
      id: "zai:quota",
      order: 10,
      items: [
        { id: "zai:header", order: 10, kind: "header", title: "Z.AI: Pro", detail: "Peak (3x)", status: "error" },
        { id: "zai:7d", order: 50, kind: "progress", label: "7D", value: 60, total: 100 },
        { id: "zai:7d-reset", order: 60, kind: "timer", label: "7D reset", state: "idle" },
        { id: "zai:7d-used", order: 61, kind: "quantity", label: "7D used", value: 4000, unit: "count" },
        { id: "zai:5h", order: 20, kind: "progress", label: "5H", value: 75, total: 100 },
        { id: "zai:5h-reset", order: 30, kind: "timer", label: "5H reset", state: "idle" },
        { id: "zai:5h-used", order: 31, kind: "quantity", label: "5H used", value: 250, unit: "count" },
        { id: "zai:time", order: 80, kind: "progress", label: "T", value: 70, total: 100 },
        { id: "zai:time-reset", order: 90, kind: "timer", label: "Tool reset", state: "idle" },
        { id: "zai:time-models", order: 95, kind: "table", columns: [], rows: [] },
      ],
    }],
  })

  const items = composeQuotaPanel("zai", [zai]).groups[0].items
  assert.deepEqual(items.map((entry) => entry.id), [
    "zai:header",
    "zai:5h", "zai:5h-reset", "zai:5h-used",
    "zai:7d", "zai:7d-reset", "zai:7d-used",
    "zai:time", "zai:time-reset", "zai:time-models",
  ])
})
```

- [x] **Step 2: Add failing Z.AI header-detail assertions**

Update the ready and off-peak expectations in `tests/provider-zai.test.mjs`:

```javascript
assert.deepEqual(item(model, "zai:header"), {
  id: "zai:header",
  order: 10,
  kind: "header",
  title: "Z.AI: Pro",
  detail: "Peak (3x)",
  status: "error",
})
```

```javascript
assert.equal(item(model, "zai:header").detail, "Off-Peak (1x)")
assert.equal(item(model, "zai:header").status, "success")
assert.deepEqual(model.collapsedSummary, { kind: "text", text: "Off-Peak (1x)", status: "success" })
```

- [x] **Step 3: Run grouping and Z.AI focused tests and verify RED**

Run:

```bash
node tests/compile-presentation.mjs && node --test tests/quota-composition.test.mjs tests/provider-zai.test.mjs
```

Expected: FAIL because independent item sorting separates quantity/table details from their progress rows, unknown labels sort alphabetically rather than by source order, and the ready Z.AI header has no Peak/Off-Peak detail.

- [x] **Step 4: Partition and sort provider item groups atomically**

Replace `itemWindowLabel()` and `orderedProviderItems()` in `tui/quota.tsx` with progress-led grouping:

```typescript
type ProviderItemGroup = {
  items: PanelItem[]
  duration: number | null
  sourceIndex: number
}

function providerItemGroups(items: readonly PanelItem[]): { preamble: PanelItem[]; groups: ProviderItemGroup[] } {
  const ordered = sortByOrderThenId(items)
  const firstProgress = ordered.findIndex((item) => item.kind === "progress")
  if (firstProgress < 0) return { preamble: ordered, groups: [] }

  const preamble = ordered.slice(0, firstProgress)
  const groups: ProviderItemGroup[] = []
  for (const item of ordered.slice(firstProgress)) {
    if (item.kind === "progress") {
      groups.push({
        items: [item],
        duration: windowDuration(item.label),
        sourceIndex: groups.length,
      })
    } else {
      groups.at(-1)!.items.push(item)
    }
  }
  return { preamble, groups }
}

function orderedProviderItems(items: readonly PanelItem[], options: NormalizedCompositionOptions, orderOffset: number): PanelItem[] {
  const { preamble, groups } = providerItemGroups(items)
  const orderedGroups = [...groups].sort((left, right) => {
    if (left.duration !== null && right.duration !== null) return left.duration - right.duration || left.sourceIndex - right.sourceIndex
    if (left.duration !== null) return -1
    if (right.duration !== null) return 1
    return left.sourceIndex - right.sourceIndex
  })

  return [...preamble, ...orderedGroups.flatMap((group) => group.items)]
    .map((item, index) => {
      if (item.kind !== "progress") return { ...item, order: orderOffset + index }
      const { status: _providerStatus, ...progress } = item
      const remainingPct = item.total > 0 ? (item.value / item.total) * 100 : 0
      const status = percentStatus(remainingPct, options)
      const value = options.percentageMode === "used" ? Math.max(0, item.total - item.value) : item.value
      return { ...progress, order: orderOffset + index, value, ...(status ? { status } : {}) }
    })
}
```

Change the existing unknown-window test to assert source order, because unknown groups must not be alphabetically reordered:

```javascript
assert.deepEqual(labels, ["5H", "Zeta", "Alpha"])
```

- [x] **Step 5: Put semantic Peak/Off-Peak detail on the Z.AI header**

In the ready/stale `data` branch of `mapZaiPanelState()` in `tui/providers/zai.ts`, derive the value once and use it for both header and collapsed summary:

```typescript
const peak = isPeakHour(now)
const peakSummary = {
  text: peak ? "Peak (3x)" : "Off-Peak (1x)",
  status: peak ? "error" as const : "success" as const,
}
```

```typescript
} else if (data) {
  items.push(header(`Z.AI: ${data.level}`, peakSummary.text, peakSummary.status))
  if (state.phase === "stale") items.push({ id: "zai:stale", order: 15, kind: "text", text: "~stale", status: "warning" })
  items.push(...quotaItems("5H", "5h", 20, data.tokenRemainingPct, data.tokenNextResetEpoch, now, data.tokenAbsolute))
  const weekly = data.weeklyLimit
  items.push(...quotaItems("7D", "7d", 50, weekly?.remainingPct ?? 100, weekly?.nextResetEpoch ?? 0, now, weekly?.absolute ?? null))
  if (!weekly) items.push({ id: "zai:7d-legacy", order: 65, kind: "text", text: "Unlimited (Legacy)", status: "textMuted" })
  if (data.timeLimit) {
    const time = data.timeLimit
    items.push(
      { id: "zai:time", order: 80, kind: "progress", label: "T", value: time.remainingPct, total: 100 },
      { id: "zai:time-reset", order: 90, kind: "timer", label: "Tool reset", state: timerState(time.remainingPct, time.nextResetEpoch, now), ...(time.nextResetEpoch > 0 ? { epoch: time.nextResetEpoch } : {}) },
      { id: "zai:time-used", order: 91, kind: "quantity", label: "Tool used", value: time.used, unit: "count" },
      { id: "zai:time-total", order: 92, kind: "quantity", label: "Tool total", value: time.total, unit: "count" },
    )
    const rows = time.usageDetails.filter((detail) => detail.usage > 0)
    if (rows.length) items.push({
      id: "zai:time-models",
      order: 95,
      kind: "table",
      columns: [
        { id: "model", order: 10, title: "Model" },
        { id: "usage", order: 20, title: "Usage", align: "end" },
      ],
      rows: rows.map((detail, index) => ({
        id: `zai:time-model:${detail.modelCode}`,
        order: index,
        cells: [{ kind: "text", text: detail.modelCode }, { kind: "quantity", value: detail.usage, unit: "count" }],
      })),
    })
  }
} else {
  items.push(header("Z.AI", "Usage unavailable", "textMuted"))
}
```

Use the same value in the return object:

```typescript
collapsedSummary: data
  ? { kind: "text", text: peakSummary.text, status: peakSummary.status }
  : undefined,
```

Declare `peakSummary` before the branch so it is available to the final return. Do not alter loading, unavailable, rate-limited, or heuristic header details.

- [x] **Step 6: Run grouping and Z.AI focused tests and verify GREEN**

Run:

```bash
node tests/compile-presentation.mjs && node --test tests/quota-composition.test.mjs tests/provider-zai.test.mjs tests/presentation-mounted.test.mjs && npm run typecheck
```

Expected: all tests PASS; the Z.AI header status is available for Task 1's right-aligned mounted detail and tool rows remain after all known quota windows.

- [x] **Step 7: Commit the grouping and Z.AI status slice**

```bash
git add tui/quota.tsx tui/providers/zai.ts tests/quota-composition.test.mjs tests/provider-zai.test.mjs
git commit -m "fix(tui): preserve provider quota groups"
```

### Task 4: Derive OpenAI Window Labels And Stable IDs From Duration

**Files:**
- Modify: `tests/provider-openai.test.mjs:30-255`
- Modify: `tui/providers/openai.ts:196-240`

**Interfaces:**
- Consumes: `RateLimitWindow.limit_window_seconds` from the OpenAI response.
- Produces: `formatWindowDuration(seconds: number | undefined): string` with largest exact unit among 30-day month, week, day, and hour, plus a rounded-hour fallback.
- Produces: progress/reset IDs `openai:<duration-seconds>s-<primary|secondary>` and `openai:<duration-seconds>s-<primary|secondary>-reset`.

- [x] **Step 1: Add failing weekly-primary and multi-window duration tests**

Replace hard-coded OpenAI item IDs in existing tests (`openai:5h`, `openai:5h-reset`, and `openai:7d`) with duration/role IDs (`openai:18000s-primary`, `openai:18000s-primary-reset`, and `openai:604800s-secondary`). Then add:

```javascript
test("labels a weekly-only primary window from its API duration", () => {
  const model = mapOpenAiPanelState({
    phase: "ready",
    data: quota({ primary: window({ limit_window_seconds: 7 * 24 * 60 * 60 }), secondary: null }),
    now,
  })
  const progress = model.groups[0].items.filter((entry) => entry.kind === "progress")

  assert.deepEqual(progress.map((entry) => [entry.id, entry.label]), [
    ["openai:604800s-primary", "7D"],
  ])
  assert.equal(progress.some((entry) => entry.label === "5H"), false)
})

test("labels each OpenAI role from duration and keeps IDs stable", () => {
  const model = mapOpenAiPanelState({
    phase: "ready",
    data: quota({
      primary: window({ limit_window_seconds: 18_000 }),
      secondary: window({ limit_window_seconds: 604_800, used_percent: 40 }),
    }),
    now,
  })

  assert.deepEqual(
    model.groups[0].items.filter((entry) => entry.kind === "progress").map((entry) => [entry.id, entry.label]),
    [["openai:18000s-primary", "5H"], ["openai:604800s-secondary", "7D"]],
  )
})

test("uses the largest exact compact duration unit", () => {
  const model = mapOpenAiPanelState({
    phase: "ready",
    data: quota({ primary: window({ limit_window_seconds: 30 * 24 * 60 * 60 }) }),
    now,
  })

  assert.equal(item(model, "openai:2592000s-primary").label, "1M")
})
```

- [x] **Step 2: Run the focused OpenAI tests and verify RED**

Run:

```bash
node tests/compile-presentation.mjs && node --test tests/provider-openai.test.mjs
```

Expected: FAIL because a weekly primary is still emitted as `openai:5h` with label `5H`, IDs depend on response position, and no 30-day formatter exists.

- [x] **Step 3: Implement duration formatting and role-stable IDs**

Replace `quotaItems()` in `tui/providers/openai.ts` with:

```typescript
export function formatWindowDuration(seconds: number | undefined): string {
  if (typeof seconds !== "number" || !Number.isFinite(seconds) || seconds <= 0) return "Quota"
  const rounded = Math.round(seconds)
  const month = 30 * 24 * 60 * 60
  const week = 7 * 24 * 60 * 60
  const day = 24 * 60 * 60
  const hour = 60 * 60

  if (rounded % month === 0) return `${rounded / month}M`
  if (rounded === week) return "7D"
  if (rounded % week === 0) return `${rounded / week}W`
  if (rounded % day === 0) return `${rounded / day}D`
  if (rounded % hour === 0) return `${rounded / hour}H`
  return `${Math.max(1, Math.round(rounded / hour))}H`
}

function quotaItems(role: "primary" | "secondary", order: number, window: RateLimitWindow, now: number): PanelItem[] {
  const remainingPct = openAiRemainingPct(window)
  const epoch = resetEpochMs(window, now)
  const durationSeconds = typeof window.limit_window_seconds === "number"
    && Number.isFinite(window.limit_window_seconds)
    && window.limit_window_seconds > 0
    ? Math.round(window.limit_window_seconds)
    : 0
  const label = formatWindowDuration(window.limit_window_seconds)
  const durationKey = durationSeconds > 0 ? `${durationSeconds}s` : "unknown"
  const id = `${durationKey}-${role}`

  return [
    { id: `openai:${id}`, order, kind: "progress", label, value: remainingPct, total: 100 },
    { id: `openai:${id}-reset`, order: order + 10, kind: "timer", label: `${label} reset`, state: timerState(remainingPct, epoch, now), ...(epoch > 0 ? { epoch } : {}) },
  ]
}
```

Update `mapOpenAiPanelState()`:

```typescript
items.push(...quotaItems("primary", 20, data.primary, now))
if (data.secondary) items.push(...quotaItems("secondary", 50, data.secondary, now))
```

Keep plan normalization, stale/limited items, reset arithmetic, and collapsed summary unchanged.

- [x] **Step 4: Run focused provider and composition tests and verify GREEN**

Run:

```bash
node tests/compile-presentation.mjs && node --test tests/provider-openai.test.mjs tests/quota-composition.test.mjs && npm run typecheck
```

Expected: all tests PASS; a seven-day primary yields one `7D` group and no `5H` group.

- [x] **Step 5: Commit the OpenAI duration slice**

```bash
git add tui/providers/openai.ts tests/provider-openai.test.mjs
git commit -m "fix(tui): label OpenAI windows by duration"
```

### Task 5: Poll Providers At The Configured Interval

**Files:**
- Modify: `tests/provider-openai.test.mjs:78-142,284-322`
- Modify: `tests/provider-zai.test.mjs:84-148,289-324`
- Modify: `tests/quota-composition.test.mjs:77-132,262-272`
- Modify: `tui/providers/types.ts:21-32`
- Modify: `tui/providers/openai.ts:8-12,251-334`
- Modify: `tui/providers/zai.ts:9-13,371-497`
- Modify: `tui/quota.tsx:189-208`
- Modify: `README.md:50-63,73-95,155-174`

**Interfaces:**
- Consumes: `NormalizedQuotaOptions.refreshIntervalMs` from Task 2.
- Produces: `QuotaProviderOptions = { refreshIntervalMs?: number }` in `tui/providers/types.ts`.
- Produces: `createOpenAiProvider(api: TuiPluginApi, options?: QuotaProviderOptions)` and `createZaiProvider(api: TuiPluginApi, options?: QuotaProviderOptions)`.
- Preserves: exhausted polling at `300_000ms` and countdown ticking at `1_000ms`.

- [x] **Step 1: Make provider test harnesses accept constructor options**

Update both `createTestAdapter()` helpers:

```javascript
function createTestAdapter(t, { api = adapterApi(), fetch: testFetch, clock, providerOptions } = {}) {
  const originalFetch = globalThis.fetch
  if (testFetch) globalThis.fetch = testFetch
  const adapter = createOpenAiProvider(api, providerOptions)
  t.after(async () => {
    try {
      adapter.dispose()
      await flushEffects()
    } finally {
      globalThis.fetch = originalFetch
      clock?.restore()
    }
  })
  return adapter
}
```

Use `createZaiProvider(api, providerOptions)` in the Z.AI copy.

- [x] **Step 2: Add failing controlled-timer tests for both adapters**

Add these exact tests to both `tests/provider-openai.test.mjs` and `tests/provider-zai.test.mjs`; each file uses its existing provider-specific `quotaResponse()`:

```javascript
test("uses the default and custom provider polling intervals while keeping the one-second clock", async (t) => {
  const defaultClock = installFakeClock(now)
  createTestAdapter(t, { clock: defaultClock, fetch: async () => quotaResponse() })
  await flushEffects()

  assert.ok(defaultClock.intervals.some((timer) => timer.active && timer.delay === 10_000))
  assert.ok(defaultClock.intervals.some((timer) => timer.active && timer.delay === 1_000))
})

test("uses a custom provider polling interval", async (t) => {
  const clock = installFakeClock(now)
  createTestAdapter(t, {
    clock,
    fetch: async () => quotaResponse(),
    providerOptions: { refreshIntervalMs: 2_500 },
  })
  await flushEffects()

  assert.ok(clock.intervals.some((timer) => timer.active && timer.delay === 2_500))
  assert.ok(clock.intervals.some((timer) => timer.active && timer.delay === 1_000))
})
```

Keep each fake clock in a separate test so globals are restored before another clock is installed.

- [x] **Step 3: Add a failing plugin-forwarding assertion**

In `aggregatePanel()` in `tests/quota-composition.test.mjs`, add an observation parameter, capture the original interval function with the other globals, install the wrapper after `testFetch`, and restore it in the existing `finally` block:

```javascript
async function aggregatePanel(t, options, observedIntervalDelays = []) {
  const registrations = []
  const cleanup = []
  const originalFetch = globalThis.fetch
  const originalSetInterval = globalThis.setInterval
  const originalReact = globalThis.React
  const originalError = console.error

  const testFetch = async () => ({
    ok: true,
    json: async () => ({
      code: 200,
      data: {
        level: "pro",
        limits: [{ type: "TOKENS_LIMIT", unit: 3, percentage: 25, nextResetTime: Date.now() + 60 * 60 * 1000 }],
      },
    }),
  })
  globalThis.React = { createElement: (component, props) => ({ component, props }) }
  globalThis.fetch = testFetch
  globalThis.setInterval = (callback, delay, ...args) => {
    observedIntervalDelays.push(delay)
    return originalSetInterval(callback, delay, ...args)
  }
  console.error = () => {}
```

The cleanup `finally` block must be exactly:

```javascript
} finally {
  globalThis.fetch = originalFetch
  globalThis.setInterval = originalSetInterval
  globalThis.React = originalReact
  console.error = originalError
}
```

Add the assertion test:

```javascript
test("forwards normalized refreshIntervalSeconds to both providers", async (t) => {
  const intervalDelays = []
  await aggregatePanel(t, { refreshIntervalSeconds: 2.5 }, intervalDelays)
  assert.equal(intervalDelays.filter((delay) => delay === 2_500).length, 2)
})
```

- [x] **Step 4: Run provider polling focused tests and verify RED**

Run:

```bash
node tests/compile-presentation.mjs && node --test tests/provider-openai.test.mjs tests/provider-zai.test.mjs tests/quota-composition.test.mjs
```

Expected: FAIL because both adapters schedule `60_000ms`, constructor options are ignored, and `tui()` does not pass normalized `refreshIntervalMs`.

- [x] **Step 5: Add the shared constructor option and use it in both adapters**

Add to `tui/providers/types.ts`:

```typescript
export type QuotaProviderOptions = {
  refreshIntervalMs?: number
}
```

Import that type in each provider. Remove `API_POLL_MS`, add a local normalizer, and update each constructor:

```typescript
const DEFAULT_REFRESH_INTERVAL_MS = 10_000

function providerRefreshInterval(options: QuotaProviderOptions): number {
  return typeof options.refreshIntervalMs === "number"
    && Number.isFinite(options.refreshIntervalMs)
    && options.refreshIntervalMs > 0
    ? options.refreshIntervalMs
    : DEFAULT_REFRESH_INTERVAL_MS
}

```

Change the OpenAI constructor declaration/opening to:

```typescript
export function createOpenAiProvider(api: TuiPluginApi, options: QuotaProviderOptions = {}): QuotaProviderAdapter {
  const refreshIntervalMs = providerRefreshInterval(options)
  return createRoot((dispose) => {
```

Change the Z.AI constructor declaration/opening to:

```typescript
export function createZaiProvider(api: TuiPluginApi, options: QuotaProviderOptions = {}): QuotaProviderAdapter {
  const refreshIntervalMs = providerRefreshInterval(options)
  return createRoot((dispose) => {
```

Do not alter the signals, `refresh()`, stale/timeout/boundary effects, or returned adapter fields. In each regular polling effect, replace only the non-exhausted interval:

```typescript
const timer = setInterval(() => void refresh(), exhausted ? EXHAUSTED_POLL_MS : refreshIntervalMs)
```

- [x] **Step 6: Pass normalized polling to both adapters**

Reorder setup in `tui()` in `tui/quota.tsx` so options exist before construction:

```typescript
const tui: TuiPlugin = async (api, rawOptions) => {
  const options = normalizeQuotaOptions(rawOptions)
  const providers: QuotaProviderAdapter[] = []
  api.lifecycle.onDispose(() => providers.forEach((provider) => provider.dispose()))
  providers.push(createZaiProvider(api, { refreshIntervalMs: options.refreshIntervalMs }))
  providers.push(createOpenAiProvider(api, { refreshIntervalMs: options.refreshIntervalMs }))
  const model = createMemo(() => composeQuotaPanel(selectedProviderID(api, providers), providers, options))
  const theme = () => api.theme.current as PanelTheme

  api.slots.register({
    order: SIDEBAR_ORDER,
    slots: {
      sidebar_content(_ctx, props) {
        for (const provider of providers) provider.setSessionID(props.session_id ?? "")
        return <PanelRenderer model={model} theme={theme} />
      },
    },
  })
}
```

- [x] **Step 7: Document the native options and 10-second default**

Update `README.md` so the shared feature says polling defaults to 10 seconds, then add this exact example under local usage:

```json
[
  "./opencode-tools-quota.js",
  {
    "refreshIntervalSeconds": 10,
    "progressColors": {
      "enabled": true,
      "errorBelow": 10,
      "warningBelow": 30
    },
    "otherProviders": {
      "percentageMode": "remaining",
      "sortDirection": "desc"
    }
  }
]
```

State that invalid/non-positive polling values use 10 seconds, thresholds clamp to `0-100`, `errorBelow` cannot exceed `warningBelow`, and `progressColors.enabled: false` disables semantic bar/percentage colors. Change both provider workflow sections from `60s` to `10s`; retain the documented 5-minute exhausted backoff.

- [x] **Step 8: Run provider polling focused tests and verify GREEN**

Run:

```bash
node tests/compile-presentation.mjs && node --test tests/provider-openai.test.mjs tests/provider-zai.test.mjs tests/quota-composition.test.mjs tests/plugin-deploy.test.mjs && npm run typecheck
```

Expected: all tests PASS; each adapter has an active `10_000ms` default interval or configured interval plus its independent `1_000ms` state clock.

- [x] **Step 9: Commit the polling slice**

```bash
git add tui/providers/types.ts tui/providers/openai.ts tui/providers/zai.ts tui/quota.tsx tests/provider-openai.test.mjs tests/provider-zai.test.mjs tests/quota-composition.test.mjs README.md
git commit -m "fix(tui): configure provider polling interval"
```

### Task 6: Refresh And Prioritize The Active Session Model Provider

**Files:**
- Modify: `tests/quota-composition.test.mjs:17-272`
- Create: `tests/quota-selection.fixture.ts`
- Modify: `tests/compile-presentation.mjs:4-19`
- Modify: `tui/quota.tsx:1-215`

**Interfaces:**
- Consumes: `api.state.session.messages(sessionID)`, message `{ role, model: { providerID } }`, `selectedQuotaProviderID()`, and adapter `refresh()`.
- Produces: `selectedSessionQuotaProviderID(messages, providers, fallbackID): string | undefined`.
- Produces: `createQuotaSelection(api, providers): { selectedProviderID: Accessor<string | undefined>; setSessionID(sessionID: string): void }`.
- Preserves: configured/provider-state selection as fallback and provider titles without model names.

- [x] **Step 1: Add failing pure selection tests**

Import `mountQuotaSelection` from `../.tmp-test/quota-selection.mjs` and import `selectedSessionQuotaProviderID` from `../.tmp-test/quota-composition.mjs` in `tests/quota-composition.test.mjs`. Add `dispose() {}` to the provider fixture, then add:

```javascript
test("resolves the newest supported user model and falls back without usable metadata", () => {
  const zai = provider({ id: "zai", title: "Z.AI", order: 110 })
  const openai = provider({ id: "openai", title: "OpenAI", order: 120 })
  const providers = [zai, openai]

  assert.equal(selectedSessionQuotaProviderID([
    { id: "m1", role: "user", model: { providerID: "zai-coding-plan", modelID: "glm-4.7" } },
    { id: "m2", role: "assistant" },
    { id: "m3", role: "user", model: { providerID: "codex", modelID: "gpt-5" } },
  ], providers, "zai"), "openai")
  assert.equal(selectedSessionQuotaProviderID([], providers, "zai"), "zai")
  assert.equal(selectedSessionQuotaProviderID([
    { id: "m4", role: "user", model: { providerID: "unsupported", modelID: "other" } },
  ], providers, "zai"), "zai")
})
```

- [x] **Step 2: Add a failing reactive refresh/reorder test**

Add `onRefresh = async () => {}` to the provider fixture's destructured arguments. Replace its existing `refresh` field and append `dispose`:

```javascript
refresh: onRefresh,
setSessionID: () => {},
dispose: () => {},
```

Create `tests/quota-selection.fixture.ts` so the harness and production helper share one bundled Solid owner:

```typescript
import { createRoot } from "solid-js"

import { createQuotaSelection } from "../tui/quota.js"

export function mountQuotaSelection(...args: Parameters<typeof createQuotaSelection>) {
  let selection!: ReturnType<typeof createQuotaSelection>
  let dispose: () => void = () => undefined
  createRoot((cleanup) => {
    dispose = cleanup
    selection = createQuotaSelection(...args)
  })
  return { ...selection, dispose }
}
```

Add `"quota-selection"` to the cleanup-name array and add this entry to the compile matrix in `tests/compile-presentation.mjs`:

```javascript
["tests/quota-selection.fixture.ts", ".tmp-test/quota-selection.mjs", ["browser"]],
```

Add the behavior test:

```javascript
test("refreshes and reorders when the sidebar session changes provider", async () => {
  const refreshes = []
  const zai = provider({ id: "zai", title: "Z.AI", order: 110, primaryPct: 60, onRefresh: async () => refreshes.push("zai") })
  const openai = provider({ id: "openai", title: "OpenAI", order: 120, primaryPct: 70, onRefresh: async () => refreshes.push("openai") })
  const messages = {
    "session-zai": [{ id: "z1", role: "user", model: { providerID: "zai-coding-plan", modelID: "glm-4.7" } }],
    "session-openai": [{ id: "o1", role: "user", model: { providerID: "openai", modelID: "gpt-5" } }],
  }
  const api = {
    state: {
      provider: [{ id: "zai-coding-plan" }],
      session: { messages: (sessionID) => messages[sessionID] ?? [] },
    },
  }

  const selection = mountQuotaSelection(api, [zai, openai])

  try {
    selection.setSessionID("session-zai")
    await flushEffects()
    selection.setSessionID("session-openai")
    await flushEffects()

    assert.deepEqual(refreshes, ["zai", "openai"])
    const model = composeQuotaPanel(selection.selectedProviderID(), [zai, openai])
    assert.equal(model.groups[0].id, "openai:quota")
    assert.equal(model.groups[1].header.title, "Other providers")
    assert.equal(JSON.stringify(model).includes("gpt-5"), false)
  } finally {
    selection.dispose()
  }
})
```

- [x] **Step 3: Run active-provider selection focused tests and verify RED**

Run:

```bash
node tests/compile-presentation.mjs && node --test tests/quota-composition.test.mjs
```

Expected: FAIL because the session-model helpers do not exist, sidebar selection only reads `api.state.provider`, and no selection effect invokes `refresh()`.

- [x] **Step 4: Resolve the newest user-message model with fallback**

Change the Solid import in `tui/quota.tsx`:

```typescript
import { createEffect, createMemo, createSignal, type Accessor } from "solid-js"
```

Add these structural message and selection interfaces near `ADAPTER_ID_BY_PROVIDER_ID`:

```typescript
type SessionModelMessage = {
  role?: string
  model?: {
    providerID?: string
  }
}

export function selectedSessionQuotaProviderID(
  messages: readonly SessionModelMessage[],
  providers: readonly QuotaProviderAdapter[],
  fallbackID: string | undefined,
): string | undefined {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index]
    if (message?.role !== "user" || !message.model?.providerID) continue
    return selectedQuotaProviderID([{ id: message.model.providerID }], providers) ?? fallbackID
  }
  return fallbackID
}
```

- [x] **Step 5: Add the reactive session selection and one-refresh-per-change effect**

Add to `tui/quota.tsx`:

```typescript
export function createQuotaSelection(
  api: TuiPluginApi,
  providers: readonly QuotaProviderAdapter[],
): { selectedProviderID: Accessor<string | undefined>; setSessionID(sessionID: string): void } {
  const [sessionID, setSessionID] = createSignal("")
  const selectedProviderID = createMemo(() => {
    const fallbackID = selectedQuotaProviderID(api.state.provider, providers)
    const id = sessionID()
    if (!id) return fallbackID
    try {
      return selectedSessionQuotaProviderID(api.state.session.messages(id), providers, fallbackID)
    } catch {
      return fallbackID
    }
  })
  let refreshedProviderID: string | undefined

  createEffect(() => {
    if (!sessionID()) return
    const adapterID = selectedProviderID()
    if (!adapterID || adapterID === refreshedProviderID) return
    refreshedProviderID = adapterID
    void providers.find((provider) => provider.id === adapterID)?.refresh()
  })

  return { selectedProviderID, setSessionID }
}
```

Wire it into `tui()` after adapter construction:

```typescript
const selection = createQuotaSelection(api, providers)
const model = createMemo(() => composeQuotaPanel(selection.selectedProviderID(), providers, options))
```

Update `sidebar_content`:

```tsx
sidebar_content(_ctx, props) {
  const sessionID = props.session_id ?? ""
  selection.setSessionID(sessionID)
  for (const provider of providers) provider.setSessionID(sessionID)
  return <PanelRenderer model={model} theme={theme} />
},
```

Remove the now-unused private `selectedProviderID(api, providers)` wrapper. Keep the provider-ID map entries for `zai-coding-plan`, `openai`, `codex`, `chatgpt`, and `opencode`.

- [x] **Step 6: Run active-provider selection focused tests and verify GREEN**

Run:

```bash
node tests/compile-presentation.mjs && node --test tests/quota-composition.test.mjs tests/provider-openai.test.mjs tests/provider-zai.test.mjs && npm run typecheck
```

Expected: all tests PASS; each supported provider change triggers one immediate refresh, the selected provider becomes the first group, other ready/stale providers remain under `Other providers`, unsupported/missing metadata uses provider-state fallback, and no model name enters the panel model.

- [x] **Step 7: Commit the active-session selection slice**

```bash
git add tui/quota.tsx tests/quota-composition.test.mjs
git commit -m "fix(tui): prioritize active model provider"
```

### Task 7: Dim Reset And Tool Metadata

**Files:**
- Modify: `tests/presentation-mounted.test.mjs`
- Modify: `tui/presentation/renderer.tsx`

**Interfaces:**
- Consumes: normalized timer and standalone quantity items plus `PanelTheme.textMuted`.
- Produces: mounted timer and quantity text that defaults to `textMuted` while preserving any explicit item status.

- [x] **Step 1: Add a focused failing mounted metadata-color test**

Add standalone unstatused and explicitly status-colored quantity items to the mounted fixture model. Assert that the rendered reset text and unstatused quantity text both use `#888888`, and assert that the semantic status override still wins.

- [x] **Step 2: Run the focused mounted test and verify RED**

Run:

```bash
node tests/compile-presentation.mjs && node --test tests/presentation-mounted.test.mjs
```

Expected: FAIL because timer and unstatused quantity text currently render with `fg` unset instead of the theme's muted color.

- [x] **Step 3: Default mounted timer and quantity text to the muted theme**

In `MountedItem()` in `tui/presentation/renderer.tsx`, use the item's explicit status color when present and otherwise use `props.theme().textMuted` for standalone quantity text, timer text, and timer detail text. Do not change progress labels, provider headers, tables, or explicitly status-colored items.

- [x] **Step 4: Run focused tests and typechecking to verify GREEN**

Run:

```bash
node tests/compile-presentation.mjs && node --test tests/presentation-mounted.test.mjs tests/presentation-render-model.test.mjs && npm run typecheck
```

Expected: all focused tests PASS and TypeScript exits `0`.

- [x] **Step 5: Commit the muted metadata correction**

```bash
git add tui/presentation/renderer.tsx tests/presentation-mounted.test.mjs
git commit -m "fix(tui): dim quota metadata"
```

### Task 8: Verify, Build, Deploy, And Manually Exercise The Plugin

**Files:**
- Verify only: all files changed in Tasks 1-6
- Generated by build: `dist/opencode-tools-shared.js`, `dist/opencode-tools-quota.js`, `dist/plugins/opencode-tools-tokens.js`
- Generated by local deploy: `.opencode/opencode-tools-shared.js`, `.opencode/opencode-tools-quota.js`, `.opencode/plugins/opencode-tools-tokens.js`, `.opencode/tui.json`

**Interfaces:**
- Consumes: all task interfaces and the three-artifact build contract.
- Produces: verification evidence only; no additional source behavior and no commit.

- [x] **Step 1: Run the focused regression set once from a clean test compilation**

Run:

```bash
node tests/compile-presentation.mjs && node --test tests/presentation-layout.test.mjs tests/presentation-render-model.test.mjs tests/presentation-mounted.test.mjs tests/quota-composition.test.mjs tests/provider-openai.test.mjs tests/provider-zai.test.mjs
```

Expected: all focused tests PASS with `fail 0`.

- [x] **Step 2: Run static typechecking**

Run:

```bash
npm run typecheck
```

Expected: `tsc --noEmit` exits `0` with no diagnostics.

- [x] **Step 3: Run the complete automated suite**

Run:

```bash
npm test
```

Expected: both compile scripts and every `tests/*.test.mjs` test PASS with `fail 0`.

- [x] **Step 4: Build and validate all three production artifacts**

Run:

```bash
npm run build && node --test tests/plugin-build.test.mjs
```

Expected: build exits `0`; these files exist and are non-empty minified ESM: `dist/opencode-tools-shared.js`, `dist/opencode-tools-quota.js`, and `dist/plugins/opencode-tools-tokens.js`. Artifact tests PASS, including hermetic combined-TUI activation, host-owned Solid reactivity, lifecycle cleanup, and exported provider constructors.

- [x] **Step 5: Exercise idempotent deployment tests**

Run:

```bash
node --test tests/plugin-deploy.test.mjs
```

Expected: all deployment tests PASS, including option preservation and the exact three-artifact deployed layout.

- [x] **Step 6: Deploy locally**

Run:

```bash
npm run deploy:local
```

Expected: command exits `0` and prints `Deployed opencode-tools plugins to /Users/aam/Projects/priv/opencode-quota/.opencode`; `.opencode/tui.json` contains one managed `./opencode-tools-quota.js` entry and preserves unrelated entries.

- [x] **Step 7: Manually verify normal, constrained, and collapsed rendering in OpenCode**

Fully restart OpenCode from `/Users/aam/Projects/priv/opencode-quota`, open a session with quota data, and check all of the following:

```text
[ ] Expanded title begins with "▼ Quota" and a divider is immediately below it.
[ ] Every progress bar starts after the 3-cell label and its percentage remains at the right edge.
[ ] Narrowing the sidebar shrinks the bar before clipping the label or percentage; no 80-cell row overflows.
[ ] Reset rows begin with three spaces and do not repeat "5H reset:" or "7D reset:".
[ ] Provider status/detail is right-aligned; Z.AI shows colored Peak (3x) or Off-Peak (1x).
[ ] Z.AI tool quota/reset/count/table rows remain below the 5H and 7D windows.
[ ] Reset rows and Z.AI tool used/total quantities use the muted text color.
[ ] Collapsing shows "▶ Quota" with the active percentage summary colored and right-aligned.
```

- [x] **Step 8: Manually verify active-provider selection and OpenAI duration labels**

Switch the active session model from a Z.AI model to an OpenAI/Codex/ChatGPT model and back, waiting less than the polling interval after each switch:

```text
[ ] The newly selected provider refreshes immediately and moves above "Other providers".
[ ] All other ready/stale providers remain visible under "Other providers".
[ ] Provider headers retain provider/plan text and never include the selected model name.
[ ] An OpenAI primary response with limit_window_seconds=604800 renders one 7D group and no 5H group.
[ ] A multi-window OpenAI response labels each group from its own limit_window_seconds.
```

- [x] **Step 9: Manually verify default and custom polling**

First run with no `refreshIntervalSeconds`, then set the deployed quota entry option to `2.5`, redeploy/restart, and observe request timing using the host's network/debug output:

```text
[ ] With no option, each available non-exhausted provider polls approximately every 10 seconds.
[ ] Countdown text still changes every second.
[ ] With refreshIntervalSeconds=2.5, each available non-exhausted provider polls approximately every 2.5 seconds.
[ ] Exhausted primary quota still uses the existing 5-minute backoff.
[ ] Switching providers still causes an immediate refresh independent of polling.
```

Restore the desired local option after the timing check; do not commit generated local configuration unless it was already intentionally tracked for this change.

- [x] **Step 10: Inspect the final change range and worktree**

Run:

```bash
git diff --check 67c36679448d9b45890006ae2bf728241756c09b..HEAD && git status --short
```

Expected: `git diff --check` prints nothing and exits `0`. `git status --short` contains no unexpected source changes from verification; pre-existing unrelated deletions such as `task-7-report.md`, `task-9-report.md`, or `task-10-report.md` must remain untouched.

### Task 9: Dim Short Group Dividers And Redeploy

**Files:**
- Modify: `tests/presentation-mounted.test.mjs`
- Modify: `tui/presentation/renderer.tsx`
- Generated by build/deploy: the existing three production artifacts

**Interfaces:**
- Consumes: `PanelTheme.textMuted` in the mounted group-divider path.
- Produces: both `---` divider ends in the muted theme color without changing the flexible middle or full-width panel dividers.

- [x] **Step 1: Add a focused failing mounted divider-color assertion**

Extend the existing mounted group-divider test to assert that both `---` text elements use `#888888`. Cover both a divider between panel groups and a semantic divider item without changing their existing layout assertions.

- [x] **Step 2: Run the focused divider test and verify RED**

```bash
node tests/compile-presentation.mjs && node --test tests/presentation-mounted.test.mjs
```

Expected: FAIL because `GroupDivider` currently renders both `---` ends without `fg`.

- [x] **Step 3: Pass the theme into group dividers and apply `textMuted`**

Update `GroupDivider` to consume the renderer theme and set `fg={theme().textMuted}` on both `---` text elements. Pass the theme from both call sites: semantic divider items in `MountedItem` and inter-group dividers in `PanelRenderer`. Do not color full-width border dividers or alter divider sizing.

- [x] **Step 4: Run divider focused tests and typechecking to verify GREEN**

```bash
node tests/compile-presentation.mjs && node --test tests/presentation-mounted.test.mjs tests/presentation-render-model.test.mjs && npm run typecheck
```

Expected: all focused tests PASS and TypeScript exits `0`.

- [x] **Step 5: Commit the muted divider correction**

```bash
git add tui/presentation/renderer.tsx tests/presentation-mounted.test.mjs
git commit -m "fix(tui): dim quota dividers"
```

- [x] **Step 6: Rerun the full suite, build, and local deployment**

```bash
npm test && npm run build && node --test tests/plugin-build.test.mjs tests/plugin-deploy.test.mjs && npm run deploy:local
```

Expected: every command exits `0`, all three deployed artifacts match `dist`, and the worktree contains no unexpected source changes.

- [x] **Step 7: Manually validate muted short dividers**

Fully restart OpenCode and confirm every short `---` divider end uses the muted text color while the top/bottom full-width border dividers and surrounding content remain unchanged.

### Task 10: Make Mounted Compact Tables Parent-Responsive

**Files:**
- Modify: `tests/presentation-mounted.test.mjs:14-55,241`
- Modify: `tui/presentation/renderer.tsx:388-398`

**Interfaces:**
- Consumes: the existing normalized compact-table item `{ columns, rows, status }` produced by `normalizeItem()` and `PanelTheme` through `MountedItem(props: { item: NormalizedItem; theme: Accessor<PanelTheme> })`.
- Produces: mounted table rows with `width="100%"` and `overflow="hidden"`; each cell wrapper has `flexBasis={0}`, `flexGrow={1}`, `flexShrink={1}`, `minWidth={0}`, and `overflow="hidden"`, and its text has `wrapMode="none"` and `truncate={true}`.
- Produces: each native table row receives the cell boxes as a direct array expression, so `presentation-mounted.fixture.ts` observes three cell boxes in `row.props.children` rather than one nested `For` component.
- Preserves: `CompactTableAllocation`, `normalizePanelModel(model, { availableCells })`, `renderItemLayout()`, and `renderPanelLayout()` for deterministic pure tests.

- [x] **Step 1: Add the failing mounted three-column contraction test**

Append this test to `tests/presentation-mounted.test.mjs`; it uses the existing `limits` table in `model` and deliberately rejects any numeric width inherited from the 80-cell deterministic allocation:

```javascript
test("mounts compact tables as clipped non-wrapping parent-width flex rows", () => {
  const { elements, dispose } = mountPanel(model)

  try {
    const tableRows = elements.filter((element) =>
      element.type === "box"
      && element.props.width === "100%"
      && element.props.overflow === "hidden"
      && Array.isArray(element.props.children)
      && element.props.children.length === 3
      && element.props.children.every((child) => child?.type === "box"),
    )

    assert.equal(tableRows.length, 2, "header and data rows use responsive table layout")
    for (const row of tableRows) {
      for (const cell of row.props.children) {
        assert.equal(cell.props.flexBasis, 0)
        assert.equal(cell.props.flexGrow, 1)
        assert.equal(cell.props.flexShrink, 1)
        assert.equal(cell.props.minWidth, 0)
        assert.equal(cell.props.overflow, "hidden")
        assert.equal(typeof cell.props.width, "undefined")
        assert.equal(cell.props.children?.type, "text")
        assert.equal(cell.props.children?.props.wrapMode, "none")
        assert.equal(cell.props.children?.props.truncate, true)
        assert.equal(typeof cell.props.children?.props.width, "undefined")
      }
    }

    assert.deepEqual(
      tableRows[0].props.children.map((cell) => cell.props.children.props.children),
      ["Identity", "Model", "Remaining"],
    )
    assert.equal(tableRows[0].props.children[2].props.justifyContent, "flex-end")
    assert.equal(tableRows[1].props.children[2].props.children.props.fg, "#00ff00")
  } finally {
    dispose()
  }
})
```

- [x] **Step 2: Run the mounted renderer test and verify RED**

Run:

```bash
node tests/compile-presentation.mjs && node --test tests/presentation-mounted.test.mjs
```

Expected: FAIL at `tableRows.length` with `0 !== 2`, because the current mounted table branch calls `renderItemLayout()` and emits row boxes without `width="100%"` or clipping plus fixed-width `<text width={cell.width}>` children from the 80-cell fallback allocation.

- [x] **Step 3: Replace only the mounted table branch with flex cells**

Replace the `case "table"` branch in `MountedItem()` in `tui/presentation/renderer.tsx` with:

```tsx
    case "table": {
      const rows: { id: string; cells: { text: string; status?: PanelStatus }[] }[] = [
        {
          id: `${props.item.id}:header`,
          cells: props.item.columns.map((column) => ({ text: column.title })),
        },
        ...props.item.rows,
      ]
      return (
        <box flexDirection="column" width="100%">
          <For each={rows}>
            {(row) => (
              <box flexDirection="row" width="100%" overflow="hidden">
                {props.item.columns.map((column, index) => {
                  const cell = row.cells[index] ?? { text: "" }
                  return (
                    <box
                      flexBasis={0}
                      flexGrow={1}
                      flexShrink={1}
                      minWidth={0}
                      overflow="hidden"
                      justifyContent={column.align === "end" ? "flex-end" : "flex-start"}
                    >
                      <text
                        flexShrink={1}
                        wrapMode="none"
                        truncate={true}
                        fg={color(cell.status ?? props.item.status)}
                      >
                        {cell.text}
                      </text>
                    </box>
                  )
                })}
              </box>
            )}
          </For>
        </box>
      )
    }
```

The outer `For` retains reactive row reconciliation. The direct `columns.map(...)` expression emits the native row's cell children as an inspectable array while preserving exact column order, status fallback, clipping, non-wrapping, truncation, and right alignment. Do not remove `allocation` from `NormalizedItem`, change `normalizeItem()`, or change `renderItemLayout()`; those paths remain the deterministic pure-render contract.

- [x] **Step 4: Run focused mounted/pure tests and typechecking to verify GREEN**

Run:

```bash
node tests/compile-presentation.mjs && node --test tests/presentation-mounted.test.mjs tests/presentation-render-model.test.mjs tests/presentation-layout.test.mjs && npm run typecheck
```

Expected: all focused tests PASS, the new mounted test finds two responsive three-cell rows with no numeric cell widths, deterministic pure table tests still PASS, and TypeScript exits `0`.

- [x] **Step 5: Commit the mounted compact-table slice**

```bash
git add tui/presentation/renderer.tsx tests/presentation-mounted.test.mjs
git commit -m "fix(tui): make quota tables responsive"
```

### Task 11: Preserve Semantic Order Within Provider Group Boundaries

**Files:**
- Modify: `tests/quota-composition.test.mjs:502-594`
- Modify: `tui/quota.tsx:158-211`

**Interfaces:**
- Consumes: `sortByOrderThenId<T extends OrderedEntity>(items: readonly T[]): T[]`, `providerItemGroups(items: readonly PanelItem[])`, and the existing `orderedProviderItems(items, options, orderOffset)` status/display transformation.
- Produces: `providerItems(provider: QuotaProviderAdapter, options: NormalizedCompositionOptions, orderOffset: number): PanelItem[]` that processes `sortByOrderThenId(provider.panel().groups)` one group at a time and assigns one contiguous provider-local aggregate order range.
- Preserves: known-duration shortest-first ordering inside a group, unknown-duration source order after known durations, progress status/color behavior, selected-provider group boundaries, and secondary-provider divider IDs/orders.

- [x] **Step 1: Add a failing physically shuffled multi-group composition test**

Append this test after the existing provider grouping tests in `tests/quota-composition.test.mjs`:

```javascript
test("sorts semantic items and partitions each provider group independently", () => {
  const selected = provider({ id: "zai", title: "Z.AI", order: 110, primaryPct: 50 })
  const shuffled = provider({
    id: "alpha",
    title: "Alpha",
    order: 130,
    primaryPct: 70,
    groups: [
      {
        id: "alpha:later",
        order: 20,
        items: [
          { id: "alpha:5h-note", order: 30, kind: "text", text: "5H note" },
          { id: "alpha:5h", order: 20, kind: "progress", label: "5H", value: 70, total: 100 },
          { id: "alpha:later-preamble", order: 10, kind: "text", text: "Later group" },
        ],
      },
      {
        id: "alpha:earlier",
        order: 10,
        items: [
          { id: "alpha:7d-reset", order: 30, kind: "timer", label: "7D reset", state: "idle" },
          { id: "alpha:7d", order: 20, kind: "progress", label: "7D", value: 60, total: 100 },
          { id: "alpha:header", order: 10, kind: "header", title: "Alpha" },
        ],
      },
    ],
  })

  const model = composeQuotaPanel("zai", [selected, shuffled])
  const others = model.groups.find((group) => group.id === "other-providers")

  assert.deepEqual(others.items.map((entry) => entry.id), [
    "alpha:header",
    "alpha:7d",
    "alpha:7d-reset",
    "alpha:later-preamble",
    "alpha:5h",
    "alpha:5h-note",
  ])
  assert.deepEqual(others.items.map((entry) => entry.order), [0, 1, 2, 3, 4, 5])
})
```

Update the existing `orders configured secondary metrics by direction and keeps each header with its quota rows` expectation to preserve semantic group order rather than sorting windows across group boundaries:

```javascript
  assert.deepEqual(others.items.map((entry) => entry.id), [
    "alpha:header", "alpha:7D", "alpha:7D:reset", "alpha:5H", "alpha:5H:reset",
    "other-providers:gamma:divider",
    "gamma:header", "gamma:5H", "gamma:5H:reset", "gamma:7D", "gamma:7D:reset",
    "other-providers:beta:divider",
    "beta:header", "beta:5H", "beta:5H:reset", "beta:7D", "beta:7D:reset",
  ])
```

- [x] **Step 2: Run the composition test and verify RED**

Run:

```bash
node tests/compile-presentation.mjs && node --test tests/quota-composition.test.mjs
```

Expected: FAIL in both updated grouping assertions. The current `providerItemGroups()` trusts physical item order, while `providerItems()` flattens all sorted provider groups before partitioning, so the later group's preamble/details can attach to the earlier group's progress window and `5H` moves ahead of `7D` across group boundaries.

- [x] **Step 3: Sort before partitioning and compose each provider group locally**

Replace `providerItemGroups()` and `providerItems()` in `tui/quota.tsx` with:

```typescript
function providerItemGroups(items: readonly PanelItem[]): { preamble: PanelItem[]; groups: ProviderItemGroup[] } {
  const ordered = sortByOrderThenId(items)
  const firstProgress = ordered.findIndex((item) => item.kind === "progress")
  if (firstProgress < 0) return { preamble: ordered, groups: [] }

  const preamble = ordered.slice(0, firstProgress)
  const groups: ProviderItemGroup[] = []
  for (const item of ordered.slice(firstProgress)) {
    if (item.kind === "progress") {
      groups.push({
        items: [item],
        duration: windowDuration(item.label),
        sourceIndex: groups.length,
      })
    } else {
      groups.at(-1)!.items.push(item)
    }
  }
  return { preamble, groups }
}

function providerItems(provider: QuotaProviderAdapter, options: NormalizedCompositionOptions, orderOffset: number): PanelItem[] {
  const items: PanelItem[] = []
  for (const group of sortByOrderThenId(provider.panel().groups)) {
    items.push(...orderedProviderItems(group.items, options, orderOffset + items.length))
  }
  return items
}
```

Keep `orderedProviderItems()` unchanged: it still sorts known durations only among the progress-led groups produced from one panel group, retains unknown source order, applies display mode/status after grouping, and assigns contiguous orders from the supplied offset.

- [x] **Step 4: Run composition/provider tests and typechecking to verify GREEN**

Run:

```bash
node tests/compile-presentation.mjs && node --test tests/quota-composition.test.mjs tests/provider-openai.test.mjs tests/provider-zai.test.mjs tests/provider-opencode-go.test.mjs && npm run typecheck
```

Expected: all focused tests PASS. Physically shuffled items follow semantic order, each provider group retains its own preamble/details, known and unknown ordering still works within one group, secondary provider dividers remain correctly placed, and TypeScript exits `0`.

- [x] **Step 5: Commit the group-local composition slice**

```bash
git add tui/quota.tsx tests/quota-composition.test.mjs
git commit -m "fix(tui): preserve provider group boundaries"
```

### Task 12: Render Compatible Segmented Provider-Header Details

**Files:**
- Modify: `tests/presentation-types.fixture.ts:13-18`
- Test: `tests/presentation-types.test.mjs:14-28`
- Modify: `tests/presentation-render-model.test.mjs:201`
- Modify: `tests/presentation-mounted.test.mjs:241`
- Modify: `tui/presentation/types.ts:7-40`
- Modify: `tui/presentation/renderer.tsx:5,28-43,118-124,227-234,339-355`

**Interfaces:**
- Consumes: `PanelStatus = "error" | "warning" | "success" | "text" | "textMuted"`, the existing header `detail?: string`, `PanelTheme`, and deterministic `renderPanelLayout()`.
- Produces: `export type PanelTextSegment = { text: string; status?: PanelStatus }` and optional header field `detailSegments?: readonly PanelTextSegment[]` without removing or changing `detail?: string`.
- Produces: normalized ordered segment copies; mounted right-edge segments colored by their own status; pure header text formed from `detailSegments.map(({ text }) => text).join("")` when segments exist, otherwise the existing detail string.
- Preserves: every ordinary single-string provider detail, its item-level status color, provider-title flex growth, and all existing `PanelItem` callers.

- [x] **Step 1: Add failing semantic, pure-render, and mounted segment tests**

Add an ordinary detail and a segmented detail item to `tests/presentation-types.fixture.ts`:

```typescript
        { id: "account", order: 10, kind: "header", title: "Primary account", detail: "Ready", status: "success" },
        {
          id: "stale-account",
          order: 11,
          kind: "header",
          title: "Z.AI: Max",
          detailSegments: [
            { text: "Off-Peak (1x)", status: "success" },
            { text: " / ", status: "textMuted" },
            { text: "stale", status: "warning" },
          ],
        },
```

Append this deterministic normalization/rendering test to `tests/presentation-render-model.test.mjs`:

```javascript
test("normalizes ordered header detail segments and keeps pure text readable", () => {
  const model = {
    id: "quota",
    order: 10,
    title: "Quota",
    groups: [{
      id: "providers",
      order: 10,
      items: [
        { id: "ordinary", order: 10, kind: "header", title: "Ordinary", detail: "Limited", status: "error" },
        {
          id: "openai",
          order: 20,
          kind: "header",
          title: "OpenAI: Pro",
          detailSegments: [{ text: "stale", status: "warning" }],
        },
        {
          id: "zai",
          order: 30,
          kind: "header",
          title: "Z.AI: Max",
          detailSegments: [
            { text: "Off-Peak (1x)", status: "success" },
            { text: " / ", status: "textMuted" },
            { text: "stale", status: "warning" },
          ],
        },
      ],
    }],
  }

  const normalized = normalizePanelModel(model)
  assert.deepEqual(normalized.groups[0].items[2].detailSegments, [
    { text: "Off-Peak (1x)", status: "success" },
    { text: " / ", status: "textMuted" },
    { text: "stale", status: "warning" },
  ])
  assert.deepEqual(
    renderPanelLayout(model).groups[0].items.map((entry) => entry.text),
    ["Ordinary: Limited", "OpenAI: Pro: stale", "Z.AI: Max: Off-Peak (1x) / stale"],
  )
})
```

Append this mounted compatibility/color test to `tests/presentation-mounted.test.mjs`:

```javascript
test("mounts ordinary and segmented provider-header details at the right edge", () => {
  const headerModel = {
    id: "quota",
    order: 10,
    title: "Quota",
    groups: [{
      id: "providers",
      order: 10,
      items: [
        { id: "ordinary", order: 10, kind: "header", title: "Ordinary", detail: "Limited", status: "error" },
        { id: "openai", order: 20, kind: "header", title: "OpenAI: Pro", detailSegments: [{ text: "stale", status: "warning" }] },
        {
          id: "zai-peak",
          order: 30,
          kind: "header",
          title: "Z.AI: Max",
          detailSegments: [
            { text: "Peak (3x)", status: "error" },
            { text: " / ", status: "textMuted" },
            { text: "stale", status: "warning" },
          ],
        },
        {
          id: "zai-off-peak",
          order: 40,
          kind: "header",
          title: "Z.AI: Pro",
          detailSegments: [
            { text: "Off-Peak (1x)", status: "success" },
            { text: " / ", status: "textMuted" },
            { text: "stale", status: "warning" },
          ],
        },
      ],
    }],
  }
  const { elements, dispose } = mountPanel(headerModel)
  const details = elements
    .filter((element) => element.type === "text")
    .filter((element) => ["Limited", "stale", "Peak (3x)", " / ", "Off-Peak (1x)"].includes(element.props.children))

  try {
    assert.deepEqual(details.map((element) => [element.props.children, element.props.fg]), [
      ["Limited", "#ff0000"],
      ["stale", "#ffaa00"],
      ["Peak (3x)", "#ff0000"],
      [" / ", "#888888"],
      ["stale", "#ffaa00"],
      ["Off-Peak (1x)", "#00ff00"],
      [" / ", "#888888"],
      ["stale", "#ffaa00"],
    ])
    const titles = elements.filter((element) =>
      element.type === "text"
      && ["Ordinary", "OpenAI: Pro", "Z.AI: Max", "Z.AI: Pro"].includes(element.props.children))
    assert.ok(titles.every((element) => element.props.flexBasis === 0 && element.props.flexGrow === 1))
  } finally {
    dispose()
  }
})
```

- [x] **Step 2: Run segmented header tests and verify RED**

Run:

```bash
node tests/compile-presentation.mjs && node --test tests/presentation-types.test.mjs tests/presentation-render-model.test.mjs tests/presentation-mounted.test.mjs
```

Expected: FAIL first in `typechecks a semantic panel model fixture` because TypeScript reports that `detailSegments` does not exist on the header `PanelItem`; pure normalization drops the segments, and mounted rendering emits none of the independently colored segment text.

- [x] **Step 3: Add the compatible semantic segment type and normalize it**

Add the type after `PanelStatus` in `tui/presentation/types.ts` and extend only the header variant:

```typescript
export type PanelTextSegment = {
  text: string
  status?: PanelStatus
}

export type PanelItem =
  | (PanelItemBase & { kind: "divider" })
  | (PanelItemBase & {
      kind: "header"
      title: string
      detail?: string
      detailSegments?: readonly PanelTextSegment[]
    })
```

Keep all remaining `PanelItem` variants unchanged. Add `PanelTextSegment` to the type import in `tui/presentation/renderer.tsx`, then change the normalized header variant and header normalization case to:

```typescript
  | {
      id: string
      kind: "header"
      title: string
      detail?: string
      detailSegments?: PanelTextSegment[]
      status?: PanelStatus
    }
```

```typescript
    case "header":
      return {
        id: item.id,
        kind: item.kind,
        title: item.title,
        detail: item.detail,
        detailSegments: item.detailSegments?.map((segment) => ({ ...segment })),
        status: item.status,
      }
```

- [x] **Step 4: Preserve readable deterministic header text**

Replace only the header case in `renderItemLayout()`:

```typescript
    case "header": {
      const detail = item.detailSegments?.length
        ? item.detailSegments.map((segment) => segment.text).join("")
        : item.detail
      return {
        kind: item.kind,
        text: detail ? `${item.title}: ${detail}` : item.title,
        status: item.status,
      }
    }
```

This deliberately keeps pure rendering as one deterministic readable string; per-segment colors are a mounted-only concern.

- [x] **Step 5: Mount ordered independently colored segments with string fallback**

Replace only the header case in `MountedItem()`:

```tsx
    case "header":
      return (
        <box flexDirection="row" width="100%">
          <text flexBasis={0} flexGrow={1}>{props.item.title}</text>
          <Show when={!props.item.detailSegments?.length ? props.item.detail : undefined}>
            {(detail) => <text fg={color(props.item.status)}>{detail()}</text>}
          </Show>
          <Show when={props.item.detailSegments?.length ? props.item.detailSegments : undefined}>
            {(segments) => (
              <box flexDirection="row">
                <For each={segments()}>
                  {(segment) => <text fg={color(segment.status)}>{segment.text}</text>}
                </For>
              </box>
            )}
          </Show>
        </box>
      )
```

Do not synthesize separators or statuses in the renderer; providers supply exact ordered text segments. If both fields are present, non-empty `detailSegments` is mounted/pure display input and `detail` remains compatible stored data.

- [x] **Step 6: Run segmented header tests and typechecking to verify GREEN**

Run:

```bash
node tests/compile-presentation.mjs && node --test tests/presentation-types.test.mjs tests/presentation-render-model.test.mjs tests/presentation-mounted.test.mjs && npm run typecheck
```

Expected: all focused tests PASS; ordinary `detail` remains one item-status-colored right-edge string, ordered segments retain their own colors, pure output is readable, and TypeScript exits `0`.

- [x] **Step 7: Commit the compatible segmented-header slice**

```bash
git add tui/presentation/types.ts tui/presentation/renderer.tsx tests/presentation-types.fixture.ts tests/presentation-render-model.test.mjs tests/presentation-mounted.test.mjs
git commit -m "fix(tui): support segmented header details"
```

### Task 13: Make OpenAI Credential Replacement And Disposal Request-Safe

**Files:**
- Create: `tests/provider-lifecycle.fixture.ts`
- Modify: `tests/compile-presentation.mjs:4-20`
- Modify: `tests/provider-openai.test.mjs`
- Modify: `tests/presentation-mounted.test.mjs`
- Modify: `tui/providers/openai.ts:149-260,284-403`

**Interfaces:**
- Consumes: Task 12's `PanelTextSegment`/`detailSegments`, reactive `api.state.provider`, `OpenAiAuthEntry`, existing `refresh(): Promise<void>`, reset-boundary queueing, and `FETCH_TIMEOUT_MS = 20_000`.
- Produces: `fetchOpenAiQuota(auth: OpenAiAuthEntry, signal?: AbortSignal): Promise<OpenAiQuotaData | null>`; callers that omit `signal` retain the helper-owned 20-second timeout, while the adapter passes its owned signal and tracks/clears the corresponding timeout.
- Produces: adapter-local `credentialGeneration: number` and one `activeRequest` record containing the generation, `AbortController`, timeout, and request promise.
- Produces: atomic `quotaState: { data: OpenAiQuotaData; generation: number } | null`, generation-tagged pending/refreshed boundary markers, and synchronous old-boundary cancellation on credential transition.
- Produces: stale cached OpenAI header `detailSegments: [{ text: "stale", status: "warning" }]`, mounted as yellow right-edge text, with no `openai:stale` item.
- Produces for Task 14: `.tmp-test/provider-lifecycle.mjs`, browser-conditioned from one test-only TypeScript entry that imports `createSignal`, `createOpenAiProvider`, and `createZaiProvider`; each exported constructor returns its adapter and a same-runtime credential setter.
- Preserves: one in-flight request per credential generation, polling/backoff, stale expiry, reset-boundary queueing, direct `fetchOpenAiQuota({ access })` callers, and the public `QuotaProviderAdapter` signature.

- [x] **Step 1: Add the shared browser-conditioned provider lifecycle fixture**

Create `tests/provider-lifecycle.fixture.ts` so each reactive signal and the provider constructor that observes it are bundled into the same browser-conditioned Solid runtime:

```typescript
import type { TuiPluginApi } from "@opencode-ai/plugin/tui"
import { createSignal } from "solid-js"

import { createOpenAiProvider } from "../tui/providers/openai.js"
import type { QuotaProviderAdapter, QuotaProviderOptions } from "../tui/providers/types.js"
import { createZaiProvider } from "../tui/providers/zai.js"

type ReactiveProvider = {
  adapter: QuotaProviderAdapter
  setCredential(key: string | null): void
}

function reactiveProviderApi(providerID: string, initialKey: string | null): {
  api: TuiPluginApi
  setCredential(key: string | null): void
} {
  const [providers, setProviders] = createSignal(
    initialKey ? [{ id: providerID, key: initialKey }] : [],
  )
  const api = {
    state: {
      get provider() {
        return providers()
      },
      session: { messages: () => [] },
      part: () => [],
    },
    kv: { get: () => undefined, set: () => undefined },
  } as unknown as TuiPluginApi

  return {
    api,
    setCredential(key: string | null): void {
      setProviders(key ? [{ id: providerID, key }] : [])
    },
  }
}

export function createReactiveOpenAiAdapter(
  initialKey: string | null,
  options: QuotaProviderOptions = {},
): ReactiveProvider {
  const host = reactiveProviderApi("openai", initialKey)
  return {
    adapter: createOpenAiProvider(host.api, options),
    setCredential: host.setCredential,
  }
}

export function createReactiveZaiAdapter(
  initialKey: string | null,
  options: QuotaProviderOptions = {},
): ReactiveProvider {
  const host = reactiveProviderApi("zai-coding-plan", initialKey)
  return {
    adapter: createZaiProvider(host.api, options),
    setCredential: host.setCredential,
  }
}
```

Update both arrays in `tests/compile-presentation.mjs`. Add `"provider-lifecycle"` to the cleanup names:

```javascript
for (const name of ["presentation-types", "presentation-format", "presentation-layout", "presentation-renderer", "presentation-mounted", "provider-zai", "provider-openai", "provider-opencode-go", "provider-lifecycle", "quota-composition", "quota-selection", "home-composition"]) {
  rmSync(`.tmp-test/${name}.mjs`, { force: true })
}
```

Add this exact browser-conditioned compile row after the three direct provider rows:

```javascript
  ["tests/provider-lifecycle.fixture.ts", ".tmp-test/provider-lifecycle.mjs", ["browser"]],
```

In `tests/provider-openai.test.mjs`, keep the direct provider import for mapping/fetch tests and add:

```javascript
const { createReactiveOpenAiAdapter } = await import("../.tmp-test/provider-lifecycle.mjs")
```

Add this wrapper after `createTestAdapter()`; it installs fetch before provider construction and follows the existing disposal/global-restoration order:

```javascript
function createReactiveTestAdapter(t, {
  initialKey = "test-token",
  fetch: testFetch,
  clock,
  providerOptions,
} = {}) {
  const originalFetch = globalThis.fetch
  if (testFetch) globalThis.fetch = testFetch
  const reactive = createReactiveOpenAiAdapter(initialKey, providerOptions)
  t.after(async () => {
    try {
      reactive.adapter.dispose()
      await flushEffects()
    } finally {
      globalThis.fetch = originalFetch
      clock?.restore()
    }
  })
  return reactive
}
```

Keep the deferred request queue in the Node test because it owns no Solid reactive state:

```javascript
function deferredRequests() {
  const requests = []
  return {
    requests,
    fetch: async (_url, options) => {
      let resolve
      let reject
      const promise = new Promise((resolvePromise, rejectPromise) => {
        resolve = resolvePromise
        reject = rejectPromise
      })
      requests.push({
        authorization: options.headers.Authorization,
        signal: options.signal,
        resolve,
        reject,
      })
      return promise
    },
  }
}
```

- [x] **Step 2: Add failing OpenAI stale-header, replacement-boundary, abort-log, removal, and disposal tests**

Replace the stale model assertion in `tests/provider-openai.test.mjs` with:

```javascript
test("retains OpenAI quota with one warning stale header segment", () => {
  const model = mapOpenAiPanelState({ phase: "stale", data: quota({ limitReached: true }), now })

  assert.equal(item(model, "openai:18000s-primary").value, 75)
  assert.deepEqual(item(model, "openai:header"), {
    id: "openai:header",
    order: 10,
    kind: "header",
    title: "OpenAI: Plus",
    detailSegments: [{ text: "stale", status: "warning" }],
  })
  assert.deepEqual(item(model, "openai:limited"), {
    id: "openai:limited",
    order: 15,
    kind: "text",
    text: "Limited",
    status: "error",
  })
  assert.equal(item(model, "openai:stale"), undefined)
})
```

Append this exact mounted provider-model test to `tests/presentation-mounted.test.mjs`, adding `mapOpenAiPanelState` to the top-level compiled-module imports:

```javascript
const { mapOpenAiPanelState } = await import("../.tmp-test/provider-openai.mjs")

test("mounts stale OpenAI state as warning text in the provider header", () => {
  const staleModel = mapOpenAiPanelState({
    phase: "stale",
    now: Date.UTC(2026, 6, 13, 6, 0, 0),
    data: {
      planType: "Pro Lite",
      primary: { used_percent: 54, limit_window_seconds: 604_800, reset_after_seconds: 3_600 },
      secondary: null,
      codeReview: null,
      limitReached: false,
      creditsBalance: null,
      creditsUnlimited: false,
    },
  })
  const { elements, dispose } = mountPanel(staleModel)
  const text = elements.filter((element) => element.type === "text")

  try {
    const title = text.find((element) => element.props.children === "OpenAI: Pro Lite")
    const stale = text.find((element) => element.props.children === "stale")
    assert.equal(title?.props.flexBasis, 0)
    assert.equal(title?.props.flexGrow, 1)
    assert.equal(stale?.props.fg, "#ffaa00")
    assert.equal(text.some((element) => element.props.children === "~stale"), false)
  } finally {
    dispose()
  }
})
```

Append this abort-control-flow diagnostic test to `tests/provider-openai.test.mjs`:

```javascript
test("suppresses expected OpenAI abort logs but diagnoses non-abort failures", async (t) => {
  const originalFetch = globalThis.fetch
  const originalError = console.error
  const errors = []
  console.error = (...args) => errors.push(args)
  t.after(() => {
    globalThis.fetch = originalFetch
    console.error = originalError
  })

  globalThis.fetch = async (_url, options) => new Promise((_resolve, reject) => {
    options.signal.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")), { once: true })
  })
  const controller = new AbortController()
  const aborted = fetchOpenAiQuota({ access: "token" }, controller.signal)
  controller.abort()
  assert.equal(await aborted, null)
  assert.equal(errors.length, 0)

  globalThis.fetch = async () => {
    throw new Error("transport failed")
  }
  assert.equal(await fetchOpenAiQuota({ access: "token" }, new AbortController().signal), null)
  assert.equal(errors.length, 1)
  assert.equal(errors[0][0], "[quota-openai] fetchQuota error:")
})
```

Append these lifecycle tests after the existing disposal tests:

```javascript
test("replaces OpenAI credentials without publishing the old generation", async (t) => {
  const pending = deferredRequests()
  const { adapter, setCredential } = createReactiveTestAdapter(t, {
    initialKey: "token-a",
    fetch: pending.fetch,
  })
  await flushEffects()

  pending.requests[0].resolve(quotaResponse(window({ used_percent: 25 })))
  await flushEffects()
  assert.equal(adapter.freshness(), "ready")
  assert.equal(item(adapter.panel(), "openai:18000s-primary").value, 75)

  void adapter.refresh()
  await flushEffects()
  assert.equal(pending.requests.length, 2)
  setCredential("token-b")
  await flushEffects()

  assert.equal(pending.requests[1].signal.aborted, true)
  assert.equal(pending.requests.length, 3, "one replacement request starts")
  assert.equal(pending.requests[2].authorization, "Bearer token-b")
  assert.equal(adapter.freshness(), "stale")
  assert.equal(item(adapter.panel(), "openai:18000s-primary").value, 75)
  assert.deepEqual(item(adapter.panel(), "openai:header").detailSegments, [
    { text: "stale", status: "warning" },
  ])
  assert.equal(item(adapter.panel(), "openai:stale"), undefined)

  pending.requests[1].resolve(quotaResponse(window({ used_percent: 99 })))
  await flushEffects()
  assert.equal(adapter.freshness(), "stale")
  assert.equal(item(adapter.panel(), "openai:18000s-primary").value, 75)

  pending.requests[2].resolve(quotaResponse(window({ used_percent: 40 })))
  await flushEffects()
  assert.equal(adapter.freshness(), "ready")
  assert.equal(item(adapter.panel(), "openai:18000s-primary").value, 60)

  void adapter.refresh()
  await flushEffects()
  setCredential("token-c")
  await flushEffects()
  assert.equal(pending.requests[3].signal.aborted, true)
  assert.equal(pending.requests.length, 5, "one failed replacement request starts")
  pending.requests[4].resolve({ ok: false, status: 503 })
  await flushEffects()
  assert.equal(adapter.freshness(), "stale")
  assert.equal(item(adapter.panel(), "openai:18000s-primary").value, 60)
  assert.deepEqual(item(adapter.panel(), "openai:header").detailSegments, [
    { text: "stale", status: "warning" },
  ])
  assert.equal(item(adapter.panel(), "openai:stale"), undefined)

  pending.requests[3].resolve(quotaResponse(window({ used_percent: 10 })))
  await flushEffects()
  assert.equal(item(adapter.panel(), "openai:18000s-primary").value, 60)

  setCredential(null)
  await flushEffects()
  assert.equal(adapter.freshness(), "unavailable")
  assert.equal(item(adapter.panel(), "openai:18000s-primary"), undefined)
  assert.equal(item(adapter.panel(), "openai:header").detail, "No ChatGPT account linked")
})

test("does not carry an OpenAI reset boundary into a replacement generation", async (t) => {
  const clock = installFakeClock(now)
  const oldResetAt = now + 15 * 60 * 1_000
  const pending = deferredRequests()
  const { adapter, setCredential } = createReactiveTestAdapter(t, {
    initialKey: "token-a",
    fetch: pending.fetch,
    clock,
  })
  await flushEffects()

  pending.requests[0].resolve(quotaResponse(window({ reset_at: oldResetAt / 1_000 })))
  await flushEffects()
  const oldBoundary = clock.timeouts.find((timer) =>
    timer.active && timer.delay === oldResetAt - now)
  assert.ok(oldBoundary)

  setCredential("token-b")
  await flushEffects()
  assert.equal(oldBoundary.active, false, "replacement synchronously clears the old boundary")
  assert.equal(pending.requests.length, 2, "exactly one replacement request starts")

  clock.advance(oldResetAt - now)
  oldBoundary.callback()
  await flushEffects()
  assert.equal(pending.requests.length, 2, "the old callback cannot queue a replacement follow-up")

  pending.requests[1].resolve(quotaResponse(window({ reset_at: (oldResetAt + 60 * 60 * 1_000) / 1_000 })))
  await flushEffects()
  assert.equal(pending.requests.length, 2, "settlement cannot consume an old-generation boundary")
  assert.equal(adapter.freshness(), "ready")
  assert.ok(clock.timeouts.some((timer) => timer.active && timer.delay === 60 * 60 * 1_000))
})

test("aborts and clears the OpenAI request timeout immediately on dispose", async (t) => {
  const clock = installFakeClock(now)
  const pending = deferredRequests()
  const adapter = createTestAdapter(t, { clock, fetch: pending.fetch })
  await flushEffects()

  const requestTimeout = clock.timeouts.find((timer) => timer.active && timer.delay === 20_000)
  assert.ok(requestTimeout)
  const stateAtDispose = observableState(adapter)
  adapter.dispose()

  assert.equal(pending.requests[0].signal.aborted, true)
  assert.equal(requestTimeout.active, false)
  pending.requests[0].resolve(quotaResponse(window({ used_percent: 5 })))
  await flushEffects()
  assert.deepEqual(observableState(adapter), stateAtDispose)
})
```

Retain the existing `queues one OpenAI reset-boundary refresh behind an older request` test unchanged. Its same-generation ordering remains required: after the boundary callback, `requests` stays `2`; after `resolvePending(...)` and `flushEffects()`, `requests` becomes exactly `3`.

- [x] **Step 3: Run the OpenAI provider test and verify RED**

Run:

```bash
node tests/compile-presentation.mjs && node --test tests/provider-openai.test.mjs tests/presentation-mounted.test.mjs
```

Expected: compilation creates `.tmp-test/provider-lifecycle.mjs` successfully, proving the fixture uses the real browser-conditioned bundle. Tests then FAIL because stale mapping/abort/disposal behavior is absent and `oldBoundary.active` remains `true` after replacement; invoking that old callback while the replacement is pending can populate the unowned numeric `pendingBoundary` and produce an extra request after settlement.

- [x] **Step 4: Allow adapter-owned signals without changing direct fetch callers**

Replace `fetchOpenAiQuota()` in `tui/providers/openai.ts` with:

```typescript
export async function fetchOpenAiQuota(auth: OpenAiAuthEntry, signal?: AbortSignal): Promise<OpenAiQuotaData | null> {
  const accessToken = auth.access
  if (!accessToken) return null
  if (auth.expires && auth.expires < Date.now()) {
    console.error("[quota-openai] Token expired")
    return null
  }

  const ownedController = signal ? null : new AbortController()
  const requestSignal = signal ?? ownedController!.signal
  const timeout = ownedController
    ? setTimeout(() => ownedController.abort(), FETCH_TIMEOUT_MS)
    : null
  try {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": USER_AGENT,
    }
    const accountId = auth.accountId || decodeJwtAccountId(accessToken)
    if (accountId) headers["ChatGPT-Account-Id"] = accountId

    const response = await fetch(OPENAI_USAGE_URL, { headers, signal: requestSignal })
    if (!response.ok) {
      console.error(`[quota-openai] API returned ${response.status}`)
      return null
    }
    const data = await response.json() as UsageResponse
    const primary = data.rate_limit?.primary_window
    if (!primary) {
      console.error("[quota-openai] No primary rate limit window")
      return null
    }
    return {
      planType: derivePlanLabel(data.plan_type),
      primary,
      secondary: data.rate_limit?.secondary_window ?? null,
      codeReview: data.code_review_rate_limit?.primary_window ?? null,
      limitReached: Boolean(data.rate_limit?.limit_reached),
      creditsBalance: data.credits?.balance ?? null,
      creditsUnlimited: Boolean(data.credits?.unlimited),
    }
  } catch (error) {
    if (!requestSignal.aborted) console.error("[quota-openai] fetchQuota error:", error)
    return null
  } finally {
    if (timeout) clearTimeout(timeout)
  }
}
```

- [x] **Step 5: Add OpenAI stale-header mapping, generation ownership, and credential transitions**

Add `PanelTextSegment` to the type import from `tui/presentation/types.ts`. Replace the OpenAI `header()` helper and ready/stale mapping branch so stale state uses Task 12's exact optional field and never creates a standalone row:

```typescript
function header(title: string, detail?: string, detailSegments?: readonly PanelTextSegment[]): PanelItem {
  return {
    id: "openai:header",
    order: 10,
    kind: "header",
    title,
    ...(detail ? { detail } : {}),
    ...(detailSegments?.length ? { detailSegments } : {}),
  }
}
```

```typescript
  else {
    items.push(header(
      `OpenAI: ${data.planType}`,
      undefined,
      state.phase === "stale" ? [{ text: "stale", status: "warning" }] : undefined,
    ))
    if (data.limitReached) items.push({ id: "openai:limited", order: 15, kind: "text", text: "Limited", status: "error" })
    items.push(...quotaItems("primary", 20, data.primary, now))
    if (data.secondary) items.push(...quotaItems("secondary", 50, data.secondary, now))
  }
```

Then initialize `auth` to `null` and replace the current quota/request/boundary bookkeeping, `refresh()`, and credential effects with the following exact block. One combined discovery/transition effect owns credential change ordering, while `quotaState` atomically associates data with its publishing generation.

```typescript
    type PublishedQuota = { data: OpenAiQuotaData; generation: number }
    type GenerationBoundary = { epoch: number; generation: number }

    const [auth, setAuth] = createSignal<OpenAiAuthEntry | null>(null)
    const [quotaState, setQuotaState] = createSignal<PublishedQuota | null>(null)
    const quotaData = () => quotaState()?.data ?? null
    const [phase, setPhase] = createSignal<OpenAiPanelPhase>("loading")
    const [lastSuccessAt, setLastSuccessAt] = createSignal(0)
    const [now, setNow] = createSignal(Date.now())
    const [refreshedBoundary, setRefreshedBoundary] = createSignal<GenerationBoundary | null>(null)
    let refreshInFlight: Promise<void> | null = null
    let refreshStartedAt = 0
    let pendingBoundary: GenerationBoundary | null = null
    let credentialGeneration = 0
    let observedCredential: string | null | undefined
    let disposed = false
    let boundarySchedule: {
      timer: ReturnType<typeof setTimeout>
      generation: number
    } | null = null
    let activeRequest: {
      generation: number
      controller: AbortController
      timeout: ReturnType<typeof setTimeout>
      promise: Promise<void>
    } | null = null

    const clearBoundarySchedule = (): void => {
      const schedule = boundarySchedule
      boundarySchedule = null
      if (schedule) clearTimeout(schedule.timer)
      pendingBoundary = null
      setRefreshedBoundary(null)
    }

    const cancelActiveRequest = (): void => {
      const request = activeRequest
      if (!request) return
      activeRequest = null
      request.controller.abort()
      clearTimeout(request.timeout)
      if (refreshInFlight === request.promise) {
        refreshInFlight = null
        refreshStartedAt = 0
      }
    }

    const refresh = (): Promise<void> => {
      if (disposed) return Promise.resolve()
      if (refreshInFlight) return refreshInFlight
      const currentAuth = auth()
      if (!currentAuth?.access) {
        setPhase("unavailable")
        return Promise.resolve()
      }

      const generation = credentialGeneration
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
      const startedAt = Date.now()
      const request = (async () => {
        const data = await fetchOpenAiQuota(currentAuth, controller.signal)
        if (disposed || generation !== credentialGeneration) return
        if (data) {
          setQuotaState({ data, generation })
          setPhase("ready")
          setLastSuccessAt(Date.now())
        } else if (quotaData()) {
          setPhase("stale")
        } else {
          setPhase("unavailable")
        }
      })()
      refreshInFlight = request
      refreshStartedAt = startedAt
      activeRequest = { generation, controller, timeout, promise: request }
      const settled = () => {
        if (activeRequest?.promise === request) {
          clearTimeout(activeRequest.timeout)
          activeRequest = null
        }
        if (refreshInFlight !== request) return
        refreshInFlight = null
        refreshStartedAt = 0
        const queued = pendingBoundary
        if (disposed || generation !== credentialGeneration || queued?.generation !== generation) return
        pendingBoundary = null
        setRefreshedBoundary(queued)
        void refresh()
      }
      void request.then(settled, settled)
      return request
    }

    createEffect(() => {
      const next = findOpenAiAuthFromProviders(api.state.provider) ?? findOpenAiAuthFromFiles()
      const credential = next?.access
        ? `${next.access}\u0000${next.accountId ?? ""}`
        : null
      if (credential === observedCredential) return
      const replacingCredential = observedCredential !== undefined && observedCredential !== null
      observedCredential = credential
      credentialGeneration += 1
      clearBoundarySchedule()
      cancelActiveRequest()
      setAuth(next)

      if (!credential) {
        setQuotaState(null)
        setLastSuccessAt(0)
        setPhase("unavailable")
        return
      }
      setPhase(replacingCredential && quotaData() ? "stale" : "loading")
      void refresh()
    })
```

In the one-second stale-expiry tick, replace the existing quota clear with this atomic state clear and synchronous boundary cleanup:

```typescript
        setQuotaState(null)
        clearBoundarySchedule()
```

Replace the OpenAI reset-boundary effect completely:

```typescript
    createEffect(() => {
      const published = quotaState()
      if (!published || published.generation !== credentialGeneration) return
      const generation = published.generation
      const epoch = resetEpochMs(published.data.primary, now())
      const refreshed = refreshedBoundary()
      const pending = pendingBoundary
      if (
        epoch <= 0
        || (refreshed?.generation === generation && refreshed.epoch === epoch)
        || (pending?.generation === generation && pending.epoch === epoch)
      ) return

      const timer = setTimeout(() => {
        if (
          disposed
          || generation !== credentialGeneration
          || quotaState()?.generation !== generation
        ) return
        if (refreshInFlight && activeRequest?.generation === generation && refreshStartedAt < epoch) {
          pendingBoundary = { epoch, generation }
          return
        }
        setRefreshedBoundary({ epoch, generation })
        void refresh()
      }, Math.max(0, epoch - Date.now()))
      const schedule = { timer, generation }
      boundarySchedule = schedule
      unref(timer)
      onCleanup(() => {
        if (boundarySchedule !== schedule) return
        boundarySchedule = null
        clearTimeout(timer)
      })
    })
```

The callback captures the published generation, and credential transition increments `credentialGeneration` before `clearBoundarySchedule()`. Therefore even an already-queued callback is inert, while effect cleanup and the explicit timer reference synchronously remove the normal schedule. Replace the returned adapter's `dispose()` body with:

```typescript
      dispose(): void {
        if (disposed) return
        disposed = true
        credentialGeneration += 1
        clearBoundarySchedule()
        cancelActiveRequest()
        dispose()
      },
```

- [x] **Step 6: Run OpenAI lifecycle and boundary tests to verify GREEN**

Run:

```bash
node tests/compile-presentation.mjs && node --test tests/provider-openai.test.mjs tests/presentation-mounted.test.mjs tests/quota-composition.test.mjs && npm run typecheck
```

Expected: all focused tests PASS. The fixture-driven setter is observed by the bundled OpenAI constructor; replacement clears the old boundary and starts exactly one request even when that request spans the old reset epoch; its success schedules a new-generation boundary; the existing same-generation test still queues exactly one follow-up; stale headers, silent aborts, retained diagnostics, removal, disposal, and timeout cleanup pass; TypeScript exits `0`.

- [x] **Step 7: Commit the OpenAI lifecycle slice**

```bash
git add tui/providers/openai.ts tests/provider-openai.test.mjs tests/presentation-mounted.test.mjs tests/provider-lifecycle.fixture.ts tests/compile-presentation.mjs
git commit -m "fix(tui): secure OpenAI credential lifecycle"
```

### Task 14: Make Z.AI Credential Replacement And Disposal Request-Safe

**Files:**
- Test: `tests/provider-lifecycle.fixture.ts`
- Modify: `tests/provider-zai.test.mjs`
- Modify: `tests/presentation-mounted.test.mjs`
- Modify: `tui/providers/zai.ts:200-363,387-551`

**Interfaces:**
- Consumes: Task 12's `PanelTextSegment`/`detailSegments`, Task 13's browser-conditioned `createReactiveZaiAdapter()` fixture export, existing Z.AI file/provider key discovery, `refresh(): Promise<void>`, heuristic/rate-limit fallback, reset-boundary queueing, and `FETCH_TIMEOUT_MS = 20_000`.
- Produces: `fetchZaiQuota(apiKey: string, signal?: AbortSignal): Promise<ZaiQuotaData | null>`; callers without a signal retain helper-owned timeout behavior, while the adapter owns the signal and tracked timeout used by its refresh state machine.
- Produces: Z.AI-local `credentialGeneration: number`, active controller/timeout/promise ownership, and generation-guarded publication; no state or coordinator is shared with OpenAI.
- Produces: atomic `quotaState: { data: ZaiQuotaData; generation: number } | null`, generation-tagged pending/refreshed boundary markers, and synchronous old-boundary/retry cleanup on credential transition.
- Produces: stale Z.AI `detailSegments` in exact order: colored Peak/Off-Peak, `textMuted` ` / `, warning `stale`; no `zai:stale` item.
- Preserves: Z.AI heuristic fallback when an initial authenticated fetch fails, retry/reset parsing, polling/backoff, stale expiry, reset-boundary queueing, and the public `QuotaProviderAdapter` signature.

- [ ] **Step 1: Bind Z.AI tests to the shared lifecycle fixture**

Keep the existing direct provider bundle import for mapping/fetch tests, add `fetchZaiQuota` to it, and import the Task 13 fixture export separately:

```javascript
const { createZaiProvider, fetchZaiQuota, mapZaiPanelState } = await import("../.tmp-test/provider-zai.mjs")
const { createReactiveZaiAdapter } = await import("../.tmp-test/provider-lifecycle.mjs")
```

Change the response helper so tests can distinguish published generations:

```javascript
function quotaResponse(nextResetTime = now + 60 * 60 * 1000, percentage = 25) {
  return {
    ok: true,
    json: async () => ({
      code: 200,
      data: {
        level: "pro",
        limits: [{ type: "TOKENS_LIMIT", unit: 3, percentage, nextResetTime }],
      },
    }),
  }
}
```

Add this wrapper after `createTestAdapter()`; no Node-test Solid import is allowed:

```javascript
function createReactiveTestAdapter(t, {
  initialKey = "test-key",
  fetch: testFetch,
  clock,
  providerOptions,
} = {}) {
  const originalFetch = globalThis.fetch
  if (testFetch) globalThis.fetch = testFetch
  const reactive = createReactiveZaiAdapter(initialKey, providerOptions)
  t.after(async () => {
    try {
      reactive.adapter.dispose()
      await flushEffects()
    } finally {
      globalThis.fetch = originalFetch
      clock?.restore()
    }
  })
  return reactive
}

function deferredRequests() {
  const requests = []
  return {
    requests,
    fetch: async (_url, options) => {
      let resolve
      let reject
      const promise = new Promise((resolvePromise, rejectPromise) => {
        resolve = resolvePromise
        reject = rejectPromise
      })
      requests.push({
        authorization: options.headers.Authorization,
        signal: options.signal,
        resolve,
        reject,
      })
      return promise
    },
  }
}
```

- [ ] **Step 2: Add failing Z.AI stale-header, replacement-boundary, abort-log, removal, and disposal tests**

Replace the existing stale model test in `tests/provider-zai.test.mjs` with:

```javascript
test("retains Z.AI quota with Peak and stale header segments", () => {
  const ready = mapZaiPanelState({ phase: "ready", data: quota(), now })
  const stale = mapZaiPanelState({ phase: "stale", data: quota(), now })

  assert.deepEqual(item(stale, "zai:5h"), item(ready, "zai:5h"))
  assert.deepEqual(item(stale, "zai:7d"), item(ready, "zai:7d"))
  assert.deepEqual(item(stale, "zai:header"), {
    id: "zai:header",
    order: 10,
    kind: "header",
    title: "Z.AI: Pro",
    detailSegments: [
      { text: "Peak (3x)", status: "error" },
      { text: " / ", status: "textMuted" },
      { text: "stale", status: "warning" },
    ],
  })
  assert.equal(item(stale, "zai:stale"), undefined)
})
```

Append this exact mounted provider-model test to `tests/presentation-mounted.test.mjs`, adding `mapZaiPanelState` to the top-level compiled-module imports:

```javascript
const { mapZaiPanelState } = await import("../.tmp-test/provider-zai.mjs")

test("mounts stale Z.AI state as colored Peak, separator, and stale header segments", () => {
  const staleModel = mapZaiPanelState({
    phase: "stale",
    now: Date.UTC(2026, 6, 13, 6, 0, 0),
    data: {
      level: "Max",
      tokenUsedPct: 25,
      tokenRemainingPct: 75,
      tokenNextResetEpoch: Date.UTC(2026, 6, 13, 7, 0, 0),
      tokenAbsolute: null,
      weeklyLimit: null,
      timeLimit: null,
    },
  })
  const { elements, dispose } = mountPanel(staleModel)
  const text = elements.filter((element) => element.type === "text")

  try {
    const title = text.find((element) => element.props.children === "Z.AI: Max")
    const segments = text.filter((element) => ["Peak (3x)", " / ", "stale"].includes(element.props.children))
    assert.equal(title?.props.flexBasis, 0)
    assert.equal(title?.props.flexGrow, 1)
    assert.deepEqual(segments.map((element) => [element.props.children, element.props.fg]), [
      ["Peak (3x)", "#ff0000"],
      [" / ", "#888888"],
      ["stale", "#ffaa00"],
    ])
    assert.equal(text.some((element) => element.props.children === "~stale"), false)
  } finally {
    dispose()
  }
})
```

Add `fetchZaiQuota` to the compiled provider import in `tests/provider-zai.test.mjs`, then append:

```javascript
test("suppresses expected Z.AI abort logs but diagnoses non-abort failures", async (t) => {
  const originalFetch = globalThis.fetch
  const originalError = console.error
  const errors = []
  console.error = (...args) => errors.push(args)
  t.after(() => {
    globalThis.fetch = originalFetch
    console.error = originalError
  })

  globalThis.fetch = async (_url, options) => new Promise((_resolve, reject) => {
    options.signal.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")), { once: true })
  })
  const controller = new AbortController()
  const aborted = fetchZaiQuota("key", controller.signal)
  controller.abort()
  assert.equal(await aborted, null)
  assert.equal(errors.length, 0)

  globalThis.fetch = async () => {
    throw new Error("transport failed")
  }
  assert.equal(await fetchZaiQuota("key", new AbortController().signal), null)
  assert.equal(errors.length, 1)
  assert.equal(errors[0][0], "[quota-zai] fetchQuota error:")
})
```

Append these lifecycle tests after the current disposal tests:

```javascript
test("replaces Z.AI credentials without publishing the old generation", async (t) => {
  const pending = deferredRequests()
  const { adapter, setCredential } = createReactiveTestAdapter(t, {
    initialKey: "key-a",
    fetch: pending.fetch,
  })
  await flushEffects()

  pending.requests[0].resolve(quotaResponse(now + 3_600_000, 25))
  await flushEffects()
  assert.equal(adapter.freshness(), "ready")
  assert.equal(item(adapter.panel(), "zai:5h").value, 75)

  void adapter.refresh()
  await flushEffects()
  assert.equal(pending.requests.length, 2)
  setCredential("key-b")
  await flushEffects()

  assert.equal(pending.requests[1].signal.aborted, true)
  assert.equal(pending.requests.length, 3, "one replacement request starts")
  assert.equal(pending.requests[2].authorization, "Bearer key-b")
  assert.equal(adapter.freshness(), "stale")
  assert.equal(item(adapter.panel(), "zai:5h").value, 75)
  assert.deepEqual(item(adapter.panel(), "zai:header").detailSegments, [
    { text: "Peak (3x)", status: "error" },
    { text: " / ", status: "textMuted" },
    { text: "stale", status: "warning" },
  ])
  assert.equal(item(adapter.panel(), "zai:stale"), undefined)

  pending.requests[1].resolve(quotaResponse(now + 3_600_000, 99))
  await flushEffects()
  assert.equal(adapter.freshness(), "stale")
  assert.equal(item(adapter.panel(), "zai:5h").value, 75)

  pending.requests[2].resolve(quotaResponse(now + 3_600_000, 40))
  await flushEffects()
  assert.equal(adapter.freshness(), "ready")
  assert.equal(item(adapter.panel(), "zai:5h").value, 60)

  void adapter.refresh()
  await flushEffects()
  setCredential("key-c")
  await flushEffects()
  assert.equal(pending.requests[3].signal.aborted, true)
  assert.equal(pending.requests.length, 5, "one failed replacement request starts")
  pending.requests[4].resolve({ ok: false })
  await flushEffects()
  assert.equal(adapter.freshness(), "stale")
  assert.equal(item(adapter.panel(), "zai:5h").value, 60)
  assert.deepEqual(item(adapter.panel(), "zai:header").detailSegments, [
    { text: "Peak (3x)", status: "error" },
    { text: " / ", status: "textMuted" },
    { text: "stale", status: "warning" },
  ])
  assert.equal(item(adapter.panel(), "zai:stale"), undefined)

  pending.requests[3].resolve(quotaResponse(now + 3_600_000, 10))
  await flushEffects()
  assert.equal(item(adapter.panel(), "zai:5h").value, 60)

  setCredential(null)
  await flushEffects()
  assert.equal(adapter.freshness(), "unavailable")
  assert.equal(item(adapter.panel(), "zai:5h"), undefined)
  assert.equal(item(adapter.panel(), "zai:header").detail, "No Z.AI account linked")
})

test("does not carry a Z.AI reset boundary into a replacement generation", async (t) => {
  const clock = installFakeClock(now)
  const oldResetAt = now + 15 * 60 * 1_000
  const pending = deferredRequests()
  const { adapter, setCredential } = createReactiveTestAdapter(t, {
    initialKey: "key-a",
    fetch: pending.fetch,
    clock,
  })
  await flushEffects()

  pending.requests[0].resolve(quotaResponse(oldResetAt, 25))
  await flushEffects()
  const oldBoundary = clock.timeouts.find((timer) =>
    timer.active && timer.delay === oldResetAt - now)
  assert.ok(oldBoundary)

  setCredential("key-b")
  await flushEffects()
  assert.equal(oldBoundary.active, false, "replacement synchronously clears the old boundary")
  assert.equal(pending.requests.length, 2, "exactly one replacement request starts")

  clock.advance(oldResetAt - now)
  oldBoundary.callback()
  await flushEffects()
  assert.equal(pending.requests.length, 2, "the old callback cannot queue a replacement follow-up")

  pending.requests[1].resolve(quotaResponse(oldResetAt + 60 * 60 * 1_000, 40))
  await flushEffects()
  assert.equal(pending.requests.length, 2, "settlement cannot consume an old-generation boundary")
  assert.equal(adapter.freshness(), "ready")
  assert.ok(clock.timeouts.some((timer) => timer.active && timer.delay === 60 * 60 * 1_000))
})

test("aborts and clears the Z.AI request timeout immediately on dispose", async (t) => {
  const clock = installFakeClock(now)
  const pending = deferredRequests()
  const adapter = createTestAdapter(t, { clock, fetch: pending.fetch })
  await flushEffects()

  const requestTimeout = clock.timeouts.find((timer) => timer.active && timer.delay === 20_000)
  assert.ok(requestTimeout)
  const stateAtDispose = observableState(adapter)
  adapter.dispose()

  assert.equal(pending.requests[0].signal.aborted, true)
  assert.equal(requestTimeout.active, false)
  pending.requests[0].resolve(quotaResponse(now + 3_600_000, 5))
  await flushEffects()
  assert.deepEqual(observableState(adapter), stateAtDispose)
})
```

Retain the existing `queues one Z.AI reset-boundary refresh behind an older request` test unchanged. Its same-generation ordering remains required: after the boundary callback, `requests` stays `2`; after `resolvePending(...)` and `flushEffects()`, `requests` becomes exactly `3`.

- [ ] **Step 3: Run the Z.AI provider test and verify RED**

Run:

```bash
node tests/compile-presentation.mjs && node --test tests/provider-zai.test.mjs tests/presentation-mounted.test.mjs
```

Expected: `.tmp-test/provider-lifecycle.mjs` imports successfully and the same-runtime Z.AI setter triggers provider effects. Tests then FAIL because stale mapping/abort/disposal behavior is absent and `oldBoundary.active` remains `true` after replacement; invoking that old callback while the replacement is pending can populate the unowned numeric `pendingBoundary` and produce an extra request after settlement.

- [ ] **Step 4: Allow Z.AI adapter-owned signals while preserving helper callers**

Replace `fetchZaiQuota()` in `tui/providers/zai.ts` with this signature/opening and retain the existing response parsing body between the `try` and `catch`:

```typescript
export async function fetchZaiQuota(apiKey: string, signal?: AbortSignal): Promise<ZaiQuotaData | null> {
  const ownedController = signal ? null : new AbortController()
  const requestSignal = signal ?? ownedController!.signal
  const timeout = ownedController
    ? setTimeout(() => ownedController.abort(), FETCH_TIMEOUT_MS)
    : null
  try {
    const response = await fetch(ZAI_QUOTA_URL, {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
      signal: requestSignal,
    })
    if (!response.ok) return null
    const payload = await response.json() as QuotaApiResponse
    if (payload.code !== 200 || !payload.data?.limits) return null

    const rawLevel = String(payload.data.level || "Unknown")
    const tokenLimits = payload.data.limits.filter((limit): limit is TokenLimit => limit.type === "TOKENS_LIMIT")
    const token = tokenLimits.find((limit) => limit.unit === TIME_UNIT.SESSION_5H) ?? tokenLimits[0]
    const weekly = tokenLimits.find((limit) => limit.unit === TIME_UNIT.WEEKLY_7D && limit !== token)
    const time = payload.data.limits.find((limit): limit is TimeLimit => limit.type === "TIME_LIMIT")
    const absolute = (limit: TokenLimit, usedPct: number): AbsoluteQuota | null => {
      const total = safeNumber(limit.usage, 0)
      if (total <= 0) return null
      return {
        usedPct,
        remainingPct: clampPct(100 - usedPct),
        nextResetEpoch: safeNumber(limit.nextResetTime, 0),
        used: safeNumber(limit.currentValue, Math.round(total * usedPct / 100)),
        total,
      }
    }
    const tokenUsedPct = token ? clampPct(safeNumber(token.percentage, 0)) : 0

    return {
      level: rawLevel.charAt(0).toUpperCase() + rawLevel.slice(1).toLowerCase(),
      tokenUsedPct,
      tokenRemainingPct: clampPct(100 - tokenUsedPct),
      tokenNextResetEpoch: token ? safeNumber(token.nextResetTime, 0) : 0,
      tokenAbsolute: token ? absolute(token, tokenUsedPct) : null,
      weeklyLimit: weekly
        ? {
            usedPct: clampPct(safeNumber(weekly.percentage, 0)),
            remainingPct: clampPct(100 - safeNumber(weekly.percentage, 0)),
            nextResetEpoch: safeNumber(weekly.nextResetTime, 0),
            absolute: absolute(weekly, clampPct(safeNumber(weekly.percentage, 0))),
          }
        : null,
      timeLimit: time
        ? {
            usedPct: clampPct(safeNumber(time.percentage, 0)),
            remainingPct: clampPct(100 - safeNumber(time.percentage, 0)),
            nextResetEpoch: safeNumber(time.nextResetTime, 0),
            total: safeNumber(time.usage, 0),
            used: safeNumber(time.currentValue, 0),
            usageDetails: Array.isArray(time.usageDetails) ? time.usageDetails : [],
          }
        : null,
    }
  } catch (error) {
    if (!requestSignal.aborted) console.error("[quota-zai] fetchQuota error:", error)
    return null
  } finally {
    if (timeout) clearTimeout(timeout)
  }
}
```

- [ ] **Step 5: Add Z.AI stale-header mapping, generation ownership, and credential transitions**

Add `PanelStatus` and `PanelTextSegment` to the type import from `tui/presentation/types.ts`. Replace the Z.AI `header()` helper and ready/stale branch with the exact compatible mapping below:

```typescript
function header(
  title: string,
  detail?: string,
  status?: PanelStatus,
  detailSegments?: readonly PanelTextSegment[],
): PanelItem {
  return {
    id: "zai:header",
    order: 10,
    kind: "header",
    title,
    ...(detail ? { detail } : {}),
    ...(status ? { status } : {}),
    ...(detailSegments?.length ? { detailSegments } : {}),
  }
}
```

```typescript
  } else if (data) {
    const staleSegments: readonly PanelTextSegment[] | undefined = state.phase === "stale"
      ? [
          { text: peakSummary.text, status: peakSummary.status },
          { text: " / ", status: "textMuted" },
          { text: "stale", status: "warning" },
        ]
      : undefined
    items.push(staleSegments
      ? header(`Z.AI: ${data.level}`, undefined, undefined, staleSegments)
      : header(`Z.AI: ${data.level}`, peakSummary.text, peakSummary.status))
    items.push(...quotaItems("5H", "5h", 20, data.tokenRemainingPct, data.tokenNextResetEpoch, now, data.tokenAbsolute))
    const weekly = data.weeklyLimit
    items.push(...quotaItems("7D", "7d", 50, weekly?.remainingPct ?? 100, weekly?.nextResetEpoch ?? 0, now, weekly?.absolute ?? null))
    if (!weekly) items.push({ id: "zai:7d-legacy", order: 65, kind: "text", text: "Unlimited (Legacy)", status: "textMuted" })
    if (data.timeLimit) {
      const time = data.timeLimit
      items.push(
        { id: "zai:time", order: 80, kind: "progress", label: "T", value: time.remainingPct, total: 100 },
        { id: "zai:time-reset", order: 90, kind: "timer", label: "Tool reset", state: timerState(time.remainingPct, time.nextResetEpoch, now), ...(time.nextResetEpoch > 0 ? { epoch: time.nextResetEpoch } : {}) },
        { id: "zai:time-spacer", order: 91, kind: "text", text: "" },
        { id: "zai:time-used", order: 92, kind: "quantity", label: "Tool used", value: time.used, unit: "count" },
        { id: "zai:time-total", order: 93, kind: "quantity", label: "Tool total", value: time.total, unit: "count" },
      )
      const rows = time.usageDetails.filter((detail) => detail.usage > 0)
      if (rows.length) items.push({
        id: "zai:time-models",
        order: 95,
        kind: "table",
        columns: [
          { id: "model", order: 10, title: "Model" },
          { id: "usage", order: 20, title: "Usage", align: "end" },
        ],
        rows: rows.map((detail, index) => ({
          id: `zai:time-model:${detail.modelCode}`,
          order: index,
          cells: [{ kind: "text", text: detail.modelCode }, { kind: "quantity", value: detail.usage, unit: "count" }],
        })),
      })
    }
```

This complete branch replaces the existing ready/stale branch and therefore removes only the old `zai:stale` insertion while retaining weekly and tool mapping. Then initialize `apiKey` to `null` and replace the quota/request/boundary bookkeeping, `refresh()`, and credential effects with the block below. One combined discovery/transition effect owns key-change ordering, and `quotaState` atomically associates data with its publishing generation.

```typescript
  type PublishedQuota = { data: ZaiQuotaData; generation: number }
  type GenerationBoundary = { epoch: number; generation: number }

  const [apiKey, setApiKey] = createSignal<string | null>(null)
  const [quotaState, setQuotaState] = createSignal<PublishedQuota | null>(null)
  const quotaData = () => quotaState()?.data ?? null
  const [phase, setPhase] = createSignal<ZaiPanelPhase>("loading")
  const [lastSuccessAt, setLastSuccessAt] = createSignal(0)
  const [retryAfterEpoch, setRetryAfterEpoch] = createSignal<number | null>(null)
  const [baselineSgt, setBaselineSgt] = createSignal(FALLBACK_BASELINE_SGT)
  const [cycleMs, setCycleMs] = createSignal(FALLBACK_CYCLE_MS)
  const [sessionID, setSessionID] = createSignal<string | null>(null)
  const [now, setNow] = createSignal(Date.now())
  const [refreshedBoundary, setRefreshedBoundary] = createSignal<GenerationBoundary | null>(null)
  let refreshInFlight: Promise<void> | null = null
  let refreshStartedAt = 0
  let pendingBoundary: GenerationBoundary | null = null
  let credentialGeneration = 0
  let observedCredential: string | null | undefined
  let disposed = false
  let boundarySchedule: {
    timer: ReturnType<typeof setTimeout>
    generation: number
  } | null = null
  let activeRequest: {
    generation: number
    controller: AbortController
    timeout: ReturnType<typeof setTimeout>
    promise: Promise<void>
  } | null = null

  const clearBoundarySchedule = (): void => {
    const schedule = boundarySchedule
    boundarySchedule = null
    if (schedule) clearTimeout(schedule.timer)
    pendingBoundary = null
    setRefreshedBoundary(null)
  }

  const cancelActiveRequest = (): void => {
    const request = activeRequest
    if (!request) return
    activeRequest = null
    request.controller.abort()
    clearTimeout(request.timeout)
    if (refreshInFlight === request.promise) {
      refreshInFlight = null
      refreshStartedAt = 0
    }
  }

  const refresh = (): Promise<void> => {
    if (disposed) return Promise.resolve()
    if (refreshInFlight) return refreshInFlight
    const key = apiKey()
    if (!key) {
      setPhase("unavailable")
      return Promise.resolve()
    }

    const generation = credentialGeneration
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
    const startedAt = Date.now()
    const request = (async () => {
      const data = await fetchZaiQuota(key, controller.signal)
      if (disposed || generation !== credentialGeneration) return
      if (data) {
        setQuotaState({ data, generation })
        setPhase("ready")
        setLastSuccessAt(Date.now())
      } else if (quotaData()) {
        setPhase("stale")
      } else {
        setPhase(retryAfterEpoch() && retryAfterEpoch()! > Date.now() ? "rate-limited" : "heuristic")
      }
    })()
    refreshInFlight = request
    refreshStartedAt = startedAt
    activeRequest = { generation, controller, timeout, promise: request }
    const settled = () => {
      if (activeRequest?.promise === request) {
        clearTimeout(activeRequest.timeout)
        activeRequest = null
      }
      if (refreshInFlight !== request) return
      refreshInFlight = null
      refreshStartedAt = 0
      const queued = pendingBoundary
      if (disposed || generation !== credentialGeneration || queued?.generation !== generation) return
      pendingBoundary = null
      setRefreshedBoundary(queued)
      void refresh()
    }
    void request.then(settled, settled)
    return request
  }

  createEffect(() => {
    const next = findZaiKeyFromProviders(api.state.provider) ?? findZaiKeyFromFiles()
    if (next === observedCredential) return
    const replacingCredential = observedCredential !== undefined && observedCredential !== null
    observedCredential = next
    credentialGeneration += 1
    clearBoundarySchedule()
    cancelActiveRequest()
    setRetryAfterEpoch(null)
    setApiKey(next)

    if (!next) {
      setQuotaState(null)
      setLastSuccessAt(0)
      setPhase("unavailable")
      return
    }
    setPhase(replacingCredential && quotaData() ? "stale" : "loading")
    void refresh()
  })
```

In the one-second Z.AI stale-expiry tick, replace the existing quota clear with:

```typescript
      setQuotaState(null)
      clearBoundarySchedule()
```

Replace the Z.AI reset-boundary effect completely:

```typescript
  createEffect(() => {
    const published = quotaState()
    const generation = published?.generation ?? credentialGeneration
    if (published && generation !== credentialGeneration) return
    const epoch = published?.data.tokenNextResetEpoch ?? retryAfterEpoch() ?? 0
    const refreshed = refreshedBoundary()
    const pending = pendingBoundary
    if (
      epoch <= 0
      || (refreshed?.generation === generation && refreshed.epoch === epoch)
      || (pending?.generation === generation && pending.epoch === epoch)
    ) return

    const timer = setTimeout(() => {
      const current = quotaState()
      const sourceIsCurrent = published
        ? current?.generation === generation
        : current === null
      if (disposed || generation !== credentialGeneration || !sourceIsCurrent) return
      if (refreshInFlight && activeRequest?.generation === generation && refreshStartedAt < epoch) {
        pendingBoundary = { epoch, generation }
        return
      }
      setRefreshedBoundary({ epoch, generation })
      void refresh()
    }, Math.max(0, epoch - Date.now()))
    const schedule = { timer, generation }
    boundarySchedule = schedule
    unref(timer)
    onCleanup(() => {
      if (boundarySchedule !== schedule) return
      boundarySchedule = null
      clearTimeout(timer)
    })
  })
```

Clearing `retryAfterEpoch` during every credential transition prevents a fallback boundary from the old account surviving replacement. Published quota and retry-only callbacks both capture the current generation and verify their source before queueing. Replace the returned adapter's `dispose()` body with:

```typescript
    dispose(): void {
      if (disposed) return
      disposed = true
      credentialGeneration += 1
      clearBoundarySchedule()
      cancelActiveRequest()
      dispose()
    },
```

- [ ] **Step 6: Run Z.AI lifecycle and fallback tests to verify GREEN**

Run:

```bash
node tests/compile-presentation.mjs && node --test tests/provider-zai.test.mjs tests/presentation-mounted.test.mjs tests/quota-composition.test.mjs && npm run typecheck
```

Expected: all focused tests PASS. The fixture-driven setter is observed by the bundled Z.AI constructor; replacement clears old quota/retry boundaries and starts exactly one request while spanning the old reset epoch; success schedules a new-generation boundary; the same-generation test still queues exactly one follow-up; segmented stale state, silent aborts, retained diagnostics, removal/disposal, heuristic fallback, and session fallback pass; TypeScript exits `0`.

- [ ] **Step 7: Commit the Z.AI lifecycle slice**

```bash
git add tui/providers/zai.ts tests/provider-zai.test.mjs tests/presentation-mounted.test.mjs
git commit -m "fix(tui): secure Z.AI credential lifecycle"
```

### Task 15: Correct Quota Documentation And Reverify The Expanded Change

**Files:**
- Modify: `README.md:43-48,73-74,225-234`
- Verify only: all source/tests changed in Tasks 1-14
- Generated by build: `dist/opencode-tools-shared.js`, `dist/opencode-tools-quota.js`, `dist/plugins/opencode-tools-tokens.js`
- Generated by local deploy: `.opencode/opencode-tools-shared.js`, `.opencode/opencode-tools-quota.js`, `.opencode/plugins/opencode-tools-tokens.js`, `.opencode/tui.json`

**Interfaces:**
- Consumes: API-duration-derived OpenAI labels, `PanelTextSegment`/`detailSegments`, exact provider stale-header mappings, generation-owned reset boundaries, the complete focused test set, `npm test`, `npm run typecheck`, the three-artifact build contract, and idempotent local deployment.
- Produces: README wording that does not promise fixed `5H` primary/`7D` secondary windows, one atomic documentation commit, fresh automated/build/deploy evidence, and affected live-validation evidence.
- Distinguishes: automated mounted coverage keeps the synthetic three-column table, while live validation uses Z.AI's actual two-column `Model`/`Usage` table emitted from `TIME_LIMIT.usageDetails`.
- Excludes: the unrelated OpenCode GO response-size final-review finding and all source changes outside this approved expansion.

- [ ] **Step 1: Run quota documentation assertions and verify RED**

Run:

```bash
node --input-type=module -e 'import assert from "node:assert/strict"; import { readFileSync } from "node:fs"; const readme = readFileSync("README.md", "utf8"); assert.doesNotMatch(readme, /\*\*5H primary window\*\*/); assert.doesNotMatch(readme, /primary \(5H\) \/ secondary \(7D\)/); assert.doesNotMatch(readme, /marked `~stale`/); assert.match(readme, /API-reported duration/); assert.match(readme, /right-aligned provider header/);'
```

Expected: FAIL with `AssertionError [ERR_ASSERTION]: The input was expected to not match the regular expression /\*\*5H primary window\*\*/` because `README.md` still describes fixed `5H` primary and `7D` secondary windows instead of API-reported duration labels.

- [ ] **Step 2: Replace fixed OpenAI duration and standalone stale-row wording**

Replace the first two bullets under `### OpenAI (ChatGPT Plus/Pro)` with:

```markdown
- **API-reported quota windows** — primary and optional secondary windows use
  compact labels derived from their API-reported duration, such as `5H`, `7D`,
  or `1M`, and show remaining percentage plus reset countdown.
```

Replace step 4 under `### OpenAI` in `## How it works` with:

```markdown
4. Renders the plan type and available primary/secondary quota windows with
   compact labels derived from each API-reported duration.
```

Replace the shared stale-handling bullet with:

```markdown
- **Stale handling** — keeps showing the last known data through transient
  fetch failures and marks `stale` in the right-aligned provider header.
```

- [ ] **Step 3: Rerun quota documentation assertions to verify GREEN**

Run:

```bash
node --input-type=module -e 'import assert from "node:assert/strict"; import { readFileSync } from "node:fs"; const readme = readFileSync("README.md", "utf8"); assert.doesNotMatch(readme, /\*\*5H primary window\*\*/); assert.doesNotMatch(readme, /primary \(5H\) \/ secondary \(7D\)/); assert.doesNotMatch(readme, /marked `~stale`/); assert.match(readme, /API-reported duration/); assert.match(readme, /right-aligned provider header/); console.log("README quota wording verified");'
```

Expected: exits `0` and prints `README quota wording verified`.

- [ ] **Step 4: Commit the quota documentation slice**

```bash
git add README.md
git commit -m "docs: update quota window and stale wording"
```

- [ ] **Step 5: Run the affected focused test set from a fresh presentation compile**

Run:

```bash
node tests/compile-presentation.mjs && node --test tests/presentation-types.test.mjs tests/presentation-layout.test.mjs tests/presentation-render-model.test.mjs tests/presentation-mounted.test.mjs tests/quota-composition.test.mjs tests/provider-openai.test.mjs tests/provider-zai.test.mjs tests/provider-opencode-go.test.mjs
```

Expected: every affected test PASS with `fail 0`, including the compatible segment type, readable pure header text, independently colored mounted segments, exact OpenAI/Z.AI stale models with no standalone stale row, compact-table flex structure, shuffled multi-group order, replacement/removal, silent expected aborts, non-abort diagnostics, disposal timeout cleanup, old-boundary suppression across replacement, new-generation scheduling, and one same-generation queued follow-up.

- [ ] **Step 6: Run static and full automated verification**

Run these commands separately so a failure identifies its gate:

```bash
npm run typecheck
npm test
```

Expected: `tsc --noEmit` exits `0`; both compile scripts and every `tests/*.test.mjs` test PASS with `fail 0`.

- [ ] **Step 7: Build and prove three-artifact activation/deployment parity**

Run:

```bash
npm run build && node --test tests/plugin-build.test.mjs tests/plugin-deploy.test.mjs && npm run deploy:local
```

Expected: all commands exit `0`; build tests activate the combined TUI against host-owned Solid and lifecycle cleanup; deployment tests prove idempotence, option preservation, and byte parity between `dist` and the exact three deployed files; local deployment prints `Deployed opencode-tools plugins to /Users/aam/Projects/priv/opencode-quota/.opencode`.

- [ ] **Step 8: Perform affected live validation after a full OpenCode restart**

Fully restart OpenCode from `/Users/aam/Projects/priv/opencode-quota` and repeat every check below against the Task 10-14 deployment. Do not cite the earlier Task 8 run as evidence:

```text
[ ] At normal sidebar width, expanded Quota framing, provider headers, progress labels/bars/percentages, reset indentation, dividers, and provider detail placement match the approved layout.
[ ] At a constrained 37-cell sidebar width, bars and table cells shrink before fixed labels/percentages, all rows remain inside the panel, and text does not wrap into extra rows.
[ ] Collapsing Quota and Other Providers shows the approved markers/summaries, preserves right-edge alignment, and hides only the intended expanded content.
[ ] With Z.AI tool `usageDetails` visible, its real two-column `Model`/`Usage` table stays inside a 37-cell panel; long model text clips without wrapping and no fixed 80-cell row appears.
[ ] Selected and Other providers show headers/preambles first, each reset/quantity/text/table detail remains with its own window, and Z.AI tool details remain last.
[ ] With no refresh option, each available non-exhausted provider polls approximately every 10 seconds while countdown text still updates every second; exhausted primary quota retains the 5-minute backoff.
[ ] With `refreshIntervalSeconds=2.5`, each available non-exhausted provider polls approximately every 2.5 seconds; restore the desired option afterward.
[ ] Switching the active session model between supported Z.AI and OpenAI/Codex/ChatGPT providers causes one immediate refresh and moves the selected provider above Other Providers without adding the model name.
[ ] Stale OpenAI displays `OpenAI: <plan>` with yellow `stale` at the right edge and no standalone `~stale` row.
[ ] Stale Z.AI displays colored `Peak (3x)` or `Off-Peak (1x)`, gray ` / `, and yellow `stale` at the right edge, with no standalone `~stale` row.
[ ] Ready/loading/unavailable/rate-limited provider headers that use one `detail` string remain visually unchanged.
[ ] Replacing a visible OpenAI credential preserves the segmented stale header, aborts the old network request without an error diagnostic, starts one request with the new credential, and publishes only the new response.
[ ] A failed OpenAI replacement retains stale prior quota; removing the credential clears quota and shows the unlinked state.
[ ] Replacing a visible Z.AI credential preserves the segmented stale header, aborts the old network request without an error diagnostic, starts one request with the new credential, and publishes only the new response.
[ ] A failed Z.AI replacement retains stale prior quota; removing the credential clears quota and shows the unlinked state.
[ ] Restarting or closing OpenCode while each provider request is pending aborts that request immediately; no late quota update appears after shutdown/restart.
[ ] OpenAI windows display labels matching their API-reported durations, including a weekly-only primary response as one 7D row and no invented 5H row.
```

- [ ] **Step 9: Inspect final review readiness without expanding scope**

Run:

```bash
git diff --check 67c36679448d9b45890006ae2bf728241756c09b..HEAD
git status --short
git log --oneline --decorate 67c36679448d9b45890006ae2bf728241756c09b..HEAD
```

Expected: `git diff --check` prints nothing and exits `0`; status contains no unexpected source/test/generated changes from verification; the log contains separate atomic commits for Tasks 10-15. Review only the quota-panel rendering scope and explicitly leave the unrelated OpenCode GO response-size finding out of this change.

## Self-Review Checklist

- [x] Every canonical spec requirement maps to a task: responsive flex rows and framing (Task 1), progress colors and thresholds (Task 2), provider grouping and Z.AI status (Task 3), OpenAI duration labels (Task 4), configurable polling (Task 5), active-session selection (Task 6), muted subordinate metadata (Task 7), full verification/deployment/manual checks (Task 8), and muted short group dividers (Task 9).
- [x] Every production edit in Tasks 1-6 is preceded by a focused failing test and an explicit RED command; each task ends with focused GREEN verification and an atomic commit command.
- [x] No step changes provider endpoints, authentication, quota arithmetic, reset epoch calculation, home output, token reports, or model-name presentation; reset scheduling changes only generation ownership and cleanup.
- [x] Signatures are consistent across tasks: `normalizeQuotaOptions()` produces `refreshIntervalMs`; both provider constructors consume `QuotaProviderOptions`; `createQuotaSelection()` exposes `selectedProviderID` and `setSessionID`; `PanelRenderer` no longer consumes `availableCells`.
- [x] Placeholder-language scan is clean; every test and production edit step has a concrete snippet, command, and expected result.
- [x] Snippets use current IDs/types (`PanelStatus`, `QuotaProviderAdapter`, `TuiPluginApi`, `Accessor`) and commands use scripts present in `package.json`.
- [x] Expanded spec coverage maps mounted compact tables to Task 10, semantic/group-local composition to Task 11, compatible segmented header details to Task 12, OpenAI lifecycle/stale mapping to Task 13, Z.AI lifecycle/stale mapping to Task 14, and duration docs plus focused/full/build/deploy/live verification to Task 15.
- [x] Tasks 10-14 each have strict test-first RED and focused GREEN commands before an atomic commit; Task 15 has a RED-GREEN documentation assertion and its own atomic documentation commit before verification-only steps.
- [x] Credential snippets retain prior quota as stale on non-empty replacement, abort and invalidate old generations, start one replacement, preserve stale data on replacement failure, clear on removal, and abort/clear timeout before disposal.
- [x] Expanded snippets use `PanelTextSegment` and `detailSegments?: readonly PanelTextSegment[]` consistently while retaining `detail?: string`; `PanelRenderer` consumes model/theme accessors, `composeQuotaPanel()` consumes `QuotaProviderAdapter[]`, and fetch helpers add only optional `AbortSignal` parameters while adapter constructors remain unchanged.
- [x] Stale model/mounted/provider coverage requires OpenAI warning `stale`; Z.AI Peak/Off-Peak plus muted ` / ` plus warning `stale`; no standalone stale rows; expected abort silence; and retained non-abort diagnostics.
- [x] Mounted table snippets expose direct native row child arrays for fixture inspection; lifecycle tests import no Node-side Solid signal and instead consume `.tmp-test/provider-lifecycle.mjs` built with `conditions: ["browser"]`; live table validation uses the real two-column Z.AI table.
- [x] Boundary snippets atomically pair published data with `generation`, tag pending/refreshed markers, synchronously clear old timers before replacement refresh, reject escaped old callbacks, schedule new-success boundaries, and retain exactly one same-generation queued follow-up.
- [x] Task 15 independently repeats normal/constrained/collapsed rendering, default/custom polling, active-session switching, table, stale-header, credential, and disposal checks instead of relying on Task 8 evidence.
- [x] Expanded placeholder and unique-checkbox scan is clean; every code edit has concrete code, every command has an expected result, and no new implementation checkbox is pre-checked.
