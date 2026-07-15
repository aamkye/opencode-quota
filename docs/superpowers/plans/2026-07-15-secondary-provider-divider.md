# Secondary Provider Divider Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render the existing flexible divider between adjacent providers inside the shared `Other providers` group.

**Architecture:** Add a semantic `divider` item to the generic panel model and preserve it through normalization, deterministic layout, and mounted rendering. Quota composition inserts one divider immediately before each secondary provider after the first, retaining one shared collapsible group.

**Tech Stack:** TypeScript, Solid JSX, Node test runner, OpenCode TUI primitives

## Global Constraints

- Keep all secondary providers in the single collapsible `Other providers` group.
- Render separators with the existing flexible `GroupDivider`; do not hard-code a 37-character line.
- Insert no divider before the first secondary provider or after the last.
- Tie each divider ID and order to the provider that follows it.
- Preserve provider sorting, quota values, status colors, collapsed summaries, and the 37-column maximum width.
- Do not inspect, print, copy, or commit `.opencode/tui.json` or its credentials.
- Do not restore, edit, stage, or commit `task-7-report.md`, `task-9-report.md`, or `task-10-report.md`.

---

### Task 1: Semantic Secondary-Provider Divider

**Files:**
- Modify: `tests/quota-composition.test.mjs`
- Modify: `tests/presentation-mounted.test.mjs`
- Modify: `tui/presentation/types.ts`
- Modify: `tui/presentation/renderer.tsx`
- Modify: `tui/quota.tsx`

**Interfaces:**
- Consumes: `PanelItem`, `normalizePanelModel`, `renderPanelLayout`, `PanelRenderer`, `composeQuotaPanel`, and the existing `GroupDivider` component.
- Produces: `PanelItem` with `kind: "divider"` and stable secondary-provider boundary rows named `other-providers:<provider-id>:divider`.

- [x] **Step 1: Add the failing composition regression**

Add this test to `tests/quota-composition.test.mjs`:

```javascript
test("separates adjacent providers inside the shared Other providers group", () => {
  const openai = provider({ id: "openai", title: "OpenAI", order: 120, primaryPct: 90 })
  const openCodeGo = openCodeGoProvider()
  const zai = provider({ id: "zai", title: "Z.AI", order: 110, primaryPct: 50 })
  const model = composeQuotaPanel("openai", [zai, openai, openCodeGo])
  const others = model.groups.find((group) => group.id === "other-providers")

  assert.deepEqual(others.items.filter((entry) => entry.kind === "divider"), [
    { id: "other-providers:zai:divider", order: 999, kind: "divider" },
  ])
  const boundary = others.items.map((entry) => entry.id)
  assert.ok(boundary.indexOf("opencode-go:1M:reset") < boundary.indexOf("other-providers:zai:divider"))
  assert.ok(boundary.indexOf("other-providers:zai:divider") < boundary.indexOf("zai:header"))

  const normalized = normalizePanelModel(model).groups.find((group) => group.id === "other-providers")
  assert.equal(normalized.items.filter((entry) => entry.kind === "divider").length, 1)
  const expanded = renderPanelLayout(model, { availableCells: 37 })
  assert.equal(expanded.groups.find((group) => group.id === "other-providers").items.filter((entry) => entry.kind === "divider").length, 1)
  const collapsed = renderPanelLayout(model, { availableCells: 37, collapsed: new Set(["group:other-providers"]) })
  assert.deepEqual(collapsed.groups.find((group) => group.id === "other-providers").items, [])
})
```

- [x] **Step 2: Add the failing mounted-renderer regression**

Add this test to `tests/presentation-mounted.test.mjs`:

```javascript
test("renders a semantic divider inside one panel group", () => {
  const dividerModel = {
    id: "quota",
    order: 10,
    title: "Quota",
    groups: [{
      id: "other-providers",
      order: 10,
      header: { title: "Other providers", collapsible: true },
      items: [
        { id: "first", order: 10, kind: "text", text: "OpenCode GO" },
        { id: "between", order: 20, kind: "divider" },
        { id: "second", order: 30, kind: "text", text: "Z.AI" },
      ],
    }],
  }
  const { elements, dispose } = mountPanel(dividerModel)

  try {
    const dashEnds = elements.filter((element) => element.type === "text" && element.props.children === "---")
    assert.equal(dashEnds.length, 2)
    assert.ok(elements.some((element) =>
      element.type === "box"
      && element.props.width === "100%"
      && element.props.flexDirection === "row"
      && element.props.height === 1
      && !element.props.border))
  } finally {
    dispose()
  }
})
```

- [x] **Step 3: Run the focused RED gate**

Run:

```bash
node tests/compile-presentation.mjs && node --test --test-name-pattern="separates adjacent providers|renders a semantic divider" tests/quota-composition.test.mjs tests/presentation-mounted.test.mjs
```

Expected: both new tests fail because quota composition emits no divider and `MountedItem` does not render `kind: "divider"`.

- [x] **Step 4: Add the semantic divider type and renderer support**

In `tui/presentation/types.ts`, add `divider` to `PanelItemKind` and to the `PanelItem` union:

```typescript
export type PanelItemKind = "divider" | "header" | "text" | "progress" | "timer" | "quantity" | "table"

export type PanelItem =
  | (PanelItemBase & { kind: "divider" })
  | (PanelItemBase & { kind: "header"; title: string; detail?: string })
  | (PanelItemBase & { kind: "text"; text: string; align?: PanelAlignment })
  | (PanelItemBase & { kind: "progress"; label: string; value: number; total: number })
  | (PanelItemBase & { kind: "timer"; label: string; state: TimerState; epoch?: number; detail?: string })
  | (PanelItemBase & { kind: "quantity"; label: string; value: number; unit: QuantityUnit; precision?: number; align?: PanelAlignment })
  | (PanelItemBase & { kind: "table"; columns: readonly PanelTableColumn[]; rows: readonly PanelTableRow[] })
```

In `tui/presentation/renderer.tsx`, add divider variants to both internal unions:

```typescript
type NormalizedItem =
  | { id: string; kind: "divider" }
  | { id: string; kind: "header"; title: string; detail?: string; status?: PanelStatus }
  | { id: string; kind: "text"; text: string; align: PanelAlignment; status?: PanelStatus }
  | { id: string; kind: "progress"; label: string; percent: string; allocation: ProgressRowAllocation; status?: PanelStatus }
  | { id: string; kind: "timer"; text: string; detail?: string; status?: PanelStatus }
  | { id: string; kind: "quantity"; label: string; value: string; align: PanelAlignment; status?: PanelStatus }
  | {
      id: string
      kind: "table"
      layout: "compact"
      columns: { id: string; title: string; align: PanelAlignment }[]
      rows: { id: string; cells: { text: string; status?: PanelStatus }[] }[]
      allocation: CompactTableAllocation
      status?: PanelStatus
    }

type RenderedItem =
  | { kind: "divider" }
  | { kind: "header" | "text" | "quantity"; text: string; status?: PanelStatus }
  | { kind: "progress"; cells: RenderedCell[] }
  | { kind: "timer"; text: string; detail?: string; status?: PanelStatus }
  | { kind: "table"; rows: RenderedCell[][] }
```

Preserve the item through normalization and deterministic layout:

```typescript
case "divider":
  return { id: item.id, kind: item.kind }
```

```typescript
case "divider":
  return { kind: item.kind }
```

Render the semantic row with the existing component in `MountedItem`:

```tsx
case "divider":
  return <GroupDivider />
```

- [x] **Step 5: Insert stable boundaries during quota composition**

Replace the `secondary.flatMap` expression in `composeQuotaPanel` with:

```typescript
items: secondary.flatMap<PanelItem>((provider, index) => [
  ...(index === 0
    ? []
    : [{
        id: `other-providers:${provider.id}:divider`,
        order: index * 1_000 - 1,
        kind: "divider" as const,
      }]),
  ...providerItems(provider, options, index * 1_000),
]),
```

Update the existing 37-column test's item-width collection so semantic dividers contribute no fixed-width measurement:

```javascript
if (entry.kind === "divider") return []
```

Update the existing exact secondary-order assertion to include divider IDs immediately before `gamma:header` and `beta:header`:

```javascript
"other-providers:gamma:divider",
"gamma:header", "gamma:5H", "gamma:5H:reset", "gamma:7D", "gamma:7D:reset",
"other-providers:beta:divider",
"beta:header", "beta:5H", "beta:5H:reset", "beta:7D", "beta:7D:reset",
```

- [x] **Step 6: Run focused GREEN gates**

Run:

```bash
node tests/compile-presentation.mjs && node --test tests/quota-composition.test.mjs tests/presentation-mounted.test.mjs tests/presentation-layout.test.mjs tests/presentation-render-model.test.mjs
npm run typecheck
```

Expected: every focused test passes and TypeScript reports no diagnostics.

- [x] **Step 7: Run release and deployment regressions**

Run:

```bash
npm test
npm run build:plugins && node --test tests/plugin-build.test.mjs tests/plugin-deploy.test.mjs
npm run deploy:local
cmp -s dist/opencode-tools-shared.js .opencode/opencode-tools-shared.js && cmp -s dist/opencode-tools-quota.js .opencode/opencode-tools-quota.js && cmp -s dist/plugins/opencode-tools-tokens.js .opencode/plugins/opencode-tools-tokens.js
git diff --check
```

Expected: all tests, build checks, deployment checks, local deployment, parity comparisons, and whitespace checks exit 0. The deployment command must not print local options or credentials.

- [x] **Step 8: Commit the fix atomically**

```bash
git status --short
git add tests/quota-composition.test.mjs tests/presentation-mounted.test.mjs tui/presentation/types.ts tui/presentation/renderer.tsx tui/quota.tsx
git commit -m "fix(quota): separate secondary providers"
```

Expected: only the five named files enter the commit. The three unrelated root report deletions remain unstaged.

- [x] **Step 9: Complete credential-owner validation**

Restart OpenCode. The credential owner verifies that a flexible `--- ... ---` divider appears between OpenCode Go and Z.AI in expanded `Other providers`, remains within 37 columns, and disappears when that group collapses. Do not create a screenshot, capture, log, or report containing credentials or authenticated page data.
