import { createEffect, createMemo, createSignal, For, Show, type JSX } from "solid-js"

import {
  CompactPanel,
  createTodoPanelModel,
  defineTuiPlugin,
  pluginDescriptor,
  resolveChipOption,
  resolveCollapseDefault,
  StatusChip,
  type PanelTheme,
  type TodoStatusRow,
} from "../shared/opencode-tools-shared.js"

const descriptor = pluginDescriptor("todo")
function TodoRow(props: { row: TodoStatusRow; theme: () => PanelTheme }) {
  return (
    <box flexDirection="row" width="100%" overflow="hidden">
      <text width={4} flexShrink={0} fg={props.theme()[props.row.status]}>{`${props.row.marker} `}</text>
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

const plugin = defineTuiPlugin(descriptor, (_context, api, options) => {
  const [sessionID, setSessionID] = createSignal("")
  const defaultCollapsed = resolveCollapseDefault(options, false).collapsed
  const chipEnabled = resolveChipOption(options, true).enabled

  function TodoChip(props: { sessionID: string; theme: () => PanelTheme }) {
    const model = createMemo(() =>
      createTodoPanelModel(props.sessionID ? api.state.session.todo(props.sessionID) : []),
    )
    return (
      <Show when={model().total > 0}>
        <StatusChip label="TODO" segments={model().summary} theme={props.theme} />
      </Show>
    )
  }

  function TodoPanel() {
    const [collapsed, setCollapsed] = createSignal(defaultCollapsed)
    createEffect(() => {
      sessionID()
      setCollapsed(defaultCollapsed)
    })
    const model = createMemo(() => {
      const currentSessionID = sessionID()
      const records = currentSessionID ? api.state.session.todo(currentSessionID) : []
      return createTodoPanelModel(records)
    })
    const toggle = () => setCollapsed((current) => !current)

    const render = () => (
      <CompactPanel
        title="TODO"
        collapsed={collapsed()}
        summary={collapsed() ? { text: `${model().done}/${model().working}/${model().todo}`, segments: model().summary } : undefined}
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
      session_prompt_right(_ctx, props) {
        return chipEnabled
          ? <TodoChip sessionID={props?.session_id ?? ""} theme={() => api.theme.current} />
          : null
      },
    },
  })
})

export default plugin
