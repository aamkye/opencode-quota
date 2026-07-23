import { createSignal } from "solid-js/dist/solid.js"

import {
  createComponent,
  createHostNode,
  render,
  type HostNode,
} from "./opentui-solid-host-runtime.fixture.js"
import {
  createSesTokensSource,
  type SesTokensSourceDependencies,
} from "../shared/opencode-tools-shared.js"
import sesTokensPlugin, { sesTokensSourceTestKey } from "../tui/ses-tokens.js"

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
    ? { input: 4_410_000, output: 18_690, reasoning: 2_870, cache: { read: 24_770_000, write: 0 } }
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

function descendants(root: HostNode): HostNode[] {
  return [root, ...root.children.flatMap(descendants)]
}

function textOf(node: HostNode | undefined): string {
  if (!node) return ""
  if (node.type === "#text") return String(node.props.value ?? "")
  return node.children.map(textOf).join("")
}

function mountedTextNodes(root: HostNode): HostNode[] {
  return descendants(root).filter((node) => node.type === "text")
}

function cellWidth(text: string): number {
  return [...text].length
}

function resolvedWidth(value: unknown, parentWidth: number): number {
  if (typeof value === "number") return value
  if (typeof value === "string" && value.endsWith("%")) {
    return Math.floor(parentWidth * Number.parseFloat(value) / 100)
  }
  return 0
}

function rowLayout(row: HostNode, width: number) {
  const rowWidth = resolvedWidth(row.props.width, width)
  const cells = row.children.filter((child) => child.type !== "#text")
  const fixedWidths = cells.map((cell) => {
    const configured = resolvedWidth(cell.props.width, rowWidth)
    if (configured > 0) return configured
    return Number(cell.props.flexGrow ?? 0) > 0 ? undefined : cellWidth(textOf(cell))
  })
  const fixedTotal = fixedWidths.reduce<number>((total, childWidth) => total + (childWidth ?? 0), 0)
  const growTotal = cells.reduce((total, cell, index) => (
    total + (fixedWidths[index] === undefined ? Number(cell.props.flexGrow ?? 0) : 0)
  ), 0)
  const remaining = Math.max(0, rowWidth - fixedTotal)
  const childWidths = cells.map((cell, index) => fixedWidths[index] ?? (
    growTotal > 0 ? Math.floor(remaining * Number(cell.props.flexGrow ?? 0) / growTotal) : 0
  ))
  const renderedText = cells.map((cell, index) => {
    const text = textOf(cell)
    const allocated = childWidths[index]
    if (cellWidth(text) >= allocated) return [...text].slice(0, allocated).join("")
    return Number(cell.props.flexGrow ?? 0) > 0 ? text.padEnd(allocated) : text
  }).join("")
  return { cells, childWidths, renderedText, rowWidth }
}

async function settle() {
  await new Promise((resolve) => setImmediate(resolve))
}

export async function mountSesTokensPanel(options: {
  sessionID?: string
  defaultState?: unknown
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
  const registrationCounts = new Map<string, number>()
  const unsubscribeCounts = new Map<string, number>()
  const timers: Timer[] = []
  const registrations: Array<{
    order?: number
    slots: Record<string, (ctx: unknown, props: { session_id?: string }) => unknown>
  }> = []
  const controller = new AbortController()
  let cleanups: Array<() => void | Promise<void>> = []
  let sourceFactoryCallCount = 0
  let slotRenderCount = 0

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
        registrationCounts.set(type, (registrationCounts.get(type) ?? 0) + 1)
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
    [sesTokensSourceTestKey]: (dependencies: SesTokensSourceDependencies) => {
      sourceFactoryCallCount += 1
      return createSesTokensSource({
        ...dependencies,
        setTimer: scheduler.setTimer,
        clearTimer: scheduler.clearTimer,
      })
    },
  }

  await sesTokensPlugin.tui(api as never, { defaultState: options.defaultState }, meta)
  const registration = registrations[0]
  const slot = registration?.slots.sidebar_content
  if (!registration || !slot) throw new Error("SesTokens sidebar slot was not registered")

  const root = createHostNode("root")
  const [hostSessionID, setHostSessionID] = createSignal(options.sessionID ?? "")
  const slotProps = {
    get session_id() {
      return hostSessionID()
    },
  }
  const disposeHost = render(() => (() => {
    slotRenderCount += 1
    return slot({}, slotProps)
  }) as never, root)
  const mountedPanels = new Map<HostNode, HostNode>()
  const disposedPanels = new Set<HostNode>()

  function currentPanel(): HostNode | undefined {
    const title = mountedTextNodes(root).find((node) => textOf(node) === "SesTokens")
    return title?.parent?.parent
  }

  function trackPanelLifecycle() {
    const panel = currentPanel()
    if (panel) mountedPanels.set(panel, panel)
    for (const mounted of mountedPanels.keys()) {
      if (mounted.removed) disposedPanels.add(mounted)
    }
  }

  async function flushHost() {
    await settle()
    trackPanelLifecycle()
  }

  await flushHost()

  function view(width = 37) {
    const nodes = descendants(root)
    const textNodes = mountedTextNodes(root)
    const title = textNodes.find((node) => textOf(node) === "SesTokens")
    const header = title?.parent
    const headerNodes = header ? descendants(header) : []
    const marker = headerNodes.find((node) => node.type === "text" && ["▶ ", "▼ "].includes(textOf(node)))
    const detail = headerNodes.find((node) => node.type === "text" && textOf(node) === "stale")
    const summaryNodes = headerNodes.filter((node) => (
      node.type === "text"
      && node !== marker
      && node !== title
      && node !== detail
      && textOf(node).trim() !== ""
    ))
    const fallback = textNodes.find((node) => ["Loading...", "Usage unavailable"].includes(textOf(node)))
    const rows = textNodes
      .filter((node) => LABELS.has(textOf(node)))
      .map((label) => {
        const row = label.parent
        if (!row) throw new Error("SesTokens label is missing its row")
        const layout = rowLayout(row, width)
        const value = layout.cells.find((node) => node !== label && node.type === "text")
        return {
          label: textOf(label),
          labelColor: label.props.fg,
          value: textOf(value),
          renderedText: layout.renderedText,
          cells: layout.childWidths.reduce((total, childWidth) => total + childWidth, 0),
          cellCount: layout.cells.length,
          rowWidth: layout.rowWidth,
          childWidths: layout.childWidths,
          rowProps: row.props,
          labelProps: label.props,
          valueProps: value?.props ?? {},
        }
      })
    const dividers = nodes.filter((node) => (
      node.type === "box"
      && node.props.width === "100%"
      && node.props.height === 1
      && Array.isArray(node.props.border)
      && node.props.border[0] === "top"
    ))
    const totalSeparator = nodes.find((node) => (
      node.type === "box"
      && node.props.width === "100%"
      && node.children.filter((child) => child.type === "text" && textOf(child) === "---").length === 2
    ))
    const totalSeparatorTexts = totalSeparator?.children.filter((child) => child.type === "text") ?? []
    const totalSeparatorSpacer = totalSeparator?.children.find((child) => child.type === "box")
    return {
      marker: textOf(marker),
      title: textOf(title),
      detailText: textOf(detail),
      detailColor: detail?.props.fg,
      summaryText: summaryNodes.map(textOf).join(""),
      summarySegments: summaryNodes.map((node) => ({ text: textOf(node), color: node.props.fg })),
      summaryColors: summaryNodes.map((node) => node.props.fg),
      fallbackText: textOf(fallback),
      fallbackColor: fallback?.props.fg,
      rows,
      renderedWidth: Math.max(0, ...rows.map((row) => row.rowWidth)),
      dividerCount: dividers.length,
      totalSeparator: totalSeparator ? {
        width: totalSeparator.props.width,
        segments: totalSeparatorTexts.map((node) => ({ text: textOf(node), color: node.props.fg })),
        spacerFlexGrow: totalSeparatorSpacer?.props.flexGrow,
      } : undefined,
      async clickHeader() {
        const onMouseDown = header?.props.onMouseDown
        if (typeof onMouseDown !== "function") throw new Error("SesTokens header is not interactive")
        onMouseDown()
        await flushHost()
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
    panelMounts: () => mountedPanels.size,
    panelDisposals: () => disposedPanels.size,
    sourceFactoryCalls: () => sourceFactoryCallCount,
    slotRenders: () => slotRenderCount,
    lifecycleCleanups: () => cleanups.length,
    lifecycleAborted: () => controller.signal.aborted,
    registeredTypes: () => [...handlers.keys()],
    registrationCount: (type: string) => registrationCounts.get(type) ?? 0,
    unsubscribeCount: (type: string) => unsubscribeCounts.get(type) ?? 0,
    pendingDelays: () => timers.filter((timer) => !timer.cancelled).map((timer) => timer.delay),
    async setSessionID(sessionID?: string) {
      setHostSessionID(sessionID ?? "")
      await flushHost()
      return sessionID ? currentPanel() : null
    },
    emit(event: { type: string; properties: Record<string, unknown> }) {
      handlers.get(event.type)?.(event)
    },
    async resolveList(result: ClientResult<readonly unknown[]> = { data: [{ id: options.sessionID ?? "session-a" }] }) {
      const resolve = pendingLists.shift()
      if (!resolve) throw new Error("No pending session.list call")
      resolve(result)
      await flushHost()
    },
    async resolveMessages(
      sessionID: string,
      result: ClientResult<readonly { info: unknown }[]> = { data: readyMessages.map((info) => ({ info })) },
    ) {
      const index = pendingMessages.findIndex((pending) => pending.sessionID === sessionID)
      if (index < 0) throw new Error(`No pending session.messages call for ${sessionID}`)
      const [pending] = pendingMessages.splice(index, 1)
      pending.resolve(result)
      await flushHost()
    },
    async runTimer(delay: number) {
      const timer = timers.find((candidate) => !candidate.cancelled && candidate.delay === delay)
      if (!timer) throw new Error(`No pending ${delay} ms timer`)
      timer.cancelled = true
      timer.callback()
      await flushHost()
    },
    view,
    async dispose() {
      disposeHost()
      for (const mounted of mountedPanels.keys()) {
        mounted.removed = true
        disposedPanels.add(mounted)
      }
      controller.abort()
      const queue = cleanups.reverse()
      cleanups = []
      for (const cleanup of queue) await cleanup()
    },
  }
}
