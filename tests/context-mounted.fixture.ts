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
const LABELS = new Set(["Limit", "Tokens", "Used", "Spent"])

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
        valueColor: value?.element.props.fg,
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
      summaryColor: summary?.element.props.fg,
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
