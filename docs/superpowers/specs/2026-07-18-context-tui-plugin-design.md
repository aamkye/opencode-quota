---
comet_change: add-context-tui-plugin
role: technical-design
canonical_spec: openspec
archived-with: 2026-07-18-add-context-tui-plugin
status: final
---

# Context TUI Plugin Technical Design

## Scope

Add a standalone `context` TUI plugin that renders three active-session metrics in the sidebar:

- `Tokens`: the model context limit
- `Used`: the current context usage percentage
- `Spent`: the sum of assistant-message costs

The plugin sits after MCP and before LSP. It follows the 37-column expanded and collapsed layouts in `AGENTS.md`, saves its collapse state, and returns placeholders when OpenCode has not supplied enough data.

The OpenSpec delta at `openspec/changes/add-context-tui-plugin/specs/context-tui-panel/spec.md` defines user-visible behavior. This document defines code boundaries, data flow, edge handling, and tests.

## Existing Architecture

MCP, LSP, and TODO each register a separate `sidebar_content` slot. Their components use `CompactPanel` for the header, arrows, dividers, collapsed summary, and theme access. LSP and TODO start expanded and save collapse state through `api.kv`.

The project separates pure panel models from mounted Solid components:

- `tui/features/mcp.ts` normalizes MCP state for `tui/mcp.tsx`.
- `tui/features/lsp.ts` normalizes LSP state for `tui/lsp.tsx`.
- `tui/features/todo.ts` normalizes TODO records for `tui/todo.tsx`.

Context will follow the same split. The quota `PanelRenderer` supports a broader provider/group/item model, but Context does not need provider selection, progress rows, timers, or nested groups.

## OpenCode Data Contract

The installed SDK and local TUI declaration expose the required data without a network request:

```text
sidebar_content props.session_id
           |
           v
api.state.session.messages(sessionID) -> Message[]
           |
           +-> AssistantMessage.providerID
           +-> AssistantMessage.modelID
           +-> AssistantMessage.cost
           +-> AssistantMessage.tokens

api.state.provider -> Provider[]
           |
           v
provider.models[modelID].limit.context
```

`api.state.session.messages(sessionID)` and `api.state.provider` come from the host's Solid store. Reading them inside a memo tracks changes. The plugin must not add `message.updated` subscriptions, polling, storage reads, or provider API calls.

## Feature Model

Create `tui/features/context.ts` with one public function:

```ts
createContextPanelModel(messages, providers): ContextPanelModel
```

Use narrow types derived from SDK `Message` and `Provider`. Keep the function independent from Solid and `TuiPluginApi` so model tests can pass plain records.

The returned model contains rendered values rather than host records:

```ts
type ContextPanelModel = {
  tokens: string
  used: string
  spent: string
  summary: string
}
```

### Token Selection

Scan messages from newest to oldest. Ignore user messages. For each assistant message, calculate:

```text
input + output + reasoning + cache.read + cache.write
```

Select the first assistant message whose calculated total is positive. Do not use `tokens.total`; OpenCode's current context metric calculates the total from the five detailed buckets. This keeps behavior stable when `tokens.total` is absent or differs across SDK versions.

Treat non-finite bucket values as zero at the model boundary. If no assistant message has a positive finite total, return unavailable token and usage values.

### Model Limit Resolution

Find the provider whose `id` equals the selected message's `providerID`, then read `provider.models[message.modelID].limit.context`. Accept only a positive finite limit.

If the provider, model, or valid limit is absent, return `tokens: "-"` and `used: "-"`. The plugin can still calculate `spent` because cost aggregation does not depend on model metadata.

Format a valid limit with the existing `formatCount` helper. It produces values such as `322K`, `1M`, and `1.5M` without padding.

### Usage Calculation

Calculate usage as:

```text
Math.round((selected message token total / context limit) * 100)
```

Render the integer followed by `%`. Do not call the existing `formatPercent` helper because that helper clamps values to 100. Context must preserve OpenCode's raw rounded result, including overflow such as `105%`.

Use the same rendered usage string for `used` and `summary`. If usage is unavailable, both fields contain `-`.

### Spend Calculation

Sum `cost` from every assistant message in the active session. Ignore user messages and non-finite assistant costs. Format the sum with the existing `formatCurrency` helper at two decimals. An empty session or a session without finite costs renders `$0.00`.

## Solid Plugin Component

Create `tui/context.tsx` and obtain its descriptor through `pluginDescriptor("context")`.

The plugin owns one outer `sessionID` signal. The `sidebar_content` callback writes `props.session_id ?? ""` and returns a `ContextPanel` component. The component owns:

- a `collapsed` signal initialized from `api.kv.get("aamkye.opencode-tools-context.collapsed", false)`
- a memo that calls `createContextPanelModel` with the active session messages and `api.state.provider`
- a toggle that updates the signal and KV value

An empty session ID passes an empty message array to the model. This avoids host calls with an invalid ID and produces the defined placeholder state.

### Rendering

Render `CompactPanel` with:

- title `Context`
- `collapsed={collapsed()}`
- collapsed summary from `model().summary`
- `footerDivider={!collapsed()}`
- the current TUI theme

Expanded content contains three local metric rows in this order: `Tokens`, `Used`, `Spent`. Each row uses a full-width horizontal box. The label text grows and can shrink; the value text does not shrink and sits at the right edge. The component must not construct padded strings, which prevents trailing whitespace and lets OpenTUI allocate the current sidebar width.

The shared `CompactPanel` renders `▼` while expanded and `▶` while collapsed. The expanded arrow intentionally corrects the contradictory `▶` shown in the Context extended example because the rest of `AGENTS.md` and all existing panels use `▼` for visible content.

## Packaging And Ordering

Add a `context` entry to `plugin-manifest.json`:

```json
{
  "key": "context",
  "id": "aamkye/opencode-tools-context",
  "source": "tui/context.tsx",
  "outfile": "opencode-tools-context.js",
  "slotOrder": 112,
  "options": "none"
}
```

Set the affected sidebar orders to:

| Plugin | Order |
|--------|------:|
| MCP | 111 |
| Context | 112 |
| LSP | 113 |
| TODO | 114 |

Extend `PluginKey`, add the package export, and export the feature model from `shared/opencode-tools-shared.ts`. The manifest-driven build and deploy scripts will consume the new entry after their contract tests and managed-artifact expectations include it.

Document the new opt-in plugin alongside MCP, LSP, and TODO. Do not add it to user configuration without an explicit deployment or registration action.

## Error Handling

The panel has no asynchronous work and no recoverable error state. The model normalizes incomplete host records:

| Condition | Tokens | Used | Spent | Summary |
|-----------|--------|------|-------|---------|
| No session or assistant response | `-` | `-` | `$0.00` | `-` |
| Token message, missing model limit | `-` | `-` | calculated cost | `-` |
| Valid model limit and tokens | compact limit | raw rounded percent | calculated cost | same percent |
| Malformed numeric field | ignore invalid field | calculate only if inputs remain valid | ignore invalid cost | usage or `-` |

The component relies on `defineTuiPlugin` and the host lifecycle. It allocates no timers, event listeners, services, or network resources.

## Test Strategy

Follow test-driven development. Add failures before implementation for each layer.

### Pure Model Tests

Cover:

- all five token buckets contribute to the current total
- `tokens.total` does not replace the detailed-bucket calculation
- the newest positive token-bearing assistant message wins
- a newer post-compaction message replaces a larger historical context
- user-message data does not affect metrics
- all finite assistant costs contribute to spend
- missing session data returns placeholders and `$0.00`
- missing provider, model, zero limit, non-finite limit, and malformed numbers do not throw
- context limits use compact count formatting
- usage rounds to the nearest integer
- usage above the limit renders `105%` rather than `100%`

### Mounted Component Tests

Create a fixture based on the LSP/TODO mounted fixtures. Assert:

- plugin ID and slot order
- first mount starts expanded
- expanded header marker, metric order, values, and two dividers
- collapsed header marker and usage summary with no body rows or footer divider
- unavailable collapsed summary is `-`
- clicking the header saves the KV key and changes the view
- saved collapse state is restored on remount
- changing session ID updates all metrics for the new session
- changing message or provider signals updates the view without a slot remount
- each rendered metric row fits width 37 and has a right-anchored value
- plugin disposal leaves no lifecycle resources

### Contract And Integration Tests

- Add a TUI state fixture that compiles `state.session.messages()` and `state.provider` access against `TuiPluginApi`.
- Extend manifest tests for the new key, source, output file, options, and slot sequence.
- Extend build tests to require `opencode-tools-context.js`.
- Extend deploy tests so Context is installed, deduplicated, preserved or removed under the same managed-artifact rules as neighboring plugins.
- Run focused tests, then `npm test`, `npm run typecheck`, and `npm run build`.

## Alternatives Rejected

### Generic PanelRenderer

The renderer already supports quantity items, but adopting it would require a provider-style `PanelModel`, generic collapse persistence, and tests across a larger rendering path. Context needs one header and three values, so `CompactPanel` provides the matching abstraction.

### Inline Metric Logic

Calculating message selection and model lookup inside `context.tsx` would save one file. It would force mounted tests to cover data normalization and make SDK compatibility changes touch JSX. A pure feature model gives those rules one typed boundary.

### Manual Event Subscription

Listening for message events could trigger updates, but TUI state accessors already track the host's Solid store. A second update path can drift from the store and requires cleanup without improving freshness.

## Delivery And Rollback

The build adds one independent artifact. Existing configurations remain unchanged until users register or deploy Context. To roll back, remove the Context plugin entry from TUI configuration or deploy a version without the artifact. The persisted collapse key can remain because no other feature reads it.
