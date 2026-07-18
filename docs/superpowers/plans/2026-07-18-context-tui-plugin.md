---
change: add-context-tui-plugin
design-doc: docs/superpowers/specs/2026-07-18-context-tui-plugin-design.md
base-ref: 84d66fc83c953441b52a6df98eb27c6b493dabac
archived-with: 2026-07-18-add-context-tui-plugin
---

# Context TUI Plugin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an independently packaged Context sidebar plugin that reactively displays the active model's context limit, raw rounded usage, and cumulative session spend in persistent expanded and collapsed layouts.

**Architecture:** Keep all message selection, provider lookup, numeric normalization, and formatting in a pure `tui/features/context.ts` model. Keep `tui/context.tsx` thin: it owns only the active-session and collapse signals, reads the host Solid store inside one memo, and renders three width-safe rows through `CompactPanel`. The manifest remains the single source of plugin identity, order, build, and deployment behavior.

**Tech Stack:** TypeScript 6, SolidJS 1.9, OpenTUI JSX, OpenCode TUI plugin API/SDK v2 types, Node test runner, esbuild.

## Global Constraints

- Artifact language is English (`en`).
- OpenCode engine support remains `>=1.18.1`; add no dependency or package-lock changes.
- The panel width contract is 37 cells, with no padded content strings or trailing whitespace.
- Context is opt-in and standalone; do not modify `tui.json`, `.opencode/`, or any user configuration.
- Use only `api.state.session.messages(sessionID)` and `api.state.provider`; add no event subscription, polling, provider request, storage read beyond collapse state, timer, or service.
- Calculate current tokens from `input + output + reasoning + cache.read + cache.write`; never use `tokens.total`.
- Preserve raw rounded usage above 100%; do not use the clamping `formatPercent` helper.
- Sum every finite assistant-message cost and render two decimal places; ignore user-message data and non-finite numeric fields.
- Start expanded, persist only header-triggered collapse changes under `aamkye.opencode-tools-context.collapsed`, and restore that value on remount.
- Sidebar order must be MCP `111`, Context `112`, LSP `113`, TODO `114`.
- Preserve the pure-model/thin-component boundary and import component dependencies through `shared/opencode-tools-shared.ts`.
- Do not commit generated `dist/` or `.tmp-test/` outputs.

## File Structure

- Create `tui/features/context.ts`: SDK-derived narrow input types and the pure `createContextPanelModel` function.
- Create `tui/context.tsx`: standalone Context plugin, active-session wiring, persisted collapse state, and three metric rows.
- Create `tests/context-model.test.mjs`: pure token-selection, metadata, cost, malformed-value, formatting, and overflow tests.
- Create `tests/context-mounted.fixture.ts`: reactive Solid host fixture and 37-cell view reader.
- Create `tests/context-mounted.test.mjs`: mounted registration, layout, persistence, session switching, reactivity, and cleanup assertions.
- Create `tests/context-state-types.fixture.ts`: compile-time contract for `messages(sessionID)` and `provider` state.
- Modify `tests/compile-presentation.mjs`: compile the new pure model and mounted fixture into `.tmp-test`.
- Modify `shared/opencode-tools-shared.ts`: export the Context model function and types to the thin component.
- Modify `tui/runtime/manifest.ts`, `plugin-manifest.json`, and `package.json`: add the Context key, descriptor, export, artifact, and shifted neighboring orders.
- Modify `tests/plugin-manifest.test.mjs`, `tests/plugin-build.test.mjs`, `tests/plugin-deploy.test.mjs`, `tests/plugin-wiring.test.mjs`, and `tests/shared-boundary.test.mjs`: lock the manifest-driven build/deploy and shared-boundary contracts.
- Modify `README.md`: document Context features, opt-in registration, layouts, artifact, ordering, and rollback.

---

### Task 1: Context Metrics Model (OpenSpec 1.1-1.2)

**Files:**
- Create: `tests/context-model.test.mjs`
- Create: `tui/features/context.ts`
- Modify: `tests/compile-presentation.mjs:5-7,29-32`

**Interfaces:**
- Consumes: SDK v2 `Message`, `AssistantMessage`, and `Provider`; `formatCount(value: number, precision?: number): string`; `formatCurrency(value: number, precision?: number): string`.
- Produces: `createContextPanelModel(messages: readonly ContextMessage[], providers: readonly ContextProvider[]): ContextPanelModel`.
- Produces: `ContextPanelModel = { tokens: string; used: string; spent: string; summary: string }`.
- Invariant: inputs are read only and the returned object contains rendered strings, never SDK records.

- [x] **Step 1 (OpenSpec 1.1): Add the model compiler target and failing behavioral tests**

Add `context-model` to the cleanup list in `tests/compile-presentation.mjs` and this build tuple beside the other feature models:

```js
["tui/features/context.ts", ".tmp-test/context-model.mjs", ["browser"]],
```

Create `tests/context-model.test.mjs` with helpers and assertions covering all model rules:

```js
import assert from "node:assert/strict"
import test from "node:test"

const { createContextPanelModel } = await import("../.tmp-test/context-model.mjs")

function assistant(overrides = {}) {
  return {
    role: "assistant",
    providerID: "openai",
    modelID: "gpt-test",
    cost: 0,
    tokens: {
      total: 999_999,
      input: 0,
      output: 0,
      reasoning: 0,
      cache: { read: 0, write: 0 },
    },
    ...overrides,
  }
}

function provider(context, id = "openai", modelID = "gpt-test") {
  return { id, models: { [modelID]: { limit: { context } } } }
}

test("uses all detailed buckets from the newest positive assistant and preserves overflow", () => {
  const messages = [
    assistant({ cost: 0.4, tokens: { total: 1, input: 900, output: 0, reasoning: 0, cache: { read: 0, write: 0 } } }),
    { role: "user", cost: 999, tokens: { input: 999_999 } },
    assistant({
      cost: 0.6,
      tokens: { total: 7, input: 200, output: 300, reasoning: 100, cache: { read: 250, write: 200 } },
    }),
  ]

  assert.deepEqual(createContextPanelModel(messages, [provider(1_000)]), {
    tokens: "1K",
    used: "105%",
    spent: "$1.00",
    summary: "105%",
  })
})

test("ignores a newer zero-token assistant and uses the newest positive post-compaction total", () => {
  const messages = [
    assistant({ tokens: { input: 800, output: 0, reasoning: 0, cache: { read: 0, write: 0 } } }),
    assistant({ tokens: { input: 321, output: 1, reasoning: 0, cache: { read: 0, write: 0 } } }),
    assistant({ tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } } }),
  ]

  assert.equal(createContextPanelModel(messages, [provider(500)]).used, "64%")
})

test("returns placeholders and zero spend without a token-bearing assistant", () => {
  assert.deepEqual(createContextPanelModel([], []), {
    tokens: "-",
    used: "-",
    spent: "$0.00",
    summary: "-",
  })
  assert.deepEqual(createContextPanelModel([{ role: "user" }], [provider(1_000)]), {
    tokens: "-",
    used: "-",
    spent: "$0.00",
    summary: "-",
  })
})

test("keeps spend when provider, model, or context limit is unavailable", () => {
  const messages = [assistant({ cost: 1.25, tokens: { input: 10, output: 0, reasoning: 0, cache: { read: 0, write: 0 } } })]
  for (const providers of [
    [],
    [{ id: "other", models: {} }],
    [{ id: "openai", models: {} }],
    [provider(0)],
    [provider(Number.POSITIVE_INFINITY)],
  ]) {
    assert.deepEqual(createContextPanelModel(messages, providers), {
      tokens: "-",
      used: "-",
      spent: "$1.25",
      summary: "-",
    })
  }
})

test("ignores non-finite buckets and costs without mutating inputs", () => {
  const messages = Object.freeze([
    Object.freeze(assistant({
      cost: Number.NaN,
      tokens: Object.freeze({
        input: Number.NaN,
        output: 25,
        reasoning: Number.POSITIVE_INFINITY,
        cache: Object.freeze({ read: 25, write: Number.NEGATIVE_INFINITY }),
      }),
    })),
    Object.freeze(assistant({ cost: 0.125, tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } } })),
  ])

  assert.deepEqual(createContextPanelModel(messages, [provider(200)]), {
    tokens: "200",
    used: "25%",
    spent: "$0.13",
    summary: "25%",
  })
})

test("formats compact limits and rounds usage to the nearest integer", () => {
  const messages = [assistant({ tokens: { input: 205_000, output: 0, reasoning: 0, cache: { read: 0, write: 0 } } })]
  assert.deepEqual(createContextPanelModel(messages, [provider(322_000)]), {
    tokens: "322K",
    used: "64%",
    spent: "$0.00",
    summary: "64%",
  })
  assert.equal(createContextPanelModel(messages, [provider(1_500_000)]).tokens, "1.5M")
})
```

- [x] **Step 2: Run the model test to verify the red state**

Run:

```bash
node tests/compile-presentation.mjs && node --test tests/context-model.test.mjs
```

Expected: FAIL because `tui/features/context.ts` or `createContextPanelModel` does not exist.

- [x] **Step 3 (OpenSpec 1.2): Implement the minimal pure Context model**

Create `tui/features/context.ts`:

```ts
import type { AssistantMessage, Message, Provider } from "@opencode-ai/sdk/v2"

import { formatCount, formatCurrency } from "../presentation/format.js"

export type ContextMessage = Pick<Message, "role"> & Partial<Pick<
  AssistantMessage,
  "providerID" | "modelID" | "cost" | "tokens"
>>

export type ContextProvider = Pick<Provider, "id"> & {
  models: Record<string, {
    limit?: Partial<Pick<Provider["models"][string]["limit"], "context">>
  }>
}

export type ContextPanelModel = {
  tokens: string
  used: string
  spent: string
  summary: string
}

function finite(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0
}

function messageTokens(message: ContextMessage): number {
  const tokens = message.tokens
  if (!tokens) return 0
  return finite(tokens.input)
    + finite(tokens.output)
    + finite(tokens.reasoning)
    + finite(tokens.cache?.read)
    + finite(tokens.cache?.write)
}

export function createContextPanelModel(
  messages: readonly ContextMessage[],
  providers: readonly ContextProvider[],
): ContextPanelModel {
  let spent = 0
  let selected: { message: ContextMessage; tokens: number } | undefined

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index]
    if (message.role !== "assistant") continue
    spent += finite(message.cost)
    if (!selected) {
      const tokens = messageTokens(message)
      if (tokens > 0) selected = { message, tokens }
    }
  }

  const unavailable = { tokens: "-", used: "-", spent: formatCurrency(spent), summary: "-" }
  if (!selected) return unavailable

  const provider = providers.find((candidate) => candidate.id === selected.message.providerID)
  const limit = selected.message.modelID
    ? provider?.models[selected.message.modelID]?.limit?.context
    : undefined
  if (typeof limit !== "number" || !Number.isFinite(limit) || limit <= 0) return unavailable

  const used = `${Math.round((selected.tokens / limit) * 100)}%`
  return {
    tokens: formatCount(limit),
    used,
    spent: formatCurrency(spent),
    summary: used,
  }
}
```

- [x] **Step 4: Run the focused model tests and typecheck**

Run:

```bash
node tests/compile-presentation.mjs && node --test tests/context-model.test.mjs
npm run typecheck
```

Expected: both commands PASS. If the SDK's `Message` union makes `Pick<Message, "role">` unsuitable, retain the public function signature and replace only that alias with `{ role: Message["role"] } & Partial<Pick<AssistantMessage, ...>>`; do not widen the function to `unknown` or `Record<string, unknown>`.

- [x] **Step 5: Commit the model boundary**

```bash
git add tests/compile-presentation.mjs tests/context-model.test.mjs tui/features/context.ts
git commit -m "feat(context): add context metrics model"
```

### Task 2: Context TUI Component and Integration (OpenSpec 2.1-2.2, 3.1)

**Files:**
- Create: `tests/context-mounted.fixture.ts`
- Create: `tests/context-mounted.test.mjs`
- Create: `tests/context-state-types.fixture.ts`
- Create: `tui/context.tsx`
- Modify: `tests/compile-presentation.mjs:5-7,17-20`
- Modify: `plugin-manifest.json:25-48`
- Modify: `tui/runtime/manifest.ts:3`
- Modify: `package.json:7-14`
- Modify: `shared/opencode-tools-shared.ts:23-29`
- Modify: `tests/plugin-manifest.test.mjs:6-29`
- Modify: `tests/plugin-build.test.mjs:139-145,211-234`
- Modify: `tests/plugin-deploy.test.mjs:49-77` and all local/global fixture entry lists/assertions
- Modify: `tests/shared-boundary.test.mjs:100-185`

**Interfaces:**
- Consumes: `createContextPanelModel(messages, providers)`, `CompactPanel`, `defineTuiPlugin`, `pluginDescriptor("context")`, `TuiPluginApi.state.session.messages(sessionID)`, and `TuiPluginApi.state.provider`.
- Produces: manifest descriptor `{ id: "aamkye/opencode-tools-context", slotOrder: 112, options: "none" }` and shared-facade exports for the Context model.
- Produces: default standalone plugin with one `sidebar_content` slot and KV key `aamkye.opencode-tools-context.collapsed`.
- Produces: expanded rows in exact order `Tokens`, `Used`, `Spent`; collapsed summary equals `model.summary`.

Task 2 is one atomic integration checkpoint: add the mounted RED tests and component, then add packaging RED expectations before implementing the descriptor/shared-facade boundary. Do not commit or report Task 2 complete while `pluginDescriptor("context")` is unresolved.

- [x] **Step 1 (OpenSpec 2.1): Add the mounted compiler target and TUI state type fixture**

Add `context-mounted` to the cleanup list and this build tuple after the neighboring mounted fixtures in `tests/compile-presentation.mjs`:

```js
["tests/context-mounted.fixture.ts", ".tmp-test/context-mounted.mjs", ["browser"]],
```

Create `tests/context-state-types.fixture.ts`:

```ts
import type { Message, Provider } from "@opencode-ai/sdk/v2"
import type { TuiPluginApi } from "@opencode-ai/plugin/tui"

type Equal<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends
  (<Value>() => Value extends Right ? 1 : 2) ? true : false
type Expect<Value extends true> = Value

export type ContextMessagesAreReadonlySdkMessages = Expect<Equal<
  ReturnType<TuiPluginApi["state"]["session"]["messages"]>,
  readonly Message[]
>>
export type ContextMessagesRequireSessionID = Expect<Equal<
  Parameters<TuiPluginApi["state"]["session"]["messages"]>,
  [sessionID: string]
>>
export type ContextProvidersAreReadonlySdkProviders = Expect<Equal<
  TuiPluginApi["state"]["provider"],
  readonly Provider[]
>>

export function inspectContextState(api: TuiPluginApi, sessionID: string) {
  return { messages: api.state.session.messages(sessionID), providers: api.state.provider }
}
```

- [x] **Step 2 (OpenSpec 2.1): Create the reactive mounted fixture**

Create `tests/context-mounted.fixture.ts` with the same virtual JSX traversal contract used by current mounted tests, but make message and provider state independently reactive:

```ts
import { createRoot, createSignal } from "solid-js"

import contextPlugin from "../tui/context.js"

export type ContextFixtureMessage = {
  role: "assistant" | "user"
  providerID?: string
  modelID?: string
  cost?: number
  tokens?: {
    total?: number
    input: number
    output: number
    reasoning: number
    cache: { read: number; write: number }
  }
}
export type ContextFixtureProvider = {
  id: string
  models: Record<string, { limit?: { context?: number } }>
}
export type ContextFixtureOptions = {
  sessionID?: string
  sessions?: ReadonlyMap<string, readonly ContextFixtureMessage[]>
  providers?: readonly ContextFixtureProvider[]
  savedCollapsed?: boolean
  store?: Map<string, unknown>
}

type MountedElement = { type: string | ((props: Record<string, unknown>) => unknown); props: Record<string, unknown> }
type MountedNode = { element: MountedElement; parent?: MountedNode }
const COLLAPSED_KEY = "aamkye.opencode-tools-context.collapsed"
const LABELS = new Set(["Tokens", "Used", "Spent"])

function isElement(value: unknown): value is MountedElement {
  return typeof value === "object" && value !== null && "type" in value && "props" in value
}
function mount(value: unknown): unknown {
  if (!isElement(value) || typeof value.type !== "function") return value
  if (value.type.name === "Show") return value
  return mount(value.type(value.props))
}
function expand(value: unknown, parent?: MountedNode): MountedNode[] {
  if (typeof value === "function") return expand(value(), parent)
  if (Array.isArray(value)) return value.flatMap((child) => expand(child, parent))
  if (!isElement(value)) return []
  if (typeof value.type === "string") {
    const node = { element: value, parent }
    return [node, ...expand(value.props.children, node)]
  }
  if (value.type.name === "Show") {
    if (!value.props.when) return expand(value.props.fallback, parent)
    const render = value.props.children
    return expand(typeof render === "function" ? render(() => value.props.when) : render, parent)
  }
  return expand(value.type(value.props), parent)
}
function descendantsOf(nodes: readonly MountedNode[], parent: MountedNode): MountedNode[] {
  return nodes.filter((node) => {
    let current = node.parent
    while (current) {
      if (current === parent) return true
      current = current.parent
    }
    return false
  })
}
function textOf(node: MountedNode | undefined): string {
  return typeof node?.element.props.children === "string" ? node.element.props.children : ""
}

export async function mountContextPanel(options: ContextFixtureOptions = {}) {
  const [sessions, setSessions] = createSignal(options.sessions ?? new Map())
  const [providers, setProviders] = createSignal(options.providers ?? [])
  const store = options.store ?? new Map<string, unknown>()
  if (options.savedCollapsed !== undefined) store.set(COLLAPSED_KEY, options.savedCollapsed)
  const kvReads: string[] = []
  const kvWrites: Array<[string, unknown]> = []
  const messageCalls: string[] = []
  const registrations: Array<{
    order?: number
    slots: Record<string, (ctx: unknown, props: { session_id?: string }) => unknown>
  }> = []
  const controller = new AbortController()
  let cleanups: Array<() => void | Promise<void>> = []
  const api = {
    lifecycle: {
      signal: controller.signal,
      onDispose(cleanup: () => void | Promise<void>) {
        cleanups.push(cleanup)
        return () => { cleanups = cleanups.filter((candidate) => candidate !== cleanup) }
      },
    },
    slots: { register: (registration: typeof registrations[number]) => registrations.push(registration) },
    state: {
      get provider() { return providers() },
      session: {
        messages(sessionID: string) {
          messageCalls.push(sessionID)
          return sessions().get(sessionID) ?? []
        },
      },
    },
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
    theme: { current: { error: "#ff0000", warning: "#ffaa00", success: "#00ff00", text: "#ffffff", textMuted: "#888888" } },
  }

  await contextPlugin.tui(api as never, undefined, undefined)
  const slot = registrations[0]?.slots.sidebar_content
  if (!slot) throw new Error("Context sidebar slot was not registered")

  let tree: unknown
  let slotMounts = 0
  let disposeRoot: () => void = () => undefined
  createRoot((dispose) => {
    disposeRoot = dispose
    slotMounts += 1
    tree = mount(slot({}, options.sessionID ? { session_id: options.sessionID } : {}))
  })

  function view(width = 37) {
    const nodes = expand(tree)
    const header = nodes.find((node) => node.element.type === "box" && typeof node.element.props.onMouseDown === "function")
    const headerNodes = header ? descendantsOf(nodes, header) : []
    const marker = headerNodes.find((node) => ["▶ ", "▼ "].includes(textOf(node)))
    const title = headerNodes.find((node) => textOf(node) === "Context")
    const summary = headerNodes.find((node) => node.element.type === "text" && node !== marker && node !== title)
    const rows = nodes.filter((node) => node.element.type === "text" && LABELS.has(textOf(node))).map((label) => {
      const row = label.parent
      if (!row) throw new Error("Context label is missing its row")
      const value = nodes.find((node) => node.parent === row && node.element.type === "text" && node !== label)
      const labelText = textOf(label)
      const valueText = textOf(value)
      return {
        label: labelText,
        value: valueText,
        renderedText: `${labelText}${" ".repeat(Math.max(0, width - labelText.length - valueText.length))}${valueText}`,
        rowProps: row.element.props,
        labelProps: label.element.props,
        valueProps: value?.element.props ?? {},
      }
    })
    const dividers = nodes.filter((node) => node.element.type === "box"
      && node.element.props.width === "100%"
      && node.element.props.height === 1
      && (node.element.props.border as string[] | undefined)?.[0] === "top")
    return {
      marker: textOf(marker),
      title: textOf(title),
      summaryText: textOf(summary),
      rows,
      dividerCount: dividers.length,
      clickHeader() {
        const onMouseDown = header?.element.props.onMouseDown
        if (typeof onMouseDown !== "function") throw new Error("Context header is not interactive")
        onMouseDown()
      },
    }
  }

  return {
    pluginID: contextPlugin.id,
    registrations,
    kvReads,
    kvWrites,
    messageCalls,
    store,
    slotMounts: () => slotMounts,
    lifecycleCleanups: () => cleanups.length,
    lifecycleAborted: () => controller.signal.aborted,
    setSessionID(sessionID?: string) { slot({}, sessionID ? { session_id: sessionID } : {}) },
    setMessages(sessionID: string, messages: readonly ContextFixtureMessage[]) {
      setSessions((current) => new Map(current).set(sessionID, messages))
    },
    setProviders,
    view,
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

- [x] **Step 3 (OpenSpec 2.1): Add mounted red tests for layout, persistence, reactivity, and cleanup**

Create `tests/context-mounted.test.mjs`. Use one complete message helper and these assertions; keep each test independently disposable with `try/finally`:

```js
import assert from "node:assert/strict"
import test from "node:test"

globalThis.React = {
  createElement(type, props, ...children) {
    return { type, props: { ...props, children: children.length === 1 ? children[0] : children } }
  },
  Fragment: Symbol.for("react.fragment"),
}

const { mountContextPanel } = await import("../.tmp-test/context-mounted.mjs")
const provider = (context = 322_000) => ({ id: "openai", models: { gpt: { limit: { context } } } })
const message = ({ input = 205_000, cost = 1.25 } = {}) => ({
  role: "assistant",
  providerID: "openai",
  modelID: "gpt",
  cost,
  tokens: { input, output: 0, reasoning: 0, cache: { read: 0, write: 0 } },
})
const sessions = new Map([["session-a", [message()]])

test("registers at order 112 and renders the expanded metric contract", async () => {
  const mounted = await mountContextPanel({ sessionID: "session-a", sessions, providers: [provider()] })
  try {
    const view = mounted.view()
    assert.equal(mounted.pluginID, "aamkye/opencode-tools-context")
    assert.equal(mounted.registrations[0].order, 112)
    assert.deepEqual(Object.keys(mounted.registrations[0].slots), ["sidebar_content"])
    assert.equal(view.marker, "▼ ")
    assert.equal(view.title, "Context")
    assert.equal(view.summaryText, "")
    assert.deepEqual(view.rows.map(({ label, value }) => [label, value]), [
      ["Tokens", "322K"],
      ["Used", "64%"],
      ["Spent", "$1.25"],
    ])
    assert.equal(view.dividerCount, 2)
  } finally { await mounted.dispose() }
})

test("collapses to usage, persists the key, and restores on remount", async () => {
  const first = await mountContextPanel({ sessionID: "session-a", sessions, providers: [provider()] })
  const store = first.store
  assert.deepEqual(first.kvReads, ["aamkye.opencode-tools-context.collapsed"])
  first.view().clickHeader()
  assert.equal(first.view().marker, "▶ ")
  assert.equal(first.view().summaryText, "64%")
  assert.equal(first.view().rows.length, 0)
  assert.equal(first.view().dividerCount, 1)
  assert.deepEqual(first.kvWrites, [["aamkye.opencode-tools-context.collapsed", true]])
  await first.dispose()

  const second = await mountContextPanel({ sessionID: "session-a", sessions, providers: [provider()], store })
  try {
    assert.equal(second.view().marker, "▶ ")
    second.view().clickHeader()
    assert.equal(second.view().marker, "▼ ")
    assert.deepEqual(second.kvWrites, [["aamkye.opencode-tools-context.collapsed", false]])
  } finally { await second.dispose() }
})

test("renders and collapses unavailable state without an empty-session host call", async () => {
  const mounted = await mountContextPanel()
  try {
    assert.deepEqual(mounted.messageCalls, [])
    assert.deepEqual(mounted.view().rows.map(({ label, value }) => [label, value]), [
      ["Tokens", "-"], ["Used", "-"], ["Spent", "$0.00"],
    ])
    mounted.view().clickHeader()
    assert.equal(mounted.view().summaryText, "-")
  } finally { await mounted.dispose() }
})

test("switches sessions and reacts to messages and providers without remounting", async () => {
  const initial = new Map([
    ["session-a", [message()]],
    ["session-b", [message({ input: 50_000, cost: 0.5 })]],
  ])
  const mounted = await mountContextPanel({ sessionID: "session-a", sessions: initial, providers: [provider()] })
  try {
    assert.equal(mounted.view().rows[1].value, "64%")
    mounted.setSessionID("session-b")
    assert.deepEqual(mounted.view().rows.map((row) => row.value), ["322K", "16%", "$0.50"])
    mounted.setMessages("session-b", [message({ input: 100_000, cost: 0.75 })])
    assert.equal(mounted.view().rows[1].value, "31%")
    mounted.setProviders([provider(200_000)])
    assert.deepEqual(mounted.view().rows.map((row) => row.value), ["200K", "50%", "$0.75"])
    mounted.setSessionID()
    assert.deepEqual(mounted.view().rows.map((row) => row.value), ["-", "-", "$0.00"])
    assert.equal(mounted.messageCalls.includes(""), false)
    assert.equal(mounted.slotMounts(), 1)
  } finally { await mounted.dispose() }
})

test("right-anchors all metric values within 37 cells without trailing whitespace", async () => {
  const mounted = await mountContextPanel({ sessionID: "session-a", sessions, providers: [provider(1_500_000)] })
  try {
    for (const row of mounted.view(37).rows) {
      assert.equal(row.rowProps.width, "100%")
      assert.equal(row.rowProps.overflow, "hidden")
      assert.equal(row.labelProps.flexBasis, 0)
      assert.equal(row.labelProps.flexGrow, 1)
      assert.equal(row.labelProps.flexShrink, 1)
      assert.equal(row.labelProps.minWidth, 0)
      assert.equal(row.valueProps.flexShrink, 0)
      assert.equal(row.renderedText.length, 37)
      assert.equal(row.renderedText.trimEnd(), row.renderedText)
    }
  } finally { await mounted.dispose() }
})

test("disposes only the Solid root and host lifecycle", async () => {
  const mounted = await mountContextPanel({ sessionID: "session-a", sessions, providers: [provider()] })
  assert.equal(mounted.slotMounts(), 1)
  assert.equal(mounted.lifecycleAborted(), false)
  assert.ok(mounted.lifecycleCleanups() >= 1)
  await mounted.dispose()
  assert.equal(mounted.lifecycleAborted(), true)
  assert.equal(mounted.lifecycleCleanups(), 0)
})
```

- [x] **Step 4: Run the component tests to verify the red state**

Run:

```bash
node tests/compile-presentation.mjs && node --test tests/context-mounted.test.mjs
```

Expected: FAIL because `tui/context.tsx` and the production Context descriptor/shared exports are absent.

- [x] **Step 5 (OpenSpec 2.2): Implement the thin Context component**

Create `tui/context.tsx`:

```tsx
import { createMemo, createSignal, type JSX } from "solid-js"

import {
  CompactPanel,
  createContextPanelModel,
  defineTuiPlugin,
  pluginDescriptor,
} from "../shared/opencode-tools-shared.js"

const descriptor = pluginDescriptor("context")
const COLLAPSED_KEY = "aamkye.opencode-tools-context.collapsed"

function ContextMetricRow(props: { label: string; value: string }) {
  return (
    <box flexDirection="row" width="100%" overflow="hidden">
      <text flexBasis={0} flexGrow={1} flexShrink={1} minWidth={0}>{props.label}</text>
      <text flexShrink={0} wrapMode="none">{props.value}</text>
    </box>
  )
}

const plugin = defineTuiPlugin(descriptor, (_context, api) => {
  const [sessionID, setSessionID] = createSignal("")

  function ContextPanel() {
    const [collapsed, setCollapsed] = createSignal(api.kv.get(COLLAPSED_KEY, false))
    const model = createMemo(() => {
      const currentSessionID = sessionID()
      const messages = currentSessionID ? api.state.session.messages(currentSessionID) : []
      return createContextPanelModel(messages, api.state.provider)
    })
    const toggle = () => {
      const next = !collapsed()
      setCollapsed(next)
      api.kv.set(COLLAPSED_KEY, next)
    }
    const render = () => (
      <CompactPanel
        title="Context"
        collapsed={collapsed()}
        summary={collapsed() ? { text: model().summary } : undefined}
        onToggle={toggle}
        footerDivider={!collapsed()}
        theme={() => api.theme.current}
      >
        <ContextMetricRow label="Tokens" value={model().tokens} />
        <ContextMetricRow label="Used" value={model().used} />
        <ContextMetricRow label="Spent" value={model().spent} />
      </CompactPanel>
    )
    return render as unknown as JSX.Element
  }

  api.slots.register({
    order: descriptor.slotOrder,
    slots: {
      sidebar_content(_ctx, props) {
        setSessionID(props.session_id ?? "")
        return <ContextPanel />
      },
    },
  })
})

export default plugin
```

- [x] **Step 6: Continue directly into Task 2's integration steps before rerunning mounted tests**

Expected state: the component source is complete, but compilation may still fail at the intentional manifest/shared-facade integration seam. Do not add hard-coded plugin ID/order fallbacks and do not import `tui/features/context.ts` directly from the component.

#### Task 2 Integration: Plugin Packaging (OpenSpec 3.1)

**Files:**
- Modify: `plugin-manifest.json:25-48`
- Modify: `tui/runtime/manifest.ts:3`
- Modify: `package.json:7-14`
- Modify: `shared/opencode-tools-shared.ts:23-29`
- Modify: `tests/plugin-manifest.test.mjs:6-29`
- Modify: `tests/plugin-build.test.mjs:139-145,211-234`
- Modify: `tests/plugin-deploy.test.mjs:49-77` and all local/global fixture entry lists/assertions
- Modify: `tests/shared-boundary.test.mjs:100-185`

**Interfaces:**
- Produces descriptor: `{ key: "context", id: "aamkye/opencode-tools-context", source: "tui/context.tsx", outfile: "opencode-tools-context.js", slotOrder: 112, options: "none" }`.
- Produces package export: `"./context": "./tui/context.tsx"`.
- Produces shared facade exports: `createContextPanelModel`, `ContextMessage`, `ContextProvider`, `ContextPanelModel`.
- Preserves manifest-driven consumers: `build-plugins.mjs` and `deploy-plugins.mjs` require no direct source edits.

- [x] **Step 1 (OpenSpec 3.1): Add failing packaging, shared-boundary, build, and deployment expectations**

Update the expected manifest sequence in `tests/plugin-manifest.test.mjs` to:

```js
const expected = [
  ["quota", "aamkye/opencode-tools-quota", "tui/quota.tsx", "opencode-tools-quota.js", 110, "quota"],
  ["home", "aamkye/opencode-tools-home", "tui/home.tsx", "opencode-tools-home.js", 110, "none"],
  ["token-report", "aamkye/opencode-tools-token-report", "tui/token-report.tsx", "opencode-tools-token-report.js", undefined, "none"],
  ["mcp", "aamkye/opencode-tools-mcp", "tui/mcp.tsx", "opencode-tools-mcp.js", 111, "none"],
  ["context", "aamkye/opencode-tools-context", "tui/context.tsx", "opencode-tools-context.js", 112, "none"],
  ["lsp", "aamkye/opencode-tools-lsp", "tui/lsp.tsx", "opencode-tools-lsp.js", 113, "none"],
  ["todo", "aamkye/opencode-tools-todo", "tui/todo.tsx", "opencode-tools-todo.js", 114, "none"],
]
```

Update the package-export assertion in `tests/plugin-manifest.test.mjs` by inserting:

```js
"./context": "./tui/context.tsx",
```

Update `tests/plugin-build.test.mjs` to assert eight total artifacts, seven feature results, and this isolated registration entry:

```js
context: { slots: ["sidebar_content"], keymaps: 0 },
```

Extend `tests/shared-boundary.test.mjs` so `tui/context.tsx` is required to import only `../shared/opencode-tools-shared.js`, named-import and call `createContextPanelModel`, avoid `message.updated`, `setInterval`, and `setTimeout`, and so the shared facade must named-re-export `createContextPanelModel` from `../tui/features/context.js`.

Update `tests/plugin-deploy.test.mjs` in every managed-source, managed-artifact, fixture configuration, and expected-order list so Context appears once between MCP and LSP. Add this helper and invoke it for local, project-fallback, and global results:

```js
function assertPlainContextEntry(config) {
  const entries = config.plugin.filter((entry) => (Array.isArray(entry) ? entry[0] : entry) === "./opencode-tools-context.js")
  assert.deepEqual(entries, ["./opencode-tools-context.js"])
}
```

Add stale `opencode-tools-context.js` and `tui/context.tsx` files to each deployment fixture before deploying, then assert the manifest-driven deployment replaces the artifact, deduplicates source/output entries, preserves unrelated entries, and remains idempotent.

- [x] **Step 2: Run packaging tests to verify the red state**

Run:

```bash
node tests/compile-presentation.mjs && node --test tests/context-mounted.test.mjs tests/plugin-manifest.test.mjs tests/shared-boundary.test.mjs tests/plugin-build.test.mjs tests/plugin-deploy.test.mjs
```

Expected: FAIL on the missing Context manifest key/export/shared facade, old artifact counts, and old deploy expectations.

- [x] **Step 3 (OpenSpec 3.1): Register Context in the manifest, runtime key, package, and shared facade**

Insert this manifest entry after MCP in `plugin-manifest.json`, then change LSP to `113` and TODO to `114`:

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

Change `PluginKey` in `tui/runtime/manifest.ts` to:

```ts
export type PluginKey = "quota" | "home" | "token-report" | "mcp" | "context" | "lsp" | "todo"
```

Insert this export in `package.json` between MCP and LSP:

```json
"./context": "./tui/context.tsx",
```

Add these exports to `shared/opencode-tools-shared.ts` beside MCP/LSP/TODO:

```ts
export { createContextPanelModel } from "../tui/features/context.js";
export type {
  ContextMessage,
  ContextPanelModel,
  ContextProvider,
} from "../tui/features/context.js";
```

Do not edit `build-plugins.mjs` or `deploy-plugins.mjs`; their manifest-driven behavior is the contract under test.

- [x] **Step 4: Run the atomic component/packaging green checks**

Run:

```bash
node tests/compile-presentation.mjs && node --test tests/context-mounted.test.mjs tests/plugin-manifest.test.mjs tests/shared-boundary.test.mjs tests/plugin-build.test.mjs tests/plugin-deploy.test.mjs
npm run typecheck
```

Expected: PASS. Confirm the mounted suite reports one slot mount through session/message/provider changes and the build suite reports seven standalone feature artifacts plus `dist/opencode-tools-shared.js`.

- [x] **Step 5: Commit the component and packaging checkpoint**

```bash
git add package.json plugin-manifest.json shared/opencode-tools-shared.ts tui/context.tsx tui/runtime/manifest.ts tests/compile-presentation.mjs tests/context-mounted.fixture.ts tests/context-mounted.test.mjs tests/context-state-types.fixture.ts tests/plugin-build.test.mjs tests/plugin-deploy.test.mjs tests/plugin-manifest.test.mjs tests/shared-boundary.test.mjs
git commit -m "feat(context): add standalone context panel"
```

### Task 3: Plugin Documentation (OpenSpec 3.2)

**Files:**
- Modify: `tests/plugin-wiring.test.mjs:8-20,67-237`
- Modify: `README.md:8-11,60-92,117-167,211-425`

**Interfaces:**
- Documents the standalone Context artifact, registration entry, exact expanded/collapsed layouts, unavailable values, ordering, and rollback.
- Preserves all existing MCP/LSP/TODO documentation assertions.

- [x] **Step 1 (OpenSpec 3.2): Add failing README registration and layout assertions**

Extend `tests/plugin-wiring.test.mjs` to require:

```js
assert.equal(configuration.plugin.includes("./opencode-tools-context.js"), true)
assert.equal(readme.includes("`aamkye/opencode-tools-context`"), true)
assert.equal(readme.includes("remove `./opencode-tools-context.js`"), true)
```

Parse a `### Context sidebar layouts` section and assert these exact unpadded lines (the test may use `.padEnd(37)` only to calculate the expected visual allocation; the README code block itself must contain no trailing spaces):

```js
const expectedContextLayouts = new Map([
  ["Expanded", [
    "▼ Context",
    "-".repeat(37),
    "Tokens                           322K",
    "Used                              64%",
    "Spent                           $0.00",
    "-".repeat(37),
  ]],
  ["Collapsed", [
    "▶ Context                         64%",
    "-".repeat(37),
  ]],
])
```

Assert each line is at most 37 cells and `line.trimEnd() === line`, and keep existing MCP/LSP/TODO assertions intact with Context inserted between the LSP and MCP documentation sections.

- [x] **Step 2: Run the documentation contract test to verify the red state**

Run:

```bash
node --test tests/plugin-wiring.test.mjs
```

Expected: FAIL because README does not yet register or document Context.

- [x] **Step 3 (OpenSpec 3.2): Document Context as an opt-in standalone plugin**

Update `README.md` with all of the following concrete content:

- Add Context to the introductory feature list and add a `### Context` feature section describing reactive active-session metrics, newest positive assistant token selection, cumulative finite assistant spend, placeholders, and persisted collapse state.
- Insert `"./opencode-tools-context.js"` between MCP and LSP in the configuration example. State that Context accepts no options and has no built-in panel override to disable.
- Add `### Context sidebar layouts` with the exact expanded/collapsed blocks from Step 1, plus unavailable values `Tokens -`, `Used -`, `Spent $0.00`, and collapsed summary `-` in prose.
- Change all counts from six to seven standalone plugins and describe deployment migration to seven manifest entries.
- Add `opencode-tools-context.js` to the artifact tree and artifact table with runtime ID `aamkye/opencode-tools-context` and responsibility `Reactive active-session context and spend panel between MCP and LSP.`
- Add `tui/context.tsx` to the source table and change build/deploy source descriptions from six to seven plugins.
- Add rollback text: remove `./opencode-tools-context.js` from the `plugin` array and restart OpenCode; do not claim deployment edits `plugin_enabled`.

- [x] **Step 4: Run the documentation and wiring green checks**

Run:

```bash
node --test tests/plugin-wiring.test.mjs tests/plugin-manifest.test.mjs
```

Expected: PASS with exact unpadded Context layouts and unchanged neighboring plugin contracts.

- [x] **Step 5: Commit the documentation checkpoint**

```bash
git add README.md tests/plugin-wiring.test.mjs
git commit -m "docs(context): document standalone context plugin"
```

### Task 4: Verification (OpenSpec 4.1-4.2)

**Files:**
- Verify only: all files changed in Tasks 1-3
- Compare against: `openspec/changes/add-context-tui-plugin/specs/context-tui-panel/spec.md`
- Compare layout against: `AGENTS.md`

**Interfaces:**
- Verifies the public package/artifact boundary, reactive host-state boundary, pure model boundary, and 37-cell rendering contract.
- Produces no source edits unless a command exposes a concrete defect; fix any defect by returning to its owning Task's red-green cycle.

- [x] **Step 1 (OpenSpec 4.1): Run focused Context model and mounted tests**

Run:

```bash
node tests/compile-presentation.mjs && node --test tests/context-model.test.mjs tests/context-mounted.test.mjs
```

Expected: PASS with coverage for all five token buckets, ignored `tokens.total`, newest positive/post-compaction selection, raw `105%`, finite cost aggregation, unavailable metadata, session switching, store reactivity, persistence, 37-cell rows, and cleanup.

- [x] **Step 2 (OpenSpec 4.1): Run focused contract, manifest, build, and deploy tests**

Run:

```bash
node --test tests/plugin-manifest.test.mjs tests/shared-boundary.test.mjs tests/plugin-wiring.test.mjs tests/plugin-build.test.mjs tests/plugin-deploy.test.mjs
```

Expected: PASS; manifest order is MCP `111`, Context `112`, LSP `113`, TODO `114`; build emits `dist/opencode-tools-context.js`; deploy adds exactly one plain Context entry and preserves unrelated configuration.

- [x] **Step 3 (OpenSpec 4.2): Run the complete automated verification suite**

Run each command separately so failures retain a clear owner:

```bash
npm test
npm run typecheck
npm run build
```

Expected: all three commands exit `0`. `npm run build` emits seven minified standalone ESM plugins plus the shared artifact, and Context imports `./opencode-tools-shared.js` rather than bundling sibling features.

- [x] **Step 4 (OpenSpec 4.2): Inspect scenarios and generated-output hygiene**

Run:

```bash
git status --short
git diff --check
git diff --stat 84d66fc83c953441b52a6df98eb27c6b493dabac..HEAD
```

Expected:

- `git diff --check` prints nothing and exits `0`.
- No `.tmp-test/`, `dist/`, `tui.json`, `.opencode/`, `.comet.yaml`, package-lock, or OpenSpec artifact is staged or committed.
- The changed source/test/docs set matches the File Structure section of this plan.
- Manual code review can point each OpenSpec scenario to a model assertion, mounted assertion, packaging/deploy assertion, or exact README layout.

- [x] **Step 5: Record verification without an implementation change**

Do not create a verification-only commit. Preserve the passing command output for Comet verification, and leave OpenSpec task checkoff/state transitions to the execution workflow rather than editing them as part of this plan.

## Self-Review Checklist

- [x] Every OpenSpec item `1.1` through `4.2` has an explicit step and command.
- [x] The model uses detailed buckets, newest positive assistant selection, finite normalization, compact limit formatting, two-decimal spend, and unclamped rounded usage.
- [x] The component performs no domain calculation, host subscription, timer, network request, or invalid empty-session lookup.
- [x] Expanded/collapsed arrows, three-row order, summary, dividers, persistence, and reactive state changes match the design.
- [x] Manifest, package export, runtime key, shared facade, build, deploy, docs, and shifted neighboring orders change together.
- [x] Focused tests precede implementation and full verification follows focused green checks.
- [x] No generated output, user configuration, Comet state, OpenSpec artifact, dependency, or lockfile is included.
