import { createRoot } from "solid-js"

import {
  createSesTokensSource,
  type SesTokensSourceDependencies,
} from "../shared/opencode-tools-shared.js"
import sesTokensPlugin, { sesTokensSourceTestKey } from "../tui/ses-tokens.js"

type MountedElement = {
  type: string | ((props: Record<string, unknown>) => unknown)
  props: Record<string, unknown>
}
type MountedNode = { element: MountedElement; parent?: MountedNode }
type ClientResult<Data> = { data?: Data; error?: unknown }
type Timer = { callback: () => void; cancelled: boolean; delay: number }

const LABELS = new Set([
  "↻ turns",
  "↑ in",
  "↓ out",
  "▤ cache write",
  "▤ cache read",
  "ø cache hit ratio",
  "✦ think",
  "Σ total",
])
const COLLAPSED_KEY = "aamkye.opencode-tools-ses-tokens.collapsed"

function assistantMessage(sessionID: string, index: number, tokens: {
  input: number
  output: number
  reasoning: number
  cache: { read: number; write: number }
}) {
  return {
    id: `${sessionID}-message-${index}`,
    sessionID,
    role: "assistant" as const,
    time: { created: index, completed: index },
    parentID: "",
    modelID: "gpt",
    providerID: "openai",
    mode: "build",
    agent: "build",
    path: { cwd: "/repo", root: "/repo" },
    cost: 0,
    tokens,
    finish: "stop",
  }
}

export const readyMessages = Array.from({ length: 97 }, (_, index) => assistantMessage(
  "session-a",
  index,
  index === 0
    ? { input: 4_400_000, output: 18_600, reasoning: 2_800, cache: { read: 24_700_000, write: 0 } }
    : { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } },
))

export function oneMessage(sessionID: string, input: number) {
  return [assistantMessage(sessionID, 0, {
    input,
    output: 0,
    reasoning: 0,
    cache: { read: 0, write: 0 },
  })]
}

function isElement(value: unknown): value is MountedElement {
  return typeof value === "object" && value !== null && "type" in value && "props" in value
}

function mount(value: unknown): unknown {
  if (!isElement(value) || typeof value.type !== "function") return value
  if (["For", "Show"].includes(value.type.name)) return value
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
  if (value.type.name === "For") {
    const items = value.props.each as readonly unknown[]
    const render = value.props.children as (item: unknown, index: () => number) => unknown
    return items.flatMap((item, index) => expand(render(item, () => index), parent))
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

async function settle() {
  await new Promise((resolve) => setImmediate(resolve))
}

export async function mountSesTokensPanel(options: {
  sessionID?: string
  savedCollapsed?: boolean
  store?: Map<string, unknown>
} = {}) {
  const store = options.store ?? new Map<string, unknown>()
  if (options.savedCollapsed !== undefined) store.set(COLLAPSED_KEY, options.savedCollapsed)
  const kvReads: string[] = []
  const kvWrites: Array<[string, unknown]> = []
  const listCalls: Array<{ directory?: string }> = []
  const messageCalls: Array<{ sessionID: string; directory?: string }> = []
  const pendingLists: Array<(result: ClientResult<readonly unknown[]>) => void> = []
  const pendingMessages: Array<{
    sessionID: string
    resolve(result: ClientResult<readonly { info: unknown }[]>): void
  }> = []
  const handlers = new Map<string, (event: unknown) => void>()
  const unsubscribeCounts = new Map<string, number>()
  const timers: Timer[] = []
  const registrations: Array<{
    order?: number
    slots: Record<string, (ctx: unknown, props: { session_id?: string }) => unknown>
  }> = []
  const controller = new AbortController()
  let cleanups: Array<() => void | Promise<void>> = []

  const scheduler = {
    setTimer(callback: () => void, delay: number) {
      const timer = { callback, cancelled: false, delay }
      timers.push(timer)
      return timer
    },
    clearTimer(timer: unknown) {
      if (typeof timer === "object" && timer !== null && "cancelled" in timer) {
        ;(timer as Timer).cancelled = true
      }
    },
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
    state: { path: { directory: "/repo" } },
    client: {
      session: {
        list(input: { directory?: string }) {
          listCalls.push(input)
          return new Promise<ClientResult<readonly unknown[]>>((resolve) => pendingLists.push(resolve))
        },
        messages(input: { sessionID: string; directory?: string }) {
          messageCalls.push(input)
          return new Promise<ClientResult<readonly { info: unknown }[]>>((resolve) => {
            pendingMessages.push({ sessionID: input.sessionID, resolve })
          })
        },
      },
    },
    event: {
      on(type: string, handler: (event: unknown) => void) {
        if (handlers.has(type)) throw new Error(`${type} registered more than once`)
        handlers.set(type, handler)
        unsubscribeCounts.set(type, 0)
        let unsubscribed = false
        return () => {
          if (unsubscribed) return
          unsubscribed = true
          unsubscribeCounts.set(type, (unsubscribeCounts.get(type) ?? 0) + 1)
          if (handlers.get(type) === handler) handlers.delete(type)
        }
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
    theme: {
      current: {
        error: "#ff0000",
        warning: "#ffaa00",
        success: "#00ff00",
        text: "#ffffff",
        textMuted: "#888888",
      },
    },
  }
  const meta = {
    [sesTokensSourceTestKey]: (dependencies: SesTokensSourceDependencies) => createSesTokensSource({
      ...dependencies,
      setTimer: scheduler.setTimer,
      clearTimer: scheduler.clearTimer,
    }),
  }

  await sesTokensPlugin.tui(api as never, undefined, meta)
  const slot = registrations[0]?.slots.sidebar_content
  if (!slot) throw new Error("SesTokens sidebar slot was not registered")

  let tree: unknown
  let mountedTree = false
  let slotMounts = 0
  let disposeRoot: () => void = () => undefined
  createRoot((dispose) => {
    disposeRoot = dispose
    slotMounts += 1
    const result = slot({}, options.sessionID ? { session_id: options.sessionID } : {})
    if (result !== null) {
      tree = mount(result)
      mountedTree = true
    }
  })

  function view(width = 37) {
    const nodes = expand(tree)
    const header = nodes.find((node) => node.element.type === "box" && typeof node.element.props.onMouseDown === "function")
    const headerNodes = header ? descendantsOf(nodes, header) : []
    const marker = headerNodes.find((node) => ["▶ ", "▼ "].includes(textOf(node)))
    const title = headerNodes.find((node) => textOf(node) === "SesTokens")
    const detail = headerNodes.find((node) => textOf(node) === "stale")
    const summaryNodes = headerNodes.filter((node) => (
      node.element.type === "text"
      && node !== marker
      && node !== title
      && node !== detail
      && textOf(node).trim() !== ""
    ))
    const fallback = nodes.find((node) => ["Loading...", "Usage unavailable"].includes(textOf(node)))
    const rows = nodes
      .filter((node) => node.element.type === "text" && LABELS.has(textOf(node)))
      .map((label) => {
        const row = label.parent
        if (!row) throw new Error("SesTokens label is missing its row")
        const value = nodes.find((node) => node.parent === row && node.element.type === "text" && node !== label)
        const labelText = textOf(label)
        const valueText = textOf(value)
        const renderedText = `${labelText}${" ".repeat(Math.max(0, width - labelText.length - valueText.length))}${valueText}`
        return {
          label: labelText,
          value: valueText,
          renderedText,
          cells: [...renderedText].length,
          rowProps: row.element.props,
          labelProps: label.element.props,
          valueProps: value?.element.props ?? {},
        }
      })
    const dividers = nodes.filter((node) => (
      node.element.type === "box"
      && node.element.props.width === "100%"
      && node.element.props.height === 1
      && (node.element.props.border as string[] | undefined)?.[0] === "top"
    ))
    return {
      marker: textOf(marker),
      title: textOf(title),
      detailText: textOf(detail),
      detailColor: detail?.element.props.fg,
      summaryText: summaryNodes.map(textOf).join(""),
      summarySegments: summaryNodes.map((node) => ({ text: textOf(node), color: node.element.props.fg })),
      summaryColors: summaryNodes.map((node) => node.element.props.fg),
      fallbackText: textOf(fallback),
      fallbackColor: fallback?.element.props.fg,
      rows,
      renderedWidth: Math.max(0, ...rows.map((row) => row.cells)),
      dividerCount: dividers.length,
      clickHeader() {
        const onMouseDown = header?.element.props.onMouseDown
        if (typeof onMouseDown !== "function") throw new Error("SesTokens header is not interactive")
        onMouseDown()
      },
    }
  }

  return {
    pluginID: sesTokensPlugin.id,
    registrations,
    kvReads,
    kvWrites,
    store,
    listCalls,
    messageCalls,
    slotMounts: () => slotMounts,
    lifecycleCleanups: () => cleanups.length,
    lifecycleAborted: () => controller.signal.aborted,
    registeredTypes: () => [...handlers.keys()],
    unsubscribeCount: (type: string) => unsubscribeCounts.get(type) ?? 0,
    pendingDelays: () => timers.filter((timer) => !timer.cancelled).map((timer) => timer.delay),
    setSessionID(sessionID?: string) {
      const result = slot({}, sessionID ? { session_id: sessionID } : {})
      if (!mountedTree && result !== null) {
        tree = mount(result)
        mountedTree = true
      }
      return result
    },
    emit(event: { type: string; properties: Record<string, unknown> }) {
      handlers.get(event.type)?.(event)
    },
    async resolveList(result: ClientResult<readonly unknown[]> = { data: [{ id: options.sessionID ?? "session-a" }] }) {
      const resolve = pendingLists.shift()
      if (!resolve) throw new Error("No pending session.list call")
      resolve(result)
      await settle()
    },
    async resolveMessages(
      sessionID: string,
      result: ClientResult<readonly { info: unknown }[]> = { data: readyMessages.map((info) => ({ info })) },
    ) {
      const index = pendingMessages.findIndex((pending) => pending.sessionID === sessionID)
      if (index < 0) throw new Error(`No pending session.messages call for ${sessionID}`)
      const [pending] = pendingMessages.splice(index, 1)
      pending.resolve(result)
      await settle()
    },
    async runTimer(delay: number) {
      const timer = timers.find((candidate) => !candidate.cancelled && candidate.delay === delay)
      if (!timer) throw new Error(`No pending ${delay} ms timer`)
      timer.cancelled = true
      timer.callback()
      await settle()
    },
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
