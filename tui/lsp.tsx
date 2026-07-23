import { createEffect, createMemo, createSignal, For, Show, type JSX } from "solid-js"

import {
  allocateStatusRow,
  CompactPanel,
  createLspPanelModel,
  defineTuiPlugin,
  PANEL_MAX_CELLS,
  pluginDescriptor,
  resolveCollapseDefault,
  type LspStatusRow,
  type PanelTheme,
} from "../shared/opencode-tools-shared.js"

const descriptor = pluginDescriptor("lsp")
function LspRow(props: { row: LspStatusRow; theme: () => PanelTheme }) {
  const allocation = () => allocateStatusRow(PANEL_MAX_CELLS, props.row.label.length)
  return (
    <box flexDirection="row" width="100%" overflow="hidden">
      <text width={2} flexShrink={0} fg={props.theme()[props.row.status]}>• </text>
      <text
        flexBasis={0}
        flexGrow={1}
        flexShrink={1}
        minWidth={0}
        overflow="hidden"
        wrapMode="none"
        truncate={true}
      >
        {props.row.id}
      </text>
      <Show when={props.row.label !== ""}>
        <text width={allocation().beforeLabelGap} flexShrink={0}> </text>
        <box width={allocation().label} flexShrink={0} overflow="hidden" justifyContent="flex-end">
          <text fg={props.theme().textMuted} wrapMode="none">{props.row.label}</text>
        </box>
      </Show>
    </box>
  )
}

const plugin = defineTuiPlugin(descriptor, (_context, api, options) => {
  const defaultCollapsed = resolveCollapseDefault(options, false).collapsed
  const [sessionID, setSessionID] = createSignal("")

  function LspPanel() {
    const [collapsed, setCollapsed] = createSignal(defaultCollapsed)
    createEffect(() => {
      sessionID()
      setCollapsed(defaultCollapsed)
    })
    const model = createMemo(() => createLspPanelModel(api.state.lsp()))
    const toggle = () => setCollapsed((current) => !current)

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
    slots: {
      sidebar_content(_ctx, props) {
        setSessionID(props?.session_id ?? "")
        return <LspPanel />
      },
    },
  })
})

export default plugin
