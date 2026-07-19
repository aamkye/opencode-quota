import { createEffect, createMemo, createSignal, For, Show, type JSX } from "solid-js"

import {
  CompactPanel,
  createSesTokensPanelModel,
  createSesTokensSource,
  defineTuiPlugin,
  loadSessionTreeSnapshot,
  pluginDescriptor,
  type PanelTheme,
  type SesTokensPanelModel,
  type SesTokensSource,
  type SesTokensSourceDependencies,
  type SesTokensSourceState,
} from "../shared/opencode-tools-shared.js"

const descriptor = pluginDescriptor("ses-tokens")
const COLLAPSED_KEY = "aamkye.opencode-tools-ses-tokens.collapsed"
export const sesTokensSourceTestKey = Symbol("ses-tokens-source-test")

type SesTokensSourceFactory = (dependencies: SesTokensSourceDependencies) => SesTokensSource
type MetricRow = { label: string; value: string; total?: boolean }

function sourceFactory(meta: unknown): SesTokensSourceFactory {
  if (typeof meta !== "object" || meta === null) return createSesTokensSource
  const candidate = (meta as Record<PropertyKey, unknown>)[sesTokensSourceTestKey]
  return typeof candidate === "function" ? candidate as SesTokensSourceFactory : createSesTokensSource
}

function metricRows(model: SesTokensPanelModel): readonly MetricRow[] {
  return [
    { label: "↻ turns", value: model.turns },
    { label: "↑ in", value: model.input },
    { label: "↓ out", value: model.output },
    { label: "▤ cache write", value: model.cacheWrite },
    { label: "▤ cache read", value: model.cacheRead },
    { label: "ø cache hit ratio", value: model.cacheRatio },
    { label: "✦ think", value: model.reasoning },
    { label: "Σ total", value: model.total, total: true },
  ]
}

function SesTokensMetricRow(props: { row: MetricRow; theme: () => PanelTheme }) {
  return (
    <box flexDirection="column" width="100%" overflow="hidden">
      <Show when={props.row.total}>
        <box width="100%" height={1} border={["top"]} />
      </Show>
      <box flexDirection="row" width="100%" overflow="hidden">
        <text
          flexBasis={0}
          flexGrow={1}
          flexShrink={1}
          minWidth={0}
          overflow="hidden"
          wrapMode="none"
          fg={props.theme().textMuted}
        >
          {props.row.label}
        </text>
        <text flexShrink={0}>{props.row.value}</text>
      </box>
    </box>
  )
}

const plugin = defineTuiPlugin(descriptor, (context, api, _options, meta) => {
  const directory = api.state.path.directory
  const loadSnapshot = (rootSessionID: string) => loadSessionTreeSnapshot({
    rootSessionID,
    async listSessions() {
      const result = await api.client.session.list({ directory })
      if (result.error !== undefined || !result.data) throw result.error ?? new Error("session list unavailable")
      return result.data
    },
    async listMessages(sessionID) {
      const result = await api.client.session.messages({ sessionID, directory })
      if (result.error !== undefined || !result.data) throw result.error ?? new Error("session messages unavailable")
      return result.data.map((record) => record.info)
    },
  })
  const source = sourceFactory(meta)({
    loadSnapshot,
    onEvent: (type, handler) => api.event.on(type, handler as never),
    setTimer: (callback, delayMs) => globalThis.setTimeout(callback, delayMs),
    clearTimer: (timer) => globalThis.clearTimeout(timer as ReturnType<typeof globalThis.setTimeout>),
  })
  const [state, setState] = createSignal<SesTokensSourceState | undefined>(source.state())
  context.onCleanup(source.dispose)
  context.onCleanup(source.subscribe(() => setState(source.state())))

  function SesTokensPanel() {
    const [collapsed, setCollapsed] = createSignal(api.kv.get(COLLAPSED_KEY, false))
    const model = createMemo(() => {
      const current = state()
      return current?.phase === "ready" || current?.phase === "stale"
        ? createSesTokensPanelModel(current.snapshot.messages)
        : undefined
    })
    const rows = createMemo(() => {
      const current = model()
      return current ? metricRows(current) : []
    })
    const toggle = () => {
      const next = !collapsed()
      setCollapsed(next)
      api.kv.set(COLLAPSED_KEY, next)
    }
    const summary = () => {
      if (!collapsed()) return undefined
      const currentModel = model()
      if (currentModel) {
        return {
          text: currentModel.summary.map((segment) => segment.text).join(""),
          segments: currentModel.summary,
        }
      }
      return state()?.phase === "unavailable"
        ? { text: "Usage unavailable", status: "textMuted" as const }
        : { text: "Loading...", status: "textMuted" as const }
    }
    const render = () => (
      <CompactPanel
        title="SesTokens"
        collapsed={collapsed()}
        detail={state()?.phase === "stale" ? { text: "stale", status: "warning" } : undefined}
        summary={summary()}
        onToggle={toggle}
        footerDivider={!collapsed()}
        theme={() => api.theme.current}
      >
        <Show
          when={model()}
          fallback={
            <text fg={api.theme.current.textMuted}>
              {state()?.phase === "unavailable" ? "Usage unavailable" : "Loading..."}
            </text>
          }
        >
          <For each={rows()}>
            {(row) => <SesTokensMetricRow row={row} theme={() => api.theme.current} />}
          </For>
        </Show>
      </CompactPanel>
    )

    return render as unknown as JSX.Element
  }

  function SesTokensSlot(props: { sessionID?: string }) {
    const sessionID = () => props.sessionID ?? ""
    createEffect(() => source.setSessionID(sessionID()))
    return (
      <Show when={sessionID() !== ""}>
        <SesTokensPanel />
      </Show>
    )
  }

  api.slots.register({
    order: descriptor.slotOrder,
    slots: {
      sidebar_content(_ctx, props) {
        return <SesTokensSlot sessionID={props.session_id} />
      },
    },
  })
})

export default plugin
