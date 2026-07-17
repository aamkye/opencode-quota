import { createMemo, createSignal, For, Show, type JSX } from "solid-js"

import {
  CompactPanel,
  createLspPanelModel,
  defineTuiPlugin,
  pluginDescriptor,
  type LspStatusRow,
  type PanelTheme,
} from "../shared/opencode-tools-shared.js"

const descriptor = pluginDescriptor("lsp")
const COLLAPSED_KEY = "aamkye.opencode-tools-lsp.collapsed"

function LspRow(props: { row: LspStatusRow; theme: () => PanelTheme }) {
  return (
    <box flexDirection="row" width="100%" overflow="hidden">
      <text width={2} flexShrink={0} fg={props.theme()[props.row.status]}>• </text>
      <text overflow="hidden" wrapMode="none" truncate={true}>{props.row.id}</text>
    </box>
  )
}

const plugin = defineTuiPlugin(descriptor, (_context, api) => {
  function LspPanel() {
    const [collapsed, setCollapsed] = createSignal(api.kv.get(COLLAPSED_KEY, false))
    const model = createMemo(() => createLspPanelModel(api.state.lsp()))
    const toggle = () => {
      const next = !collapsed()
      setCollapsed(next)
      api.kv.set(COLLAPSED_KEY, next)
    }

    const render = () => (
      <CompactPanel
        title="LSP"
        collapsed={collapsed()}
        summary={collapsed() ? { text: String(model().total) } : undefined}
        onToggle={toggle}
        footerDivider={!collapsed()}
        theme={() => api.theme.current}
      >
        <Show
          when={model().rows.length > 0}
          fallback={<text fg={api.theme.current.textMuted}>LSPs will activate as files are read</text>}
        >
          <For each={model().rows}>
            {(row) => <LspRow row={row} theme={() => api.theme.current} />}
          </For>
        </Show>
      </CompactPanel>
    )

    return render as unknown as JSX.Element
  }

  api.slots.register({
    order: descriptor.slotOrder,
    slots: { sidebar_content: () => <LspPanel /> },
  })
})

export default plugin
