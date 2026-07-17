import { createMemo, createSignal, For, type JSX } from "solid-js"

import {
  CompactPanel,
  CompactStatusRow,
  createMcpPanelModel,
  defineTuiPlugin,
  pluginDescriptor,
} from "../shared/opencode-tools-shared.js"

const descriptor = pluginDescriptor("mcp")
const COLLAPSED_KEY = "aamkye.opencode-tools-mcp.collapsed"

const plugin = defineTuiPlugin(descriptor, (_context, api) => {
  function McpPanel() {
    const [collapsed, setCollapsed] = createSignal(api.kv.get(COLLAPSED_KEY, false))
    const model = createMemo(() => createMcpPanelModel(api.state.mcp()))

    const toggle = () => {
      if (model().total === 0) return
      const next = !collapsed()
      setCollapsed(next)
      api.kv.set(COLLAPSED_KEY, next)
    }

    const render = () => {
      const panel = model()
      const isCollapsed = panel.total === 0 || collapsed()

      return (
        <CompactPanel
          title="MCP"
          collapsed={isCollapsed}
          summary={isCollapsed ? { text: `${panel.connected}/${panel.total}`, segments: panel.summary } : undefined}
          onToggle={toggle}
          footerDivider={!isCollapsed && panel.total > 0}
          theme={() => api.theme.current}
        >
          <For each={panel.rows}>
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
    }

    return render as unknown as JSX.Element
  }

  api.slots.register({
    order: descriptor.slotOrder,
    slots: {
      sidebar_content() {
        return <McpPanel />
      },
    },
  })
})

export default plugin
