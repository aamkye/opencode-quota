---
change: align-context-tui
design-doc: docs/superpowers/specs/2026-07-18-align-context-tui-design.md
base-ref: 4c540398a7b987fc9ac9f30fd0b3ad9ac42f487e
---

# Align Context TUI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align the Context sidebar model, expanded and collapsed presentation, and documentation with the canonical four-row, color-aware 37-column contract.

**Architecture:** Keep token aggregation, provider lookup, formatting, and status selection in `createContextPanelModel`, then pass presentation-ready strings and optional `PanelStatus` values into the existing dedicated Context JSX. Reuse `CompactPanel` for the collapsed summary and extend only `ContextMetricRow` for expanded value coloring; do not change shared layout primitives, plugin wiring, host APIs, exports, or persistence.

**Tech Stack:** TypeScript 6, SolidJS JSX, OpenTUI, Node.js test runner, esbuild, npm scripts.

## Global Constraints

- Write artifacts and implementation notes in English.
- Preserve the existing uncommitted RED tests in `tests/context-model.test.mjs`, `tests/context-mounted.fixture.ts`, `tests/context-mounted.test.mjs`, and `tests/plugin-wiring.test.mjs`; amend them in place rather than discarding or recreating them.
- Keep every rendered Context line within 37 cells and free of trailing whitespace.
- Preserve finite-cost accumulation, newest positive assistant-message selection, all five detailed token buckets, reactive updates without remounting, and the `aamkye.opencode-tools-context.collapsed` storage key.
- Do not change plugin registration, public exports, host APIs, provider lookup semantics, token collection, shared layout primitives, or configuration.
- Format consumed tokens with `formatCount(tokens, 2)` and context limits with the existing default `formatCount(limit)` precision.
- Use `success` below 40%, `warning` from 40% through 60%, and `error` above 60%; percentages above 100 remain visible.
- Color only expanded metric values, not their labels. Only a `$0.00` `Spent` value is `textMuted`.
- Keep OpenSpec task 1.1 checked. Check task 2.1 only after production and documentation focused tests pass, and task 3.1 only after every final verification command passes.

---

## File Structure

- `tests/context-model.test.mjs`: preserve the existing model regression matrix, align its status property with the design, and retain threshold/partial-data/formatting assertions.
- `tests/context-mounted.fixture.ts`: preserve the existing four-label discovery plus exposed expanded-value and collapsed-summary colors.
- `tests/context-mounted.test.mjs`: add the remaining expanded `Used` red-value assertion while retaining row order, reactivity, persistence, unavailable state, and 37-cell checks.
- `tests/plugin-wiring.test.mjs`: preserve the existing README four-row and 37-cell contract assertions.
- `tui/features/context.ts`: own separate limit/token strings, percentage status, zero-spend status, and unavailable-state formatting.
- `tui/context.tsx`: render the four rows and map model statuses to value and collapsed-summary colors.
- `AGENTS.md`: clarify the canonical expanded/collapsed usage thresholds and value-only zero-spend muting.
- `README.md`: publish the canonical four-row example, unavailable values, and color behavior.
- `openspec/changes/align-context-tui/tasks.md`: record completion only after the corresponding focused and final gates pass.

### Task 1: Complete And Confirm The Existing RED Contract

**Files:**
- Modify: `tests/context-model.test.mjs:27-137`
- Preserve: `tests/context-mounted.fixture.ts:32-33,130-162`
- Modify: `tests/context-mounted.test.mjs:22-52`
- Preserve: `tests/plugin-wiring.test.mjs:198-229`

**Interfaces:**
- Consumes: the existing uncommitted regression diff and the design field `usageStatus?: PanelStatus`.
- Produces: RED expectations for `ContextPanelModel.usageStatus`, the expanded `Used` value color, the collapsed summary color, four-row rendering, muted zero spend, and README layout.

- [x] **Step 1: Align the existing model assertions with the design field name without recreating the tests**

In `tests/context-model.test.mjs`, replace each `summaryStatus` property/access with `usageStatus`. The affected expectations must read:

```javascript
usageStatus: "error",
```

```javascript
usageStatus: "success",
```

```javascript
usageStatus: "error",
spentStatus: "textMuted",
```

Keep the boundary loop, changing only its property access:

```javascript
test("colors collapsed usage at the documented percentage boundaries", () => {
  for (const [input, status] of [[39, "success"], [40, "warning"], [60, "warning"], [61, "error"]]) {
    assert.equal(createContextPanelModel([assistant({ tokens: { input, output: 0, reasoning: 0, cache: { read: 0, write: 0 } } })], [provider(100)]).usageStatus, status)
  }
})
```

- [x] **Step 2: Add the missing expanded `Used` value-color assertion before any production edit**

In the existing `registers at order 112 and renders the expanded metric contract` test in `tests/context-mounted.test.mjs`, add the assertion immediately after the four-row deep equality check:

```javascript
assert.equal(view.rows[2].valueColor, "#ff0000")
```

Keep the collapsed color assertion in the persistence test, with normal indentation:

```javascript
first.view().clickHeader()
assert.equal(first.view().marker, "▶ ")
assert.equal(first.view().summaryText, "64%")
assert.equal(first.view().summaryColor, "#ff0000")
```

- [x] **Step 3: Run the focused suite and verify the intended RED state**

Run:

```bash
node tests/compile-presentation.mjs && node --test tests/context-model.test.mjs tests/context-mounted.test.mjs tests/plugin-wiring.test.mjs
```

Expected: FAIL. The current baseline has 11 failing tests: production lacks separate `limit`/consumed `tokens`, `usageStatus`, `spentStatus`, the fourth row and value colors, while README still has the old three-row example. The existing `right-anchors all metric values within 37 cells without trailing whitespace` test must continue to pass.

- [x] **Step 4: Commit the completed RED contract**

```bash
git add tests/context-model.test.mjs tests/context-mounted.fixture.ts tests/context-mounted.test.mjs tests/plugin-wiring.test.mjs
git commit -m "test: define context TUI contract"
```

### Task 2: Implement The Minimal Context Model And JSX Changes

**Files:**
- Modify: `tui/features/context.ts:3-70`
- Modify: `tui/context.tsx:1-49`
- Test: `tests/context-model.test.mjs`
- Test: `tests/context-mounted.test.mjs`

**Interfaces:**
- Consumes: `formatCount(value, precision?)`, `formatCurrency(value)`, `PanelStatus`, `PanelTheme`, and `CompactPanelSummary.status`.
- Produces: `ContextPanelModel` with `limit`, `tokens`, `used`, `spent`, `summary`, optional `usageStatus`, and optional `spentStatus`; `ContextMetricRow` accepts an optional status and colors only its value.

- [x] **Step 1: Extend the model type and preserve token/cost selection behavior**

In `tui/features/context.ts`, add the status type import and replace `ContextPanelModel` with:

```typescript
import type { PanelStatus } from "../presentation/types.js"

export type ContextPanelModel = {
  limit: string
  tokens: string
  used: string
  spent: string
  summary: string
  usageStatus?: PanelStatus
  spentStatus?: PanelStatus
}
```

Do not change `finite`, `messageTokens`, or the reverse assistant-message scan.

- [x] **Step 2: Return separate display values and statuses from `createContextPanelModel`**

Keep the scan through line 52, then replace the existing unavailable/limit/return block with:

```typescript
  const spentValue = formatCurrency(spent)
  const spentStatus = spent === 0 ? "textMuted" as const : undefined
  const tokens = selected ? formatCount(selected.tokens, 2) : "-"
  const unavailable: ContextPanelModel = {
    limit: "-",
    tokens,
    used: "-",
    spent: spentValue,
    summary: "-",
    ...(spentStatus ? { spentStatus } : {}),
  }
  if (!selected) return unavailable

  const provider = providers.find((candidate) => candidate.id === selected.message.providerID)
  const limit = selected.message.modelID
    ? provider?.models[selected.message.modelID]?.limit?.context
    : undefined
  if (typeof limit !== "number" || !Number.isFinite(limit) || limit <= 0) return unavailable

  const percentage = Math.round((selected.tokens / limit) * 100)
  const used = `${percentage}%`
  const usageStatus: PanelStatus = percentage < 40
    ? "success"
    : percentage <= 60 ? "warning" : "error"
  return {
    limit: formatCount(limit),
    tokens,
    used,
    spent: spentValue,
    summary: used,
    usageStatus,
    ...(spentStatus ? { spentStatus } : {}),
  }
```

The conditional spreads are required so nonzero-spend models omit `spentStatus` rather than exposing an own property with value `undefined`.

- [x] **Step 3: Extend `ContextMetricRow` to color only right-aligned values**

In `tui/context.tsx`, import `PanelTheme` from the existing shared type export and import `PanelStatus` directly without changing shared exports:

```tsx
import {
  CompactPanel,
  createContextPanelModel,
  defineTuiPlugin,
  pluginDescriptor,
  type PanelTheme,
} from "../shared/opencode-tools-shared.js"
import type { PanelStatus } from "./presentation/types.js"
```

Replace `ContextMetricRow` with:

```tsx
function ContextMetricRow(props: {
  label: string
  value: string
  status?: PanelStatus
  theme: () => PanelTheme
}) {
  return (
    <box flexDirection="row" width="100%" overflow="hidden">
      <text flexBasis={0} flexGrow={1} flexShrink={1} minWidth={0}>{props.label}</text>
      <text flexShrink={0} wrapMode="none" fg={props.status ? props.theme()[props.status] : undefined}>
        {props.value}
      </text>
    </box>
  )
}
```

- [x] **Step 4: Render the canonical rows and reuse one usage status in both modes**

Replace the `CompactPanel` summary and children in `ContextPanel` with:

```tsx
<CompactPanel
  title="Context"
  collapsed={collapsed()}
  summary={collapsed() ? { text: model().summary, status: model().usageStatus } : undefined}
  onToggle={toggle}
  footerDivider={!collapsed()}
  theme={() => api.theme.current}
>
  <ContextMetricRow label="Limit" value={model().limit} theme={() => api.theme.current} />
  <ContextMetricRow label="Tokens" value={model().tokens} theme={() => api.theme.current} />
  <ContextMetricRow
    label="Used"
    value={model().used}
    status={model().usageStatus}
    theme={() => api.theme.current}
  />
  <ContextMetricRow
    label="Spent"
    value={model().spent}
    status={model().spentStatus}
    theme={() => api.theme.current}
  />
</CompactPanel>
```

- [x] **Step 5: Run focused model and mounted tests to verify GREEN production behavior**

Run:

```bash
node tests/compile-presentation.mjs && node --test tests/context-model.test.mjs tests/context-mounted.test.mjs
```

Expected: PASS, 13 tests, 0 failures. This includes exact 39/40/60/61 boundaries, overflow, partial provider data, zero-spend value muting, expanded/collapsed red usage, reactivity, persistence, and 37-cell alignment.

- [x] **Step 6: Commit the model and presentation change**

```bash
git add tui/features/context.ts tui/context.tsx
git commit -m "fix: align context TUI metrics"
```

### Task 3: Align Canonical Documentation And Complete OpenSpec Task 2.1

**Files:**
- Modify: `AGENTS.md:163-182`
- Modify: `README.md:272-294`
- Add: `docs/superpowers/specs/2026-07-18-align-context-tui-design.md`
- Add: `docs/superpowers/plans/2026-07-18-align-context-tui.md`
- Modify: `openspec/changes/align-context-tui/tasks.md:5-7`
- Modify: `tests/plugin-wiring.test.mjs:68-229`

**Interfaces:**
- Consumes: the same four presentation strings and threshold statuses implemented in Task 2.
- Produces: canonical contract prose and examples that fit 37 cells without trailing whitespace; checked OpenSpec task 2.1.

- [ ] **Step 1: Add a failing `AGENTS.md` value-color contract assertion**

In the existing documentation test in `tests/plugin-wiring.test.mjs`, read `AGENTS.md`, extract the `### Context` section through `### LSP`, and assert its normalized prose states both of these requirements:

- expanded `Used` and the collapsed summary share the below-40 / 40-through-60 / above-60 thresholds;
- only the `$0.00` value is muted, not the `Spent` label.

Run the selected documentation test and confirm it fails against the current `AGENTS.md` wording before editing documentation.

- [ ] **Step 2: Clarify the canonical `AGENTS.md` value-color contract**

Keep the existing Context examples and change the expanded `Used` and `Spent` annotations to:

```text
Used                             64% | 10. percentage of used context; 11. no trailing whitespace; 12. same thresholds as collapsed: below 40% green, 40% through 60% yellow, above 60% red
Spent                          $0.00 | 13. cost of used tokens; 14. no trailing whitespace; 15. only the $0.00 value should be grayed out
```

Do not color or describe the `Spent` label as muted.

- [ ] **Step 3: Replace the README Context prose and expanded example**

Replace `README.md` lines 274-287 with:

````markdown
Context values come from the active session. The expanded panel uses
`Limit -`, `Tokens -`, `Used -`, and `Spent $0.00` when context values are
unavailable; the collapsed summary uses `-`. The expanded `Used` value and
collapsed summary are green below 40%, yellow from 40% through 60%, and red
above 60%. Only a `$0.00` value in the `Spent` row is muted.

#### Expanded

```text
▼ Context
-------------------------------------
Limit                            500K
Tokens                        322.12K
Used                              64%
Spent                           $0.00
-------------------------------------
```
````

Keep the existing collapsed example unchanged:

```text
▶ Context                         64%
-------------------------------------
```

- [ ] **Step 4: Run the focused documentation contract test**

Run:

```bash
node --test --test-name-pattern="documents standalone installation, migration, MCP, Context, LSP, and TODO layouts, and rollback" tests/plugin-wiring.test.mjs
```

Expected: PASS for the selected documentation test. Its exact line arrays verify the four Context rows, 37-cell maximum, and no trailing whitespace.

- [ ] **Step 5: Re-run all focused Context tests together**

Run:

```bash
node tests/compile-presentation.mjs && node --test tests/context-model.test.mjs tests/context-mounted.test.mjs tests/plugin-wiring.test.mjs
```

Expected: PASS, 19 tests, 0 failures.

- [ ] **Step 6: Check off OpenSpec implementation task 2.1 only after focused GREEN**

In `openspec/changes/align-context-tui/tasks.md`, make this exact change and leave tasks 1.1 and 3.1 otherwise unchanged:

```diff
-- [ ] 2.1 Extend the Context model and presentation to render the canonical values and statuses, and align the README example with `AGENTS.md`.
+- [x] 2.1 Extend the Context model and presentation to render the canonical values and statuses, and align the README example with `AGENTS.md`.
```

- [ ] **Step 7: Commit documentation and the task checkoff**

```bash
git add AGENTS.md README.md tests/plugin-wiring.test.mjs
git add -f docs/superpowers/specs/2026-07-18-align-context-tui-design.md docs/superpowers/plans/2026-07-18-align-context-tui.md openspec/changes/align-context-tui/tasks.md
git commit -m "docs: align context TUI contract"
```

### Task 4: Run Final Verification And Complete OpenSpec Task 3.1

**Files:**
- Modify: `openspec/changes/align-context-tui/tasks.md:9-11`
- Verify: `tests/context-model.test.mjs`
- Verify: `tests/context-mounted.test.mjs`
- Verify: `tests/plugin-wiring.test.mjs`
- Verify: full TypeScript and plugin build inputs

**Interfaces:**
- Consumes: the complete implementation and documentation commits from Tasks 1-3.
- Produces: focused, typecheck, full-suite, build, and whitespace evidence; checked OpenSpec task 3.1.

- [ ] **Step 1: Re-run the focused Context verification from a clean compile**

Run:

```bash
node tests/compile-presentation.mjs && node --test tests/context-model.test.mjs tests/context-mounted.test.mjs tests/plugin-wiring.test.mjs
```

Expected: PASS, 19 tests, 0 failures.

- [ ] **Step 2: Run TypeScript type checking**

Run:

```bash
npm run typecheck
```

Expected: exit code 0 with no TypeScript diagnostics.

- [ ] **Step 3: Run the complete test suite**

Run:

```bash
npm test
```

Expected: exit code 0; all session-title, presentation, model, mounted, wiring, lifecycle, provider, and plugin tests pass with 0 failures.

- [ ] **Step 4: Build all plugins**

Run:

```bash
npm run build
```

Expected: exit code 0 from `npm run build:plugins`; all configured plugin bundles are generated successfully.

- [ ] **Step 5: Verify patch hygiene**

Run:

```bash
git diff --check 4c540398a7b987fc9ac9f30fd0b3ad9ac42f487e..HEAD
```

Expected: exit code 0 with no output, confirming no trailing whitespace or whitespace errors in the committed implementation range.

- [ ] **Step 6: Check off OpenSpec verification task 3.1 only after every gate passes**

In `openspec/changes/align-context-tui/tasks.md`, make this exact change:

```diff
-- [ ] 3.1 Run focused Context tests, type checking, the full test suite, and the plugin build.
+- [x] 3.1 Run focused Context tests, type checking, the full test suite, and the plugin build.
```

- [ ] **Step 7: Commit the final verification checkoff**

```bash
git add openspec/changes/align-context-tui/tasks.md
git commit -m "chore: complete context TUI verification"
```

- [ ] **Step 8: Confirm the implementation range and worktree state**

Run:

```bash
git status --short
git log --oneline 4c540398a7b987fc9ac9f30fd0b3ad9ac42f487e..HEAD
```

Expected: `git status --short` has no output, and the log contains the RED test, model/JSX, documentation, and verification-checkoff commits from this plan.
