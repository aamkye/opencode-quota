import { createRoot, createSignal } from "solid-js"

import mcpPlugin from "../tui/mcp.js"

type McpEntry = {
  name: string
  status: string
  error?: string
}

type MountedElement = {
  type: string | ((props: Record<string, unknown>) => unknown)
  props: Record<string, unknown>
}

type MountedNode = {
  element: MountedElement
  parent?: MountedNode
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
    if (!value.props.when) return []
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

function truncate(text: string, width: number): string {
  if (text.length <= width) return text
  if (width <= 0) return ""
  if (width === 1) return "…"
  return `${text.slice(0, width - 1)}…`
}

function createLifecycle() {
  const controller = new AbortController()
  let cleanups: Array<() => void | Promise<void>> = []

  return {
    api: {
      signal: controller.signal,
      onDispose(cleanup: () => void | Promise<void>) {
        cleanups.push(cleanup)
        return () => {
          cleanups = cleanups.filter((candidate) => candidate !== cleanup)
        }
      },
    },
    async dispose() {
      controller.abort()
      const queue = cleanups.reverse()
      cleanups = []
      for (const cleanup of queue) await cleanup()
    },
  }
}

export async function mountMcpPanel(options: {
  sessionID?: string
  entries?: readonly McpEntry[]
  defaultState?: unknown
  savedCollapsed?: boolean
  store?: Map<string, unknown>
} = {}) {
  const [entries, setEntries] = createSignal<readonly McpEntry[]>(options.entries ?? [])
  const lifecycle = createLifecycle()
  const store = options.store ?? new Map<string, unknown>()
  if (options.savedCollapsed !== undefined) {
    store.set("aamkye.opencode-tools-mcp.collapsed", options.savedCollapsed)
  }
  const kvWrites: Array<[string, unknown]> = []
  const kvReads: string[] = []
  const registrations: Array<{
    order?: number
    slots: Record<string, (ctx?: unknown, props?: { session_id?: string }) => unknown>
  }> = []
  const theme = {
    error: "#ff0000",
    warning: "#ffaa00",
    success: "#00ff00",
    text: "#ffffff",
    textMuted: "#888888",
  }
  const api = {
    lifecycle: lifecycle.api,
    slots: {
      register(registration: { order?: number; slots: Record<string, () => unknown> }) {
        registrations.push(registration)
      },
    },
    state: {
      mcp: entries,
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

  await mcpPlugin.tui(api as never, { defaultState: options.defaultState }, undefined)
  const slot = registrations[0]?.slots.sidebar_content
  if (!slot) throw new Error("MCP sidebar slot was not registered")

  let disposeRoot: () => void = () => undefined
  let tree: unknown
  let slotMounts = 0
  createRoot((dispose) => {
    disposeRoot = dispose
    slotMounts += 1
    tree = mount(slot({}, options.sessionID ? { session_id: options.sessionID } : {}))
  })

  function nodes(): MountedNode[] {
    return expand(tree)
  }

  function view() {
    const mounted = nodes()
    const header = mounted.find((node) => node.element.type === "box" && typeof node.element.props.onMouseDown === "function")
    const headerNodes = header ? descendantsOf(mounted, header) : []
    const marker = headerNodes.find((node) => node.element.type === "text" && ["▶ ", "▼ "].includes(textOf(node)))
    const summaryNodes = headerNodes.filter((node) =>
      node.element.type === "text"
      && node !== marker
      && textOf(node) !== "MCP")
    const bullets = mounted.filter((node) => node.element.type === "text" && textOf(node) === "• ")
    const rows = bullets.map((bullet) => {
      const row = bullet.parent
      if (!row) throw new Error("status bullet is missing its row")
      const children = mounted.filter((node) => node.parent === row)
      const name = children.find((node) => node.element.type === "text" && node !== bullet && textOf(node) !== " ")
      const labelBox = children.find((node) => node.element.type === "box")
      const label = mounted.find((node) => node.parent === labelBox && node.element.type === "text")
      const bulletWidth = Number(bullet.element.props.width)
      const gapWidth = children
        .filter((node) => node.element.type === "text" && textOf(node) === " ")
        .reduce((total, node) => total + Number(node.element.props.width), 0)
      const labelWidth = Number(labelBox?.element.props.width)
      const fixedNameWidth = Number(name?.element.props.width)
      const nameWidth = Number.isFinite(fixedNameWidth)
        ? fixedNameWidth
        : Math.max(0, 37 - bulletWidth - gapWidth - labelWidth)
      const renderedName = truncate(textOf(name), nameWidth).padEnd(nameWidth)
      return {
        name: textOf(name),
        label: textOf(label),
        bullet: textOf(bullet),
        bulletColor: bullet.element.props.fg,
        labelColor: label?.element.props.fg,
        cells: bulletWidth + nameWidth + gapWidth + labelWidth,
        text: `${textOf(bullet)}${renderedName}${" ".repeat(gapWidth)}${textOf(label)}`,
      }
    })
    const dividers = mounted.filter((node) =>
      node.element.type === "box"
      && node.element.props.width === "100%"
      && node.element.props.height === 1
      && (node.element.props.border as string[] | undefined)?.[0] === "top")

    return {
      marker: textOf(marker),
      summaryText: summaryNodes.map(textOf).join(""),
      summarySegments: summaryNodes.map((node) => [textOf(node), node.element.props.fg]),
      rows,
      dividerCount: dividers.length,
      clickHeader() {
        const onMouseDown = header?.element.props.onMouseDown
        if (typeof onMouseDown !== "function") throw new Error("MCP header is not interactive")
        onMouseDown()
      },
    }
  }

  return {
    pluginID: mcpPlugin.id,
    registrations,
    kvReads,
    kvWrites,
    store,
    setMcp: setEntries,
    setSessionID(sessionID?: string) {
      slot({}, sessionID ? { session_id: sessionID } : {})
    },
    slotMounts: () => slotMounts,
    view,
    async dispose() {
      disposeRoot()
      await lifecycle.dispose()
    },
  }
}
