import { createSignal } from "solid-js/dist/solid.js"
import stringWidth from "string-width"

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
type Interval = { callback: () => void; cancelled: boolean; delay: number }
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
const PANEL_COLLAPSED_KEY = "aamkye.opencode-tools-subagent.panel-collapsed"
const REST_COLLAPSED_KEY = "aamkye.opencode-tools-subagent.rest-collapsed"
const EXPANDED_CHILD_KEY = "aamkye.opencode-tools-subagent.expanded-child"
const NOW = 20_000_000
const graphemeSegmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" })

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
  return stringWidth(text)
}

function takeCells(text: string, width: number): string {
  let result = ""
  let used = 0
  for (const { segment } of graphemeSegmenter.segment(text)) {
    const segmentWidth = cellWidth(segment)
    if (used + segmentWidth > width) break
    result += segment
    used += segmentWidth
  }
  return result
}

function truncateCells(text: string, width: number): string {
  if (cellWidth(text) <= width) return text
  if (width <= 0) return ""
  const ellipsis = "…"
  const ellipsisWidth = cellWidth(ellipsis)
  if (ellipsisWidth > width) return takeCells(text, width)
  return `${takeCells(text, width - ellipsisWidth)}${ellipsis}`
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
  const configuredWidths = cells.map((cell) => resolvedWidth(cell.props.width, rowWidth))
  const fixedWidths = cells.map<number | undefined>((cell, index) => {
    const configured = configuredWidths[index]
    if (configured > 0) return configured
    return Number(cell.props.flexGrow ?? 0) > 0 ? undefined : cellWidth(textOf(cell))
  })
  const growingContentWidth = cells.reduce((total, cell, index) => (
    total + (fixedWidths[index] === undefined ? cellWidth(textOf(cell)) : 0)
  ), 0)
  let fixedTotal = fixedWidths.reduce<number>((total, value) => total + (value ?? 0), 0)
  let overflow = Math.max(0, fixedTotal + growingContentWidth - rowWidth)
  for (let index = fixedWidths.length - 1; index >= 0 && overflow > 0; index -= 1) {
    const fixed = fixedWidths[index]
    const cell = cells[index]
    if (fixed === undefined || Number(cell.props.flexShrink ?? 0) <= 0 || cell.props.minWidth !== 0) continue
    const reduction = Math.min(fixed, overflow)
    fixedWidths[index] = fixed - reduction
    fixedTotal -= reduction
    overflow -= reduction
  }
  const growTotal = cells.reduce((total, cell, index) => (
    total + (fixedWidths[index] === undefined ? Number(cell.props.flexGrow ?? 0) : 0)
  ), 0)
  const remaining = Math.max(0, rowWidth - fixedTotal)
  const childWidths = cells.map((cell, index) => fixedWidths[index] ?? (
    growTotal > 0 ? Math.floor(remaining * Number(cell.props.flexGrow ?? 0) / growTotal) : 0
  ))
  const renderedCells = cells.map((cell, index) => {
    const text = textOf(cell)
    const allocated = childWidths[index]
    let rendered = text
    if (configuredWidths[index] === 0 && cellWidth(text) > allocated) {
      rendered = cell.props.truncate ? truncateCells(text, allocated) : takeCells(text, allocated)
    }
    const hasFollowingCell = index < cells.length - 1
    if (hasFollowingCell && Number(cell.props.flexGrow ?? 0) > 0) {
      rendered += " ".repeat(Math.max(0, allocated - cellWidth(rendered)))
    }
    return rendered
  })
  return { cells, childWidths, renderedCells, renderedText: renderedCells.join(""), rowWidth }
}

function isDivider(node: HostNode): boolean {
  return node.type === "box"
    && node.props.width === "100%"
    && node.props.height === 1
    && Array.isArray(node.props.border)
    && node.props.border[0] === "top"
}

function isExplicitDivider(node: HostNode): boolean {
  return node.type === "box"
    && node.props.flexDirection === "row"
    && directTexts(node).join("\0") === "---\0\0---"
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
  if (isDivider(node) || isExplicitDivider(node) || isRenderableRow(node)) {
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
  const intervals: Interval[] = []
  const registrations: Array<{
    order?: number
    slots: Record<string, (ctx: unknown, props: { session_id?: string }) => unknown>
  }> = []
  const controller = new AbortController()
  let cleanups: Array<() => void | Promise<void>> = []
  let sourceFactoryCallCount = 0
  let slotRenderCount = 0
  let intervalClearCount = 0
  let currentNow = NOW
  let currentParentID = options.parentID ?? ""
  let currentTitles: string[] = []
  let mountedWidth = 36
  let sizeChangeCallCount = 0

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
    setInterval(callback: () => void, delay: number) {
      const interval = { callback, cancelled: false, delay }
      intervals.push(interval)
      return interval
    },
    clearInterval(interval: unknown) {
      if (typeof interval !== "object" || interval === null || !("cancelled" in interval)) return
      const candidate = interval as Interval
      if (candidate.cancelled) return
      candidate.cancelled = true
      intervalClearCount += 1
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
      now: () => currentNow,
      setTimer: scheduler.setTimer,
      clearTimer: scheduler.clearTimer,
      setInterval: scheduler.setInterval,
      clearInterval: scheduler.clearInterval,
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
    let resized = false
    const panel = currentPanel()
    if (panel && !panel.removed) {
      for (const row of descendants(panel)) {
        const texts = directTexts(row)
        if (row.type !== "box"
          || row.props.flexDirection !== "row"
          || typeof row.props.onMouseDown !== "function"
          || !["▶ ", "▼ "].includes(texts[0])
          || texts[1] === "Rest") continue
        const layout = rowLayout(row, mountedWidth)
        const titleRegion = layout.cells[1]
        if (!titleRegion) continue
        const width = layout.childWidths[1] ?? 0
        if (titleRegion.width === width) continue
        titleRegion.width = width
        if (typeof titleRegion.props.onSizeChange !== "function") continue
        titleRegion.props.onSizeChange.call(titleRegion)
        sizeChangeCallCount += 1
        resized = true
      }
    }
    if (resized) await settle()
  }

  await flushHost()

  function view() {
    const width = mountedWidth
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
    const entryRows = rows.filter(({ node, texts }) => (
      typeof node.props.onMouseDown === "function"
      && ["▶ ", "▼ "].includes(texts[0])
      && texts[1] !== "Rest"
    ))
    const detailRows = rows.filter(({ texts }) => texts[0] === "  " && texts[1]?.endsWith(":"))
    const openSession = rows.find(({ texts }) => texts[0] === "  " && texts[1] === "Open Session")
    const fallback = textNodes(root).find((node) => textOf(node) === "No subagents")
    const dividers = panel ? descendants(panel).filter(isDivider) : []
    const restDivider = bodyItems.find((item) => isDivider(item) || isExplicitDivider(item))
    const lines = panel && header ? [
      rowLayout(header, width).renderedText,
      "-".repeat(Math.max(0, width)),
      ...bodyItems.map((item) => rowLayout(item, width).renderedText),
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
      bulletCount: textNodes(root).filter((node) => textOf(node) === "• ").length,
      rest: {
        disclosureColor: rows.find(({ texts }) => texts[1] === "Rest")?.layout.cells[0]?.props.fg,
        titleColor: rows.find(({ texts }) => texts[1] === "Rest")?.layout.cells[1]?.props.fg,
      },
      restDivider: {
        nativeBorder: Boolean(restDivider && isDivider(restDivider)),
        texts: restDivider ? directTexts(restDivider) : [],
        colors: restDivider?.children.filter((node) => node.type !== "#text").map((node) => node.props.fg) ?? [],
        middleFlexGrow: restDivider?.children.filter((node) => node.type !== "#text")[1]?.props.flexGrow,
      },
      openSessionInteractive: typeof openSession?.node.props.onMouseDown === "function",
      lines,
      entryRows: entryRows.map(({ node, texts, layout }, index) => ({
        disclosure: texts[0],
        title: currentTitles[index] ?? texts[1],
        gap: texts[2] ?? "",
        gapWidth: layout.childWidths[2] ?? 0,
        duration: texts[3] ?? "",
        durationColor: layout.cells[3]?.props.fg,
        renderedTitle: textOf(layout.cells[1]),
        renderedText: layout.renderedText,
        rowWidth: layout.rowWidth,
        childWidths: layout.childWidths,
        rowProps: node.props,
        titleProps: layout.cells[1]?.props ?? {},
      })),
      detailRows: detailRows.map(({ texts, layout }) => ({
        label: texts[1],
        value: texts[2],
        valueColor: layout.cells[2]?.props.fg,
        renderedValue: layout.renderedCells[2],
        renderedText: layout.renderedText,
        rowWidth: layout.rowWidth,
        childWidths: layout.childWidths,
        valueProps: layout.cells[2]?.props ?? {},
      })),
      async clickHeader() {
        await clickRow(header, "SubAgent header")
      },
      async clickEntry(titleText: string) {
        const index = currentTitles.indexOf(titleText)
        await clickRow(entryRows[index]?.node, titleText)
      },
      async clickRest() {
        await clickRow(rows.find(({ texts }) => texts[1] === "Rest")?.node, "Rest")
      },
      async activateOpenSession() {
        const onMouseDown = openSession?.node.props.onMouseDown
        if (typeof onMouseDown === "function") onMouseDown()
        await flushHost()
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
    activeIntervalDelays: () => intervals.filter((interval) => !interval.cancelled).map((interval) => interval.delay),
    intervalStarts: () => intervals.length,
    intervalClears: () => intervalClearCount,
    setNow(value: number) {
      currentNow = value
    },
    async setParentID(parentID?: string) {
      currentParentID = parentID ?? ""
      currentTitles = []
      setHostParentID(currentParentID)
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
      const resolvedChildren = children.map((entry) => ({
        ...entry,
        session: { ...entry.session, parentID: currentParentID },
      }))
      currentTitles = [...resolvedChildren]
        .sort((left, right) => right.session.time.created - left.session.time.created
          || left.session.id.localeCompare(right.session.id))
        .map(({ session }) => session.title)
      statuses.clear()
      for (const entry of resolvedChildren) statuses.set(entry.session.id, entry.status)
      await this.resolveList({ data: [
        { id: currentParentID, parentID: undefined, title: "Parent", time: { created: 0, updated: 0 } },
        ...resolvedChildren.map(({ session }) => session),
      ] })
      const messages = new Map(resolvedChildren.map((entry) => [entry.session.id, entry.messages]))
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
    async runInterval(delay = 1_000) {
      const interval = intervals.find((candidate) => !candidate.cancelled && candidate.delay === delay)
      if (!interval) throw new Error(`No active ${delay} ms interval`)
      interval.callback()
      await flushHost()
    },
    async resize(width: number) {
      mountedWidth = width
      await flushHost()
    },
    sizeChangeCalls: () => sizeChangeCallCount,
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
      await settle()
    },
  }
}

export const subagentFailureKey = FAILURE_KEY
export const subagentPanelCollapsedKey = PANEL_COLLAPSED_KEY
export const subagentRestCollapsedKey = REST_COLLAPSED_KEY
export const subagentExpandedChildKey = EXPANDED_CHILD_KEY
