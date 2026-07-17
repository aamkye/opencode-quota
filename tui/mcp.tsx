import { createMemo, createSignal, For } from "solid-js"

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
  const [collapsed, setCollapsed] = createSignal(api.kv.get(COLLAPSED_KEY, false))
  const model = createMemo(() => createMcpPanelModel(api.state.mcp()))
  const effectiveCollapsed = () => model().total === 0 || collapsed()

  const toggle = () => {
    if (model().total === 0) return
    const next = !collapsed()
    setCollapsed(next)
    api.kv.set(COLLAPSED_KEY, next)
  }

  api.slots.register({
    order: descriptor.slotOrder,
    slots: {
      sidebar_content() {
        const panel = model()
        const isCollapsed = effectiveCollapsed()

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
      },
    },
  })
})

export default plugin
