import { createMemo, createSignal, For, Show, type JSX } from "solid-js"

import {
  CompactPanel,
  createTodoPanelModel,
  defineTuiPlugin,
  pluginDescriptor,
  type PanelTheme,
  type TodoStatusRow,
} from "../shared/opencode-tools-shared.js"

const descriptor = pluginDescriptor("todo")
const COLLAPSED_KEY = "aamkye.opencode-tools-todo.collapsed"

function TodoRow(props: { row: TodoStatusRow; theme: () => PanelTheme }) {
  return (
    <box flexDirection="row" width="100%" overflow="hidden">
      <text width={4} flexShrink={0} fg={props.theme()[props.row.status]}>{props.row.marker} </text>
      <text
        flexBasis={0}
        flexGrow={1}
        flexShrink={1}
        minWidth={0}
        overflow="hidden"
        wrapMode="word"
      >
        {props.row.content}
      </text>
    </box>
  )
}

const plugin = defineTuiPlugin(descriptor, (_context, api) => {
  const [sessionID, setSessionID] = createSignal("")

  function TodoPanel() {
    const [collapsed, setCollapsed] = createSignal(api.kv.get(COLLAPSED_KEY, false))
    const model = createMemo(() => {
      const currentSessionID = sessionID()
      const records = currentSessionID ? api.state.session.todo(currentSessionID) : []
      return createTodoPanelModel(records)
    })
    const toggle = () => {
      const next = !collapsed()
      setCollapsed(next)
      api.kv.set(COLLAPSED_KEY, next)
    }

    const render = () => (
      <CompactPanel
        title="TODO"
        collapsed={collapsed()}
        summary={collapsed() ? { text: model().summary } : undefined}
        onToggle={toggle}
        footerDivider={!collapsed()}
        theme={() => api.theme.current}
      >
        <Show
          when={model().rows.length > 0}
          fallback={<text fg={api.theme.current.textMuted}>No TODOs for this session</text>}
        >
          <For each={model().rows}>
            {(row) => <TodoRow row={row} theme={() => api.theme.current} />}
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
        setSessionID(props.session_id ?? "")
        return <TodoPanel />
      },
    },
  })
})

export default plugin
