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
    const summary = () => {
      const panel = model()
      return collapsed() ? { text: `${panel.connected}/${panel.warning}/${panel.error}`, segments: panel.summary } : undefined
    }

    const toggle = () => {
      const next = !collapsed()
      setCollapsed(next)
      api.kv.set(COLLAPSED_KEY, next)
    }

    const render = () => (
        <CompactPanel
          title="MCP"
          collapsed={collapsed()}
          summary={summary()}
          onToggle={toggle}
          footerDivider={!collapsed()}
          theme={() => api.theme.current}
        >
          {model().rows.length === 0
            ? <CompactStatusRow name="No MCP servers configured" label="" status="textMuted" theme={() => api.theme.current} />
            : <For each={model().rows}>
                {(row) => (
                  <CompactStatusRow
                    name={row.name}
                    label={row.label}
                    status={row.status}
                    theme={() => api.theme.current}
                  />
                )}
              </For>}
        </CompactPanel>
    )

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
