import { For, Show, type Accessor, type JSX } from "solid-js"

import { allocateStatusRow } from "./layout.js"
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

export type CompactStatusRowProps = {
  name: string
  label: string
  status: PanelStatus
  theme: Accessor<PanelTheme>
}

function Divider() {
  return <box width="100%" height={1} border={["top"]} />
}

export function CompactStatusRow(props: CompactStatusRowProps) {
  const allocation = () => allocateStatusRow(37, props.label.length)

  return (
    <box flexDirection="row" width="100%" overflow="hidden">
      <text width={allocation().bullet} flexShrink={0} fg={props.theme()[props.status]}>• </text>
      <text
        width={allocation().name}
        flexGrow={1}
        flexShrink={1}
        minWidth={0}
        overflow="hidden"
        wrapMode="none"
        truncate={true}
      >
        {props.name}
      </text>
      <text width={allocation().beforeLabelGap} flexShrink={0}> </text>
      <box width={allocation().label} flexShrink={0} overflow="hidden" justifyContent="flex-end">
        <text fg={props.theme().textMuted} wrapMode="none">{props.label}</text>
      </box>
    </box>
  )
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
