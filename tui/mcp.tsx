import { createEffect, createMemo, createSignal, For, type JSX } from "solid-js"

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
    const [pendingExpand, setPendingExpand] = createSignal(false)
    const model = createMemo(() => createMcpPanelModel(api.state.mcp()))
    const isCollapsed = () => model().total === 0 || collapsed()
    const summary = () => {
      const panel = model()
      return isCollapsed() ? { text: `${panel.connected}/${panel.total}`, segments: panel.summary } : undefined
    }

    createEffect(() => {
      if (model().total === 0 || !pendingExpand()) return
      setPendingExpand(false)
      setCollapsed(false)
      api.kv.set(COLLAPSED_KEY, false)
    })

    const toggle = () => {
      if (model().total === 0) {
        setPendingExpand(true)
        return
      }
      setPendingExpand(false)
      const next = !collapsed()
      setCollapsed(next)
      api.kv.set(COLLAPSED_KEY, next)
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
      sidebar_content() {
        return <McpPanel />
      },
    },
  })
})

export default plugin
