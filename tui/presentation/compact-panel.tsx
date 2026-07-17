import { For, Show, type Accessor, type JSX } from "solid-js"

import type { PanelStatus, PanelTextSegment } from "./types.js"

export type PanelTheme = Record<PanelStatus, string>

export type CompactPanelSummary = {
  text: string
  segments?: readonly PanelTextSegment[]
  status?: PanelStatus
}

export type CompactPanelProps = {
  title: string
  collapsed: boolean
  summary?: CompactPanelSummary
  onToggle: () => void
  children: JSX.Element
  footerDivider: boolean
  theme: Accessor<PanelTheme>
}

function Divider() {
  return <box width="100%" height={1} border={["top"]} />
}

export function CompactPanel(props: CompactPanelProps) {
  const color = (status?: PanelStatus) => (status ? props.theme()[status] : undefined)

  return (
    <box flexDirection="column" width="100%">
      <box flexDirection="row" width="100%" onMouseDown={props.onToggle}>
        <text width={2}>{props.collapsed ? "▶ " : "▼ "}</text>
        <text flexBasis={0} flexGrow={1}>{props.title}</text>
        <Show when={props.collapsed ? props.summary : undefined}>
          {(summary) => summary().segments?.length
            ? (
                <box flexDirection="row">
                  <For each={summary().segments}>
                    {(segment) => <text fg={color(segment.status)}>{segment.text}</text>}
                  </For>
                </box>
              )
            : <text fg={color(summary().status)}>{summary().text}</text>}
        </Show>
      </box>
      <Divider />
      <Show when={!props.collapsed}>
        <box flexDirection="column" width="100%" overflow="hidden">
          {props.children}
        </box>
        <Show when={props.footerDivider}>
          <Divider />
        </Show>
      </Show>
    </box>
  )
}
