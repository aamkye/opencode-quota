import { createEffect, createMemo, createSignal, For, onCleanup, Show } from "solid-js"
import type { JSX } from "solid-js"
import stringWidth from "string-width"

import {
  allocateSubagentEntryRow,
  CompactPanel,
  createSubagentPanelModel,
  createSubagentSnapshotLoader,
  createSubagentSource,
  defineTuiPlugin,
  pluginDescriptor,
  type PanelStatus,
  type PanelTheme,
  type RetainedFailures,
  type SubagentEntry,
  type SubagentPanelModel,
  type SubagentSource,
  type SubagentSourceDependencies,
  type SubagentSourceState,
} from "../shared/opencode-tools-shared.js"

const descriptor = pluginDescriptor("subagent")
const FAILURE_KEY = "aamkye.opencode-tools-subagent.failures"
const PANEL_COLLAPSED_KEY = "aamkye.opencode-tools-subagent.panel-collapsed"
const REST_COLLAPSED_KEY = "aamkye.opencode-tools-subagent.rest-collapsed"
const EXPANDED_CHILD_KEY = "aamkye.opencode-tools-subagent.expanded-child"
export const subagentRuntimeTestKey = Symbol("subagent-runtime-test")

type SubagentSourceFactory = (dependencies: SubagentSourceDependencies) => SubagentSource
type SubagentRuntime = {
  createSource: SubagentSourceFactory
  now(): number
  setTimer(callback: () => void, delayMs: number): unknown
  clearTimer(timer: unknown): void
  setInterval(callback: () => void, delayMs: number): unknown
  clearInterval(interval: unknown): void
}

function runtime(meta: unknown): SubagentRuntime {
  const defaults: SubagentRuntime = {
    createSource: (dependencies) => createSubagentSource(dependencies),
    now: () => Date.now(),
    setTimer: (callback, delayMs) => globalThis.setTimeout(callback, delayMs),
    clearTimer: (timer) => globalThis.clearTimeout(timer as ReturnType<typeof globalThis.setTimeout>),
    setInterval: (callback, delayMs) => globalThis.setInterval(callback, delayMs),
    clearInterval: (interval) => globalThis.clearInterval(interval as ReturnType<typeof globalThis.setInterval>),
  }
  if (typeof meta !== "object" || meta === null) return defaults
  const candidate = (meta as Record<PropertyKey, unknown>)[subagentRuntimeTestKey]
  if (typeof candidate !== "object" || candidate === null) return defaults
  const injected = candidate as Partial<SubagentRuntime>
  return {
    createSource: typeof injected.createSource === "function" ? injected.createSource : defaults.createSource,
    now: typeof injected.now === "function" ? injected.now : defaults.now,
    setTimer: typeof injected.setTimer === "function" ? injected.setTimer : defaults.setTimer,
    clearTimer: typeof injected.clearTimer === "function" ? injected.clearTimer : defaults.clearTimer,
    setInterval: typeof injected.setInterval === "function" ? injected.setInterval : defaults.setInterval,
    clearInterval: typeof injected.clearInterval === "function" ? injected.clearInterval : defaults.clearInterval,
  }
}

function statusRole(status: SubagentEntry["status"]): PanelStatus {
  if (status === "successful") return "success"
  if (status === "running") return "warning"
  return "error"
}

type MeasuredTitleProps = {
  value: string
  cells: number
  marginRight: number
}

function truncateTerminalCellsEnd(value: string, maxCells: number): string {
  const available = Number.isFinite(maxCells) ? Math.max(0, Math.floor(maxCells)) : 0
  if (stringWidth(value) <= available) return value
  if (available === 0) return ""

  const ellipsis = "…"
  const ellipsisCells = stringWidth(ellipsis)
  let prefix = ""
  let prefixCells = 0
  for (const { segment } of new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(value)) {
    const segmentCells = stringWidth(segment)
    if (prefixCells + segmentCells + ellipsisCells > available) break
    prefix += segment
    prefixCells += segmentCells
  }
  return `${prefix.trimEnd()}${ellipsis}`
}

function MeasuredTitle(props: MeasuredTitleProps): JSX.Element {
  return (
    <text
      flexBasis={0}
      flexGrow={1}
      flexShrink={1}
      minWidth={0}
      marginRight={props.marginRight}
      overflow="hidden"
      wrapMode="none"
      truncate={true}
    >
      {truncateTerminalCellsEnd(props.value, props.cells)}
    </text>
  )
}

function DetailRow(props: {
  label: string
  value: string
  status?: PanelStatus
  theme: () => PanelTheme
}) {
  return (
    <box flexDirection="row" width="100%" overflow="hidden">
      <text width={2} flexShrink={0}>{"  "}</text>
      <text
        flexGrow={1}
        flexShrink={0}
        overflow="hidden"
        wrapMode="none"
        fg={props.theme().textMuted}
      >
        {props.label}
      </text>
      <text
        flexShrink={1}
        minWidth={0}
        overflow="hidden"
        wrapMode="none"
        fg={props.status ? props.theme()[props.status] : undefined}
      >
        {props.value}
      </text>
    </box>
  )
}

function SubagentRow(props: {
  entry: SubagentEntry
  expanded: boolean
  onToggle(): void
  onOpenSession(): void
  theme: () => PanelTheme
}) {
  const role = () => statusRole(props.entry.status)
  const allocation = () => allocateSubagentEntryRow(37, 7)
  return (
    <box flexDirection="column" width="100%" overflow="hidden">
      <box flexDirection="row" width="100%" overflow="hidden" onMouseDown={props.onToggle}>
        <text width={allocation().disclosure} flexShrink={0}>{props.expanded ? "▼ " : "▶ "}</text>
        <Show
          when={props.expanded}
          fallback={(
            <MeasuredTitle
              value={props.entry.title}
              cells={allocation().title}
              marginRight={allocation().beforeDurationGap}
            />
          )}
        >
          <text flexGrow={1} flexShrink={1} minWidth={0} wrapMode="char">{props.entry.title}</text>
        </Show>
        <Show when={!props.expanded}>
          <box width={allocation().duration} flexShrink={0} justifyContent="flex-end">
            <text wrapMode="none" fg={props.theme()[role()]}>{props.entry.duration}</text>
          </box>
        </Show>
      </box>
      <Show when={props.expanded}>
        <DetailRow label="agent:" value={props.entry.agent} theme={props.theme} />
        <DetailRow label="status:" value={props.entry.status} status={role()} theme={props.theme} />
        <DetailRow label="time:" value={props.entry.duration} status={role()} theme={props.theme} />
        <DetailRow label="model:" value={props.entry.model} theme={props.theme} />
        <box flexDirection="row" width="100%" overflow="hidden" onMouseDown={props.onOpenSession}>
          <text width={2} flexShrink={0}>{"  "}</text>
          <text>Open Session</text>
        </box>
      </Show>
    </box>
  )
}

const plugin = defineTuiPlugin(descriptor, (context, api, _options, meta) => {
  const directory = api.state.path.directory
  const injected = runtime(meta)
  const loadSnapshot = createSubagentSnapshotLoader({
    async listSessions() {
      const result = await api.client.session.list({ directory })
      if (result.error !== undefined || !result.data) {
        throw result.error ?? new Error("session data unavailable")
      }
      return result.data
    },
    sessionStatus: (sessionID) => api.state.session.status(sessionID),
    async listMessages(sessionID) {
      const result = await api.client.session.messages({ sessionID, directory })
      if (result.error !== undefined || !result.data) {
        throw result.error ?? new Error("session data unavailable")
      }
      return result.data.map((record) => record.info)
    },
  })
  const source = injected.createSource({
    loadSnapshot,
    onEvent: (type, handler) => api.event.on(type, handler as never),
    loadFailures: () => api.kv.get<RetainedFailures>(FAILURE_KEY, {}),
    saveFailures: (value) => api.kv.set(FAILURE_KEY, value),
    now: injected.now,
    setTimer: injected.setTimer,
    clearTimer: injected.clearTimer,
  })
  const [state, setState] = createSignal<SubagentSourceState | undefined>(source.state())
  let panelCollapsedByParent = api.kv.get<Record<string, boolean>>(PANEL_COLLAPSED_KEY, {})
  let restCollapsedByParent = api.kv.get<Record<string, boolean>>(REST_COLLAPSED_KEY, {})
  let expandedChildByParent = api.kv.get<Record<string, string>>(EXPANDED_CHILD_KEY, {})
  const clockStops = new Set<() => void>()
  context.onCleanup(source.dispose)
  context.onCleanup(source.subscribe(() => setState(source.state())))
  context.onCleanup(() => {
    for (const stop of clockStops) stop()
    clockStops.clear()
  })

  function SubagentPanel(props: { panelState: Extract<SubagentSourceState, { phase: "ready" | "stale" }> }) {
    const parentID = props.panelState.parentID
    const [collapsed, setCollapsed] = createSignal(panelCollapsedByParent[parentID] ?? false)
    const [expandedID, setExpandedID] = createSignal<string | undefined>(expandedChildByParent[parentID])
    const [restExpanded, setRestExpanded] = createSignal(!(restCollapsedByParent[parentID] ?? false))
    const [now, setNow] = createSignal(injected.now())
    const model = createMemo<SubagentPanelModel>(() => createSubagentPanelModel(
      props.panelState.snapshot,
      props.panelState.failureTimes,
      now(),
    ))
    const summaryText = () => model().summary.map((segment) => segment.text).join("")
    const togglePanel = () => {
      const next = !collapsed()
      panelCollapsedByParent = { ...panelCollapsedByParent, [parentID]: next }
      setCollapsed(next)
      api.kv.set(PANEL_COLLAPSED_KEY, panelCollapsedByParent)
    }
    const toggleRest = () => {
      const next = !restExpanded()
      restCollapsedByParent = { ...restCollapsedByParent, [parentID]: !next }
      setRestExpanded(next)
      api.kv.set(REST_COLLAPSED_KEY, restCollapsedByParent)
    }
    const toggleEntry = (entryID: string) => {
      const next = expandedID() === entryID ? undefined : entryID
      expandedChildByParent = { ...expandedChildByParent }
      if (next === undefined) delete expandedChildByParent[parentID]
      else expandedChildByParent[parentID] = next
      setExpandedID(next)
      api.kv.set(EXPANDED_CHILD_KEY, expandedChildByParent)
    }

    createEffect(() => {
      const selected = expandedID()
      if (!selected || props.panelState.snapshot.childIDs.includes(selected)) return
      expandedChildByParent = { ...expandedChildByParent }
      delete expandedChildByParent[parentID]
      setExpandedID(undefined)
      api.kv.set(EXPANDED_CHILD_KEY, expandedChildByParent)
    })

    let clock: unknown
    let clockActive = false
    const stopClock = () => {
      if (clock === undefined) return
      injected.clearInterval(clock)
      clock = undefined
    }
    clockStops.add(stopClock)
    onCleanup(() => {
      clockStops.delete(stopClock)
      stopClock()
    })
    createEffect(() => {
      const active = !collapsed() && (
        model().primary.some((entry) => entry.status === "running")
        || (restExpanded() && model().rest.some((entry) => entry.status === "running"))
      )
      if (active === clockActive) return
      clockActive = active
      if (!active) {
        stopClock()
        return
      }
      setNow(injected.now())
      clock = injected.setInterval(() => setNow(injected.now()), 1_000)
    })

    return (
      <CompactPanel
        title="SubAgent"
        collapsed={collapsed()}
        detail={props.panelState.phase === "stale" ? { text: "stale", status: "warning" } : undefined}
        summary={collapsed() ? { text: summaryText(), segments: model().summary } : undefined}
        onToggle={togglePanel}
        footerDivider={!collapsed()}
        theme={() => api.theme.current}
      >
        <Show
          when={model().primary.length > 0 || model().rest.length > 0}
          fallback={<text fg={api.theme.current.textMuted}>No subagents</text>}
        >
          <For each={model().primary}>
            {(entry) => (
              <SubagentRow
                entry={entry}
                expanded={expandedID() === entry.id}
                onToggle={() => toggleEntry(entry.id)}
                onOpenSession={() => api.route.navigate("session", { sessionID: entry.id })}
                theme={() => api.theme.current}
              />
            )}
          </For>
          <Show when={model().rest.length > 0}>
            <box flexDirection="row" width="100%" overflow="hidden">
              <text flexShrink={0} fg={api.theme.current.textMuted}>---</text>
              <text flexBasis={0} flexGrow={1} flexShrink={1} minWidth={0} />
              <text flexShrink={0} fg={api.theme.current.textMuted}>---</text>
            </box>
            <box
              flexDirection="row"
              width="100%"
              overflow="hidden"
              onMouseDown={toggleRest}
            >
              <text width={2} flexShrink={0} fg={api.theme.current.textMuted}>{restExpanded() ? "▼ " : "▶ "}</text>
              <text flexBasis={0} flexGrow={1} flexShrink={1} minWidth={0} fg={api.theme.current.textMuted}>Rest</text>
            </box>
            <Show when={restExpanded()}>
              <For each={model().rest}>
                {(entry) => (
                  <SubagentRow
                    entry={entry}
                    expanded={expandedID() === entry.id}
                    onToggle={() => toggleEntry(entry.id)}
                    onOpenSession={() => api.route.navigate("session", { sessionID: entry.id })}
                    theme={() => api.theme.current}
                  />
                )}
              </For>
            </Show>
          </Show>
        </Show>
      </CompactPanel>
    )
  }

  function SubagentSlot(props: { parentID?: string }) {
    const parentID = () => props.parentID ?? ""
    createEffect(() => source.setParentID(parentID()))
    const panelState = createMemo(() => {
      const current = state()
      if (parentID() === "" || current?.parentID !== parentID()) return undefined
      return current.phase === "ready" || current.phase === "stale" ? current : undefined
    })
    return (
      <Show when={panelState()}>
        {(current) => <SubagentPanel panelState={current()} />}
      </Show>
    )
  }

  api.slots.register({
    order: descriptor.slotOrder,
    slots: {
      sidebar_content(_ctx, props) {
        return <SubagentSlot parentID={props.session_id} />
      },
    },
  })
})

export default plugin
