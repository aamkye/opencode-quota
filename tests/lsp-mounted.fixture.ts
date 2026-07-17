import { createRoot, createSignal } from "solid-js"

import lspPlugin from "../tui/lsp.js"

export type LspFixtureEntry = {
  id: string
  name: string
  root: string
  status: string
}

export type LspFixtureOptions = {
  entries?: readonly LspFixtureEntry[]
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

type LspView = {
  marker: string
  summaryText: string
  summaryColors: Array<string | undefined>
  hint: string
  hintColor: unknown
  dividerCount: number
  rows: Array<{
    id: string
    bullet: string
    bulletColor: unknown
    renderedText: string
    cells: number
    idProps: Record<string, unknown>
  }>
  clickHeader(): void
}

const COLLAPSED_KEY = "aamkye.opencode-tools-lsp.collapsed"

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

function truncate(text: string, width: number): string {
  if (text.length <= width) return text
  if (width <= 0) return ""
  if (width === 1) return "…"
  return `${text.slice(0, width - 1)}…`
}

function readLspView(tree: unknown, width: number): LspView {
  const mounted = expand(tree)
  const header = mounted.find((node) => node.element.type === "box" && typeof node.element.props.onMouseDown === "function")
  const headerNodes = header ? descendantsOf(mounted, header) : []
  const marker = headerNodes.find((node) => node.element.type === "text" && ["▶ ", "▼ "].includes(textOf(node)))
  const summaryNodes = headerNodes.filter((node) => (
    node.element.type === "text"
    && node !== marker
    && textOf(node) !== "LSP"
  ))
  const hint = mounted.find((node) => node.element.type === "text" && textOf(node) === "LSPs will activate as files are read")
  const bullets = mounted.filter((node) => node.element.type === "text" && textOf(node) === "• ")
  const rows = bullets.map((bullet) => {
    const row = bullet.parent
    if (!row) throw new Error("LSP status bullet is missing its row")
    const id = mounted.find((node) => node.parent === row && node.element.type === "text" && node !== bullet)
    const bulletWidth = Number(bullet.element.props.width)
    const available = Math.max(0, width - bulletWidth)
    const renderedID = truncate(textOf(id), available)
    return {
      id: textOf(id),
      bullet: textOf(bullet),
      bulletColor: bullet.element.props.fg,
      renderedText: `${textOf(bullet)}${renderedID}`,
      cells: bulletWidth + renderedID.length,
      idProps: id?.element.props ?? {},
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
    summaryText: summaryNodes.map(textOf).join(""),
    summaryColors: summaryNodes.map((node) => node.element.props.fg as string | undefined),
    hint: textOf(hint),
    hintColor: hint?.element.props.fg,
    dividerCount: dividers.length,
    rows,
    clickHeader() {
      const onMouseDown = header?.element.props.onMouseDown
      if (typeof onMouseDown !== "function") throw new Error("LSP header is not interactive")
      onMouseDown()
    },
  }
}

export async function mountLspPanel(options: LspFixtureOptions = {}) {
  const [entries, setEntries] = createSignal<readonly LspFixtureEntry[]>(options.entries ?? [])
  const store = options.store ?? new Map<string, unknown>()
  if (options.savedCollapsed !== undefined) store.set(COLLAPSED_KEY, options.savedCollapsed)
  const kvWrites: Array<[string, unknown]> = []
  const kvReads: string[] = []
  const registrations: Array<{ order?: number; slots: Record<string, () => unknown> }> = []
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
    state: { lsp: entries },
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

  await lspPlugin.tui(api as never, undefined, undefined)
  const slot = registrations[0]?.slots.sidebar_content
  if (!slot) throw new Error("LSP sidebar slot was not registered")

  let disposeRoot: () => void = () => undefined
  let tree: unknown
  let slotMounts = 0
  createRoot((dispose) => {
    disposeRoot = dispose
    slotMounts += 1
    tree = mount(slot())
  })

  return {
    pluginID: lspPlugin.id,
    registrations,
    kvReads,
    kvWrites,
    store,
    setLsp: setEntries,
    slotMounts: () => slotMounts,
    lifecycleCleanups: () => cleanups.length,
    lifecycleAborted: () => controller.signal.aborted,
    view: (width = 37) => readLspView(tree, width),
    async dispose() {
      disposeRoot()
      controller.abort()
      const queue = cleanups.reverse()
      cleanups = []
      for (const cleanup of queue) await cleanup()
    },
  }
}
