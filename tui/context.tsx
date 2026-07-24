import { createEffect, createMemo, createSignal, Show, type JSX } from "solid-js"

import {
  CompactPanel,
  createContextPanelModel,
  defineTuiPlugin,
  pluginDescriptor,
  resolveChipOption,
  resolveCollapseDefault,
  StatusChip,
  type PanelStatus,
  type PanelTheme,
} from "../shared/opencode-tools-shared.js"

const descriptor = pluginDescriptor("context")
function ContextMetricRow(props: {
  label: string
  value: string
  status?: PanelStatus
  theme: () => PanelTheme
}) {
  return (
    <box flexDirection="row" width="100%" overflow="hidden">
      <text flexBasis={0} flexGrow={1} flexShrink={1} minWidth={0}>{props.label}</text>
      <text flexShrink={0} wrapMode="none" fg={props.status ? props.theme()[props.status] : undefined}>
        {props.value}
      </text>
    </box>
  )
}

const plugin = defineTuiPlugin(descriptor, (_context, api, options) => {
  const [sessionID, setSessionID] = createSignal("")
  const defaultCollapsed = resolveCollapseDefault(options, false).collapsed
  const chipEnabled = resolveChipOption(options, true).enabled

  function ContextChip(props: { sessionID: string; theme: () => PanelTheme }) {
    const model = createMemo(() => {
      const messages = props.sessionID ? api.state.session.messages(props.sessionID) : []
      return createContextPanelModel(messages, api.state.provider)
    })
    return (
      <Show when={model().summary !== "-"}>
        <StatusChip
          label="Ctx"
          segments={[{ text: model().summary, ...(model().usageStatus ? { status: model().usageStatus } : {}) }]}
          theme={props.theme}
        />
      </Show>
    )
  }

  function ContextPanel() {
    const [collapsed, setCollapsed] = createSignal(defaultCollapsed)
    createEffect(() => {
      sessionID()
      setCollapsed(defaultCollapsed)
    })
    const model = createMemo(() => {
      const currentSessionID = sessionID()
      const messages = currentSessionID ? api.state.session.messages(currentSessionID) : []
      return createContextPanelModel(messages, api.state.provider)
    })
    const toggle = () => setCollapsed((current) => !current)
    const render = () => (
      <CompactPanel
        title="Context"
        collapsed={collapsed()}
        summary={collapsed() ? { text: model().summary, status: model().usageStatus } : undefined}
        onToggle={toggle}
        footerDivider={!collapsed()}
        theme={() => api.theme.current}
      >
        <ContextMetricRow label="Limit" value={model().limit} theme={() => api.theme.current} />
        <ContextMetricRow label="Tokens" value={model().tokens} theme={() => api.theme.current} />
        <ContextMetricRow
          label="Used"
          value={model().used}
          status={model().usageStatus}
          theme={() => api.theme.current}
        />
        <ContextMetricRow
          label="Spent"
          value={model().spent}
          status={model().spentStatus}
          theme={() => api.theme.current}
        />
      </CompactPanel>
    )
    return render as unknown as JSX.Element
  }

  api.slots.register({
    order: descriptor.slotOrder,
    slots: {
      sidebar_content(_ctx, props) {
        setSessionID(props?.session_id ?? "")
        return <ContextPanel />
      },
      session_prompt_right(_ctx, props) {
        return chipEnabled
          ? <ContextChip sessionID={props?.session_id ?? ""} theme={() => api.theme.current} />
          : null
      },
    },
  })
})

export default plugin
