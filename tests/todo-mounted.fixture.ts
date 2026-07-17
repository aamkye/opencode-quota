import type { Todo } from "@opencode-ai/sdk/v2"
import { createRoot, createSignal } from "solid-js"

import todoPlugin from "../tui/todo.js"

export type TodoFixtureRecord = Todo

export type TodoFixtureOptions = {
  sessionID?: string
  records?: readonly TodoFixtureRecord[]
  sessions?: ReadonlyMap<string, readonly TodoFixtureRecord[]>
  savedCollapsed?: boolean
  store?: Map<string, unknown>
}

type MountedElement = {
  type: string | ((props: Record<string, unknown>) => unknown)
  props: Record<string, unknown>
}

type MountedNode = {
  element: MountedElement
  parent?: MountedNode
}

const COLLAPSED_KEY = "aamkye.opencode-tools-todo.collapsed"
const MARKERS = new Set(["[✓] ", "[•] ", "[ ] ", "[-] "])

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

function wrapWords(text: string, width: number): string[] {
  if (width <= 0) return [""]
  const lines: string[] = []
  let remaining = text
  while (remaining.length > width) {
    const candidate = remaining.slice(0, width + 1)
    const split = candidate.lastIndexOf(" ")
    const end = split > 0 ? split : width
    lines.push(remaining.slice(0, end))
    remaining = remaining.slice(end).trimStart()
  }
  lines.push(remaining)
  return lines
}

export async function mountTodoPanel(options: TodoFixtureOptions = {}) {
  const initialSessionID = options.sessionID
  const initial = new Map(options.sessions ?? [])
  if (initialSessionID && options.records) initial.set(initialSessionID, options.records)
  const [sessions, setSessions] = createSignal<ReadonlyMap<string, readonly TodoFixtureRecord[]>>(initial)
  const store = options.store ?? new Map<string, unknown>()
  if (options.savedCollapsed !== undefined) store.set(COLLAPSED_KEY, options.savedCollapsed)
  const kvWrites: Array<[string, unknown]> = []
  const kvReads: string[] = []
  const todoCalls: string[] = []
  const registrations: Array<{
    order?: number
    slots: Record<string, (ctx: unknown, props: { session_id?: string }) => unknown>
  }> = []
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
    state: {
      session: {
        todo(sessionID: string) {
          todoCalls.push(sessionID)
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
    theme: { current: theme },
  }

  await todoPlugin.tui(api as never, undefined, undefined)
  const slot = registrations[0]?.slots.sidebar_content
  if (!slot) throw new Error("TODO sidebar slot was not registered")

  let disposeRoot: () => void = () => undefined
  let tree: unknown
  let slotMounts = 0
  createRoot((dispose) => {
    disposeRoot = dispose
    slotMounts += 1
    tree = mount(slot({}, initialSessionID ? { session_id: initialSessionID } : {}))
  })

  function view(width = 37) {
    const mounted = expand(tree)
    const header = mounted.find((node) => node.element.type === "box" && typeof node.element.props.onMouseDown === "function")
    const headerNodes = header ? descendantsOf(mounted, header) : []
    const marker = headerNodes.find((node) => node.element.type === "text" && ["▶ ", "▼ "].includes(textOf(node)))
    const summary = headerNodes.find((node) => node.element.type === "text" && node !== marker && textOf(node) !== "TODO")
    const hint = mounted.find((node) => node.element.type === "text" && textOf(node) === "No TODOs for this session")
    const statusMarkers = mounted.filter((node) => node.element.type === "text" && MARKERS.has(textOf(node)))
    const rows = statusMarkers.map((statusMarker) => {
      const row = statusMarker.parent
      if (!row) throw new Error("TODO marker is missing its row")
      const content = mounted.find((node) => node.parent === row && node.element.type === "text" && node !== statusMarker)
      const markerWidth = Number(statusMarker.element.props.width)
      const contentWidth = Math.max(0, width - markerWidth)
      const wrapped = wrapWords(textOf(content), contentWidth)
      return {
        marker: textOf(statusMarker),
        markerColor: statusMarker.element.props.fg,
        markerProps: statusMarker.element.props,
        content: textOf(content),
        contentProps: content?.element.props ?? {},
        rowProps: row.element.props,
        renderedLines: wrapped.map((line, index) => `${index === 0 ? textOf(statusMarker) : " ".repeat(markerWidth)}${line}`),
      }
    })
    const dividers = mounted.filter((node) => (
      node.element.type === "box"
      && node.element.props.width === "100%"
      && node.element.props.height === 1
      && (node.element.props.border as string[] | undefined)?.[0] === "top"
    ))

    return {
      marker: textOf(marker),
      summaryText: textOf(summary),
      hint: textOf(hint),
      hintColor: hint?.element.props.fg,
      rows,
      dividerCount: dividers.length,
      clickHeader() {
        const onMouseDown = header?.element.props.onMouseDown
        if (typeof onMouseDown !== "function") throw new Error("TODO header is not interactive")
        onMouseDown()
      },
    }
  }

  return {
    pluginID: todoPlugin.id,
    registrations,
    kvReads,
    kvWrites,
    store,
    todoCalls,
    slotMounts: () => slotMounts,
    lifecycleCleanups: () => cleanups.length,
    lifecycleAborted: () => controller.signal.aborted,
    setSessionID(sessionID?: string) {
      slot({}, sessionID ? { session_id: sessionID } : {})
    },
    setTodos(sessionID: string, records: readonly TodoFixtureRecord[]) {
      setSessions((current) => {
        const next = new Map(current)
        next.set(sessionID, records)
        return next
      })
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
