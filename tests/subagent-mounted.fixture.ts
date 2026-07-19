import { createSignal } from "solid-js/dist/solid.js"

import {
  createComponent,
  createHostNode,
  render,
  type HostNode,
} from "./opentui-solid-host-runtime.fixture.js"
import {
  createSubagentSource,
  type RetainedFailures,
  type SubagentSourceDependencies,
} from "../shared/opencode-tools-shared.js"
import subagentPlugin, { subagentRuntimeTestKey } from "../tui/subagent.js"

type ClientResult<Data> = { data?: Data; error?: unknown }
type Timer = { callback: () => void; cancelled: boolean; delay: number }
type Child = {
  session: {
    id: string
    parentID: string
    title: string
    time: { created: number; updated: number }
  }
  status: { type: "idle" | "busy" | "retry" }
  messages: readonly unknown[]
}

const FAILURE_KEY = "aamkye.opencode-tools-subagent.failures"
const NOW = 20_000_000

function message(
  sessionID: string,
  status: "successful" | "running" | "failed",
  created: number,
  durationMs: number,
  agent = "general",
  modelID = "gpt-4o-mini",
) {
  return {
    id: `${sessionID}-message`,
    sessionID,
    role: "assistant" as const,
    time: status === "running" ? { created } : { created, completed: created + durationMs },
    parentID: "",
    modelID,
    providerID: "openai",
    mode: "build",
    agent,
    path: { cwd: "/repo", root: "/repo" },
    cost: 0,
    tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } },
    finish: "stop",
    ...(status === "failed" ? { error: { name: "UnknownError", data: { message: "failed" } } } : {}),
  }
}

function child(
  number: number,
  title: string,
  durationMs: number,
  status: "successful" | "running" | "failed",
): Child {
  const created = status === "running"
    ? NOW - durationMs
    : NOW - (15 * 60_000 + 4_000) + (number - 9) * 1_000
  return {
    session: {
      id: `subagent-${number}`,
      parentID: "parent-a",
      title,
      time: { created, updated: status === "successful" ? created + durationMs : created + 1 },
    },
    status: { type: status === "running" ? "busy" : "idle" },
    messages: [message(`subagent-${number}`, status, created, durationMs)],
  }
}

export const canonicalChildren: readonly Child[] = [
  child(11, "SubAgent11 with super long name", 9 * 60_000 + 45_000, "successful"),
  child(10, "SubAgent10", 75 * 60_000, "successful"),
  child(9, "SubAgent9", 15 * 60_000 + 4_000, "running"),
  child(8, "SubAgent8", 138 * 60_000, "failed"),
  child(7, "SubAgent7", 138 * 60_000, "failed"),
  child(6, "SubAgent6", 9 * 60_000 + 45_000, "successful"),
  child(5, "SubAgent5", 75 * 60_000, "successful"),
  child(4, "SubAgent4", 15_000, "failed"),
  child(3, "SubAgent3", 25_000, "successful"),
  child(2, "SubAgent2", 5_000, "successful"),
  child(1, "SubAgent1", 62 * 60_000, "successful"),
]

function descendants(root: HostNode): HostNode[] {
  return [root, ...root.children.flatMap(descendants)]
}

function textOf(node: HostNode | undefined): string {
  if (!node) return ""
  if (node.type === "#text") return String(node.props.value ?? "")
  return node.children.map(textOf).join("")
}

function textNodes(root: HostNode): HostNode[] {
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
  const rowWidth = resolvedWidth(row.props.width, width) || width
  const cells = row.children.filter((candidate) => candidate.type !== "#text")
  const fixedWidths = cells.map((cell) => {
    const configured = resolvedWidth(cell.props.width, rowWidth)
    if (configured > 0) return configured
    return Number(cell.props.flexGrow ?? 0) > 0 ? undefined : cellWidth(textOf(cell))
  })
  const fixedTotal = fixedWidths.reduce<number>((total, value) => total + (value ?? 0), 0)
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
    if (cellWidth(text) > allocated) {
      if (cell.props.truncate && allocated > 0) {
        return `${[...text].slice(0, Math.max(0, allocated - 1)).join("")}…`
      }
      return [...text].slice(0, allocated).join("")
    }
    const hasFollowingCell = index < cells.length - 1
    return hasFollowingCell && Number(cell.props.flexGrow ?? 0) > 0 ? text.padEnd(allocated) : text
  }).join("")
  return { cells, childWidths, renderedText: renderedText.trimEnd(), rowWidth }
}

function isDivider(node: HostNode): boolean {
  return node.type === "box"
    && node.props.width === "100%"
    && node.props.height === 1
    && Array.isArray(node.props.border)
    && node.props.border[0] === "top"
}

function directTexts(node: HostNode): string[] {
  return node.children.filter((childNode) => childNode.type !== "#text").map(textOf)
}

function isRenderableRow(node: HostNode): boolean {
  if (node.type !== "box" || node.props.flexDirection !== "row") return false
  const texts = directTexts(node)
  return texts[0] === "▶ "
    || texts[0] === "▼ "
    || texts[0] === "  "
}

function collectBodyItems(node: HostNode, output: HostNode[] = []): HostNode[] {
  if (isDivider(node) || isRenderableRow(node)) {
    output.push(node)
    return output
  }
  for (const childNode of node.children) collectBodyItems(childNode, output)
  return output
}

async function settle() {
  await new Promise((resolve) => setImmediate(resolve))
}

export async function mountSubagentPanel(options: {
  parentID?: string
  store?: Map<string, unknown>
} = {}) {
  const store = options.store ?? new Map<string, unknown>()
  const kvReads: string[] = []
  const kvWrites: Array<[string, unknown]> = []
  const listCalls: Array<{ directory?: string }> = []
  const messageCalls: Array<{ sessionID: string; directory?: string }> = []
  const statusCalls: string[] = []
  const routeCalls: Array<[string, unknown]> = []
  const pendingLists: Array<(result: ClientResult<readonly unknown[]>) => void> = []
  const pendingMessages: Array<{
    sessionID: string
    resolve(result: ClientResult<readonly { info: unknown }[]>): void
  }> = []
  const statuses = new Map<string, unknown>()
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
    state: {
      path: { directory: "/repo" },
      session: {
        status(sessionID: string) {
          statusCalls.push(sessionID)
          return statuses.get(sessionID)
        },
      },
    },
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
    route: {
      navigate(route: string, params: unknown) {
        routeCalls.push([route, params])
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
    [subagentRuntimeTestKey]: {
      createSource(dependencies: SubagentSourceDependencies) {
        sourceFactoryCallCount += 1
        return createSubagentSource(dependencies)
      },
      now: () => NOW,
      setTimer: scheduler.setTimer,
      clearTimer: scheduler.clearTimer,
    },
  }

  await subagentPlugin.tui(api as never, undefined, meta)
  const registration = registrations[0]
  const slot = registration?.slots.sidebar_content
  if (!registration || !slot) throw new Error("SubAgent sidebar slot was not registered")

  const root = createHostNode("root")
  const [hostParentID, setHostParentID] = createSignal(options.parentID ?? "")
  const slotProps = {
    get session_id() {
      return hostParentID()
    },
  }
  const disposeHost = render(() => (() => {
    slotRenderCount += 1
    return slot({}, slotProps)
  }) as never, root)
  const mountedPanels = new Map<HostNode, HostNode>()
  const disposedPanels = new Set<HostNode>()

  function currentPanel(): HostNode | undefined {
    const title = textNodes(root).find((node) => textOf(node) === "SubAgent")
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

  function view(width = 36) {
    const panel = currentPanel()
    const title = textNodes(root).find((node) => textOf(node) === "SubAgent")
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
    const body = panel?.children.find((node, index) => index > 0 && !isDivider(node))
    const bodyItems = body ? collectBodyItems(body) : []
    const rows = bodyItems.filter((node) => !isDivider(node)).map((row) => ({
      node: row,
      texts: directTexts(row),
      layout: rowLayout(row, width),
    }))
    const entryRows = rows.filter(({ texts }) => texts[1] === "• ")
    const detailRows = rows.filter(({ texts }) => texts[0] === "  " && texts[1]?.endsWith(":"))
    const openSession = rows.find(({ texts }) => texts[0] === "  " && texts[1] === "Open Session")
    const fallback = textNodes(root).find((node) => textOf(node) === "No subagents")
    const dividers = panel ? descendants(panel).filter(isDivider) : []
    const lines = panel && header ? [
      rowLayout(header, width).renderedText,
      "-".repeat(Math.max(0, width)),
      ...bodyItems.map((item) => isDivider(item)
        ? `---${" ".repeat(Math.max(0, width - 6))}---`
        : rowLayout(item, width).renderedText),
      ...(fallback && bodyItems.length === 0 ? [textOf(fallback)] : []),
      ...(dividers.length > 1 ? ["-".repeat(Math.max(0, width))] : []),
    ] : []

    async function clickRow(row: HostNode | undefined, label: string) {
      const onMouseDown = row?.props.onMouseDown
      if (typeof onMouseDown !== "function") throw new Error(`${label} is not interactive`)
      onMouseDown()
      await flushHost()
    }

    return {
      panelExists: Boolean(panel),
      marker: textOf(marker),
      title: textOf(title),
      detailText: textOf(detail),
      detailColor: detail?.props.fg,
      summaryText: summaryNodes.map(textOf).join(""),
      summarySegments: summaryNodes.map((node) => ({ text: textOf(node), color: node.props.fg })),
      fallbackText: textOf(fallback),
      fallbackColor: fallback?.props.fg,
      dividerCount: dividers.length,
      lines,
      entryRows: entryRows.map(({ texts, layout }) => ({
        disclosure: texts[0],
        title: texts[2],
        duration: texts[4] ?? "",
        bulletColor: layout.cells[1]?.props.fg,
        renderedText: layout.renderedText,
        rowWidth: layout.rowWidth,
        childWidths: layout.childWidths,
        rowProps: entryRows.find(({ layout: candidate }) => candidate === layout)?.node.props ?? {},
        titleProps: layout.cells[2]?.props ?? {},
      })),
      detailRows: detailRows.map(({ texts, layout }) => ({
        label: texts[1],
        value: texts[2],
        valueColor: layout.cells[2]?.props.fg,
      })),
      async clickHeader() {
        await clickRow(header, "SubAgent header")
      },
      async clickEntry(titleText: string) {
        await clickRow(entryRows.find(({ texts }) => texts[2] === titleText)?.node, titleText)
      },
      async clickRest() {
        await clickRow(rows.find(({ texts }) => texts[1] === "Rest")?.node, "Rest")
      },
      async clickOpenSession() {
        await clickRow(openSession?.node, "Open Session")
      },
    }
  }

  return {
    pluginID: subagentPlugin.id,
    registrations,
    kvReads,
    kvWrites,
    store,
    listCalls,
    messageCalls,
    statusCalls,
    routeCalls,
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
    async setParentID(parentID?: string) {
      setHostParentID(parentID ?? "")
      await flushHost()
    },
    emit(event: { type: string; properties: Record<string, unknown> }) {
      handlers.get(event.type)?.(event)
    },
    async resolveList(result: ClientResult<readonly unknown[]>) {
      const resolve = pendingLists.shift()
      if (!resolve) throw new Error("No pending session.list call")
      resolve(result)
      await flushHost()
    },
    async resolveMessages(sessionID: string, result: ClientResult<readonly { info: unknown }[]>) {
      const index = pendingMessages.findIndex((pending) => pending.sessionID === sessionID)
      if (index < 0) throw new Error(`No pending session.messages call for ${sessionID}`)
      const [pending] = pendingMessages.splice(index, 1)
      pending.resolve(result)
      await flushHost()
    },
    async resolveReady(children: readonly Child[] = canonicalChildren) {
      statuses.clear()
      for (const entry of children) statuses.set(entry.session.id, entry.status)
      await this.resolveList({ data: [
        { id: options.parentID ?? "parent-a", parentID: undefined, title: "Parent", time: { created: 0, updated: 0 } },
        ...children.map(({ session }) => session),
      ] })
      const messages = new Map(children.map((entry) => [entry.session.id, entry.messages]))
      while (pendingMessages.length > 0) {
        const sessionID = pendingMessages[0].sessionID
        await this.resolveMessages(sessionID, { data: (messages.get(sessionID) ?? []).map((info) => ({ info })) })
      }
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

export const subagentFailureKey = FAILURE_KEY
