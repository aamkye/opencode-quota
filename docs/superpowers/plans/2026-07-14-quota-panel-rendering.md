---
change: fix-quota-panel-rendering
design-doc: docs/superpowers/specs/2026-07-14-quota-panel-rendering-design.md
base-ref: 67c36679448d9b45890006ae2bf728241756c09b
---

# Quota Panel Rendering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the aggregate quota panel responsive, correctly grouped and labeled, color-configurable, polled every 10 seconds by default, and driven by the active session model's provider.

**Architecture:** Keep provider adapters responsible for semantic quota models and polling, keep `tui/quota.tsx` responsible for native option normalization, provider selection, and aggregate composition, and keep `tui/presentation/renderer.tsx` responsible for pure deterministic rendering plus parent-responsive mounted JSX. Preserve explicit cell allocation for pure tests, but make mounted headers and progress bars use OpenTUI flex sizing rather than a guessed 80-cell width.

**Tech Stack:** TypeScript 6, SolidJS 1.9, OpenTUI Solid 0.4, Node.js test runner, esbuild, npm scripts.

## Global Constraints

- Use strict TDD for Tasks 1-6: add the focused test first, run it and capture the stated RED failure, then edit production code.
- `refreshIntervalSeconds` accepts positive finite numbers and defaults to `10`; invalid values fall back to `10`.
- `progressColors.enabled` defaults to `true`; thresholds normalize to `0-100`, enforce `errorBelow <= warningBelow`, and default to `10` and `30` when invalid.
- Progress status always evaluates remaining quota, even when `otherProviders.percentageMode` displays used quota.
- Only the filled bar and percentage use semantic progress status; labels remain normal text and empty bars use `textMuted`.
- Preserve immediate adapter fetch, exhausted-window backoff, fetch timeout, stale expiry, one-second countdown clock, reset-boundary refresh, and lifecycle cleanup.
- Do not change provider endpoints, authentication, quota arithmetic, timeout handling, reset-boundary behavior, home summaries, or token reports.
- Do not display the selected model name, add providers, add keyboard collapse controls, or perform unrelated refactors.
- Run each focused command from `/Users/aam/Projects/priv/opencode-quota`.

## File Map

- `tui/presentation/layout.ts`: deterministic header/progress cell allocation used by pure tests.
- `tui/presentation/renderer.tsx`: normalization, deterministic render model, and mounted OpenTUI JSX.
- `tests/presentation-mounted.fixture.ts`: expands mounted JSX into inspectable elements.
- `tests/presentation-layout.test.mjs`, `tests/presentation-render-model.test.mjs`, `tests/presentation-mounted.test.mjs`: responsive rendering and framing coverage.
- `tui/quota.tsx`: option normalization, progress semantics, grouping, active-session selection, aggregate composition, and sidebar registration.
- `tests/quota-composition.test.mjs`: option, color, grouping, selection, refresh, and aggregate-order coverage.
- `tui/providers/openai.ts`, `tests/provider-openai.test.mjs`: duration-derived OpenAI labels/IDs and OpenAI polling.
- `tui/providers/zai.ts`, `tests/provider-zai.test.mjs`: Z.AI Peak/Off-Peak header detail and Z.AI polling.
- `tui/providers/types.ts`: shared provider-constructor polling option.
- `README.md`: native option contract and 10-second polling documentation.

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

- [ ] **Step 1: Run the focused regression set once from a clean test compilation**

Run:

```bash
node tests/compile-presentation.mjs && node --test tests/presentation-layout.test.mjs tests/presentation-render-model.test.mjs tests/presentation-mounted.test.mjs tests/quota-composition.test.mjs tests/provider-openai.test.mjs tests/provider-zai.test.mjs
```

Expected: all focused tests PASS with `fail 0`.

- [ ] **Step 2: Run static typechecking**

Run:

```bash
npm run typecheck
```

Expected: `tsc --noEmit` exits `0` with no diagnostics.

- [ ] **Step 3: Run the complete automated suite**

Run:

```bash
npm test
```

Expected: both compile scripts and every `tests/*.test.mjs` test PASS with `fail 0`.

- [ ] **Step 4: Build and validate all three production artifacts**

Run:

```bash
npm run build && node --test tests/plugin-build.test.mjs
```

Expected: build exits `0`; these files exist and are non-empty minified ESM: `dist/opencode-tools-shared.js`, `dist/opencode-tools-quota.js`, and `dist/plugins/opencode-tools-tokens.js`. Artifact tests PASS, including hermetic combined-TUI activation, host-owned Solid reactivity, lifecycle cleanup, and exported provider constructors.

- [ ] **Step 5: Exercise idempotent deployment tests**

Run:

```bash
node --test tests/plugin-deploy.test.mjs
```

Expected: all deployment tests PASS, including option preservation and the exact three-artifact deployed layout.

- [ ] **Step 6: Deploy locally**

Run:

```bash
npm run deploy:local
```

Expected: command exits `0` and prints `Deployed opencode-tools plugins to /Users/aam/Projects/priv/opencode-quota/.opencode`; `.opencode/tui.json` contains one managed `./opencode-tools-quota.js` entry and preserves unrelated entries.

- [ ] **Step 7: Manually verify normal, constrained, and collapsed rendering in OpenCode**

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

- [ ] **Step 8: Manually verify active-provider selection and OpenAI duration labels**

Switch the active session model from a Z.AI model to an OpenAI/Codex/ChatGPT model and back, waiting less than the polling interval after each switch:

```text
[ ] The newly selected provider refreshes immediately and moves above "Other providers".
[ ] All other ready/stale providers remain visible under "Other providers".
[ ] Provider headers retain provider/plan text and never include the selected model name.
[ ] An OpenAI primary response with limit_window_seconds=604800 renders one 7D group and no 5H group.
[ ] A multi-window OpenAI response labels each group from its own limit_window_seconds.
```

- [ ] **Step 9: Manually verify default and custom polling**

First run with no `refreshIntervalSeconds`, then set the deployed quota entry option to `2.5`, redeploy/restart, and observe request timing using the host's network/debug output:

```text
[ ] With no option, each available non-exhausted provider polls approximately every 10 seconds.
[ ] Countdown text still changes every second.
[ ] With refreshIntervalSeconds=2.5, each available non-exhausted provider polls approximately every 2.5 seconds.
[ ] Exhausted primary quota still uses the existing 5-minute backoff.
[ ] Switching providers still causes an immediate refresh independent of polling.
```

Restore the desired local option after the timing check; do not commit generated local configuration unless it was already intentionally tracked for this change.

- [ ] **Step 10: Inspect the final change range and worktree**

Run:

```bash
git diff --check 67c36679448d9b45890006ae2bf728241756c09b..HEAD && git status --short
```

Expected: `git diff --check` prints nothing and exits `0`. `git status --short` contains no unexpected source changes from verification; pre-existing unrelated deletions such as `task-7-report.md`, `task-9-report.md`, or `task-10-report.md` must remain untouched.

## Self-Review Checklist

- [x] Every canonical spec requirement maps to a task: responsive flex rows and framing (Task 1), progress colors and thresholds (Task 2), provider grouping and Z.AI status (Task 3), OpenAI duration labels (Task 4), configurable polling (Task 5), active-session selection (Task 6), muted subordinate metadata (Task 7), and full verification/deployment/manual checks (Task 8).
- [x] Every production edit in Tasks 1-6 is preceded by a focused failing test and an explicit RED command; each task ends with focused GREEN verification and an atomic commit command.
- [x] No step changes provider endpoints, authentication, quota arithmetic, timeout/stale/reset behavior, home output, token reports, or model-name presentation.
- [x] Signatures are consistent across tasks: `normalizeQuotaOptions()` produces `refreshIntervalMs`; both provider constructors consume `QuotaProviderOptions`; `createQuotaSelection()` exposes `selectedProviderID` and `setSessionID`; `PanelRenderer` no longer consumes `availableCells`.
- [x] Placeholder-language scan is clean; every test and production edit step has a concrete snippet, command, and expected result.
- [x] Snippets use current IDs/types (`PanelStatus`, `QuotaProviderAdapter`, `TuiPluginApi`, `Accessor`) and commands use scripts present in `package.json`.
