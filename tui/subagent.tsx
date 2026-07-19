import { createEffect, createMemo, createSignal, For, Show } from "solid-js"

import {
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
export const subagentRuntimeTestKey = Symbol("subagent-runtime-test")

type SubagentSourceFactory = (dependencies: SubagentSourceDependencies) => SubagentSource
type SubagentRuntime = {
  createSource: SubagentSourceFactory
  now(): number
  setTimer(callback: () => void, delayMs: number): unknown
  clearTimer(timer: unknown): void
}

function runtime(meta: unknown): SubagentRuntime {
  const defaults: SubagentRuntime = {
    createSource: (dependencies) => createSubagentSource(dependencies),
    now: () => Date.now(),
    setTimer: (callback, delayMs) => globalThis.setTimeout(callback, delayMs),
    clearTimer: (timer) => globalThis.clearTimeout(timer as ReturnType<typeof globalThis.setTimeout>),
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
  }
}

function statusRole(status: SubagentEntry["status"]): PanelStatus {
  if (status === "successful") return "success"
  if (status === "running") return "warning"
  return "error"
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
        flexBasis={0}
        flexGrow={1}
        flexShrink={1}
        minWidth={0}
        overflow="hidden"
        wrapMode="none"
        fg={props.theme().textMuted}
      >
        {props.label}
      </text>
      <text flexShrink={0} fg={props.status ? props.theme()[props.status] : undefined}>{props.value}</text>
    </box>
  )
}

function SubagentRow(props: {
  entry: SubagentEntry
  expanded: boolean
  onToggle(): void
  onOpen(): void
  theme: () => PanelTheme
}) {
  const role = () => statusRole(props.entry.status)
  return (
    <box flexDirection="column" width="100%" overflow="hidden">
      <box flexDirection="row" width="100%" overflow="hidden" onMouseDown={props.onToggle}>
        <text width={2} flexShrink={0}>{props.expanded ? "▼ " : "▶ "}</text>
        <text width={2} flexShrink={0} fg={props.theme()[role()]}>• </text>
        <text
          flexBasis={0}
          flexGrow={1}
          flexShrink={1}
          minWidth={0}
          overflow="hidden"
          wrapMode="none"
          truncate={true}
        >
          {props.entry.title}
        </text>
        <Show when={!props.expanded}>
          <text width={1} flexShrink={0}> </text>
          <text flexShrink={0} wrapMode="none">{props.entry.duration}</text>
        </Show>
      </box>
      <Show when={props.expanded}>
        <DetailRow label="agent:" value={props.entry.agent} theme={props.theme} />
        <DetailRow label="status:" value={props.entry.status} status={role()} theme={props.theme} />
        <DetailRow label="time:" value={props.entry.duration} theme={props.theme} />
        <DetailRow label="model:" value={props.entry.model} theme={props.theme} />
        <box flexDirection="row" width="100%" overflow="hidden" onMouseDown={props.onOpen}>
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
  context.onCleanup(source.dispose)
  context.onCleanup(source.subscribe(() => setState(source.state())))

  function SubagentPanel(props: { panelState: Extract<SubagentSourceState, { phase: "ready" | "stale" }> }) {
    const [collapsed, setCollapsed] = createSignal(false)
    const [expandedIDs, setExpandedIDs] = createSignal<ReadonlySet<string>>(new Set())
    const [restExpanded, setRestExpanded] = createSignal(true)
    const model = createMemo<SubagentPanelModel>(() => createSubagentPanelModel(
      props.panelState.snapshot,
      props.panelState.failureTimes,
      injected.now(),
    ))
    const summaryText = () => model().summary.map((segment) => segment.text).join("")
    const togglePanel = () => setCollapsed((value) => !value)
    const toggleEntry = (entryID: string) => setExpandedIDs((current) => {
      const next = new Set(current)
      if (next.has(entryID)) next.delete(entryID)
      else next.add(entryID)
      return next
    })
    const openSession = (sessionID: string) => api.route.navigate("session", { sessionID })

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
                expanded={expandedIDs().has(entry.id)}
                onToggle={() => toggleEntry(entry.id)}
                onOpen={() => openSession(entry.id)}
                theme={() => api.theme.current}
              />
            )}
          </For>
          <Show when={model().rest.length > 0}>
            <box width="100%" height={1} border={["top"]} />
            <box
              flexDirection="row"
              width="100%"
              overflow="hidden"
              onMouseDown={() => setRestExpanded((value) => !value)}
            >
              <text width={2} flexShrink={0}>{restExpanded() ? "▼ " : "▶ "}</text>
              <text flexBasis={0} flexGrow={1} flexShrink={1} minWidth={0}>Rest</text>
            </box>
            <Show when={restExpanded()}>
              <For each={model().rest}>
                {(entry) => (
                  <SubagentRow
                    entry={entry}
                    expanded={expandedIDs().has(entry.id)}
                    onToggle={() => toggleEntry(entry.id)}
                    onOpen={() => openSession(entry.id)}
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
