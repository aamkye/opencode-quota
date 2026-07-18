import { createMemo, createSignal, type JSX } from "solid-js"

import {
  CompactPanel,
  createContextPanelModel,
  defineTuiPlugin,
  pluginDescriptor,
} from "../shared/opencode-tools-shared.js"

const descriptor = pluginDescriptor("context")
const COLLAPSED_KEY = "aamkye.opencode-tools-context.collapsed"

function ContextMetricRow(props: { label: string; value: string }) {
  return (
    <box flexDirection="row" width="100%" overflow="hidden">
      <text flexBasis={0} flexGrow={1} flexShrink={1} minWidth={0}>{props.label}</text>
      <text flexShrink={0} wrapMode="none">{props.value}</text>
    </box>
  )
}

const plugin = defineTuiPlugin(descriptor, (_context, api) => {
  const [sessionID, setSessionID] = createSignal("")

  function ContextPanel() {
    const [collapsed, setCollapsed] = createSignal(api.kv.get(COLLAPSED_KEY, false))
    const model = createMemo(() => {
      const currentSessionID = sessionID()
      const messages = currentSessionID ? api.state.session.messages(currentSessionID) : []
      return createContextPanelModel(messages, api.state.provider)
    })
    const toggle = () => {
      const next = !collapsed()
      setCollapsed(next)
      api.kv.set(COLLAPSED_KEY, next)
    }
    const render = () => (
      <CompactPanel
        title="Context"
        collapsed={collapsed()}
        summary={collapsed() ? { text: model().summary } : undefined}
        onToggle={toggle}
        footerDivider={!collapsed()}
        theme={() => api.theme.current}
      >
        <ContextMetricRow label="Tokens" value={model().tokens} />
        <ContextMetricRow label="Used" value={model().used} />
        <ContextMetricRow label="Spent" value={model().spent} />
      </CompactPanel>
    )
    return render as unknown as JSX.Element
  }

  api.slots.register({
    order: descriptor.slotOrder,
    slots: {
      sidebar_content(_ctx, props) {
        setSessionID(props.session_id ?? "")
        return <ContextPanel />
      },
    },
  })
})

export default plugin
