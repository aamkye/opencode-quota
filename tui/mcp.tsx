import { createEffect, createMemo, createSignal, For, type JSX } from "solid-js"

import {
  CompactPanel,
  CompactStatusRow,
  createMcpPanelModel,
  defineTuiPlugin,
  pluginDescriptor,
  resolveCollapseDefault,
} from "../shared/opencode-tools-shared.js"

const descriptor = pluginDescriptor("mcp")
const plugin = defineTuiPlugin(descriptor, (_context, api, options) => {
  const defaultCollapsed = resolveCollapseDefault(options, false).collapsed
  const [sessionID, setSessionID] = createSignal("")

  function McpPanel() {
    const [collapsed, setCollapsed] = createSignal(defaultCollapsed)
    const [pendingExpand, setPendingExpand] = createSignal(false)
    const model = createMemo(() => createMcpPanelModel(api.state.mcp()))
    const isCollapsed = () => model().total === 0 || collapsed()
    const summary = () => {
      const panel = model()
      return isCollapsed() ? { text: `${panel.connected}/${panel.warning}/${panel.error}`, segments: panel.summary } : undefined
    }

    createEffect(() => {
      sessionID()
      setCollapsed(defaultCollapsed)
      setPendingExpand(false)
    })

    createEffect(() => {
      if (model().total === 0 || !pendingExpand()) return
      setPendingExpand(false)
      setCollapsed(false)
    })

    const toggle = () => {
      if (model().total === 0) {
        setPendingExpand(true)
        return
      }
      setPendingExpand(false)
      setCollapsed((current) => !current)
    }

    const render = () => (
      <CompactPanel
        title="MCP"
        collapsed={isCollapsed()}
        summary={summary()}
        onToggle={toggle}
        footerDivider={!isCollapsed() && model().total > 0}
        theme={() => api.theme.current}
      >
        <For each={model().rows}>
          {(row) => (
            <CompactStatusRow
              name={row.name}
              label={row.label}
              status={row.status}
              theme={() => api.theme.current}
            />
          )}
        </For>
      </CompactPanel>
    )

    return render as unknown as JSX.Element
  }

  api.slots.register({
    order: descriptor.slotOrder,
    slots: {
      sidebar_content(_ctx, props) {
        setSessionID(props?.session_id ?? "")
        return <McpPanel />
      },
    },
  })
})

export default plugin
