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
  detail?: CompactPanelSummary
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

function CompactSummary(props: { value: CompactPanelSummary; theme: Accessor<PanelTheme> }) {
  const color = (status?: PanelStatus) => (status ? props.theme()[status] : undefined)

  return props.value.segments?.length
    ? (
        <box flexDirection="row" flexShrink={0}>
          <For each={props.value.segments}>
            {(segment) => <text flexShrink={0} fg={color(segment.status)}>{segment.text}</text>}
          </For>
        </box>
      )
    : <text flexShrink={0} fg={color(props.value.status)}>{props.value.text}</text>
}

export function CompactStatusRow(props: CompactStatusRowProps) {
  const allocation = () => allocateStatusRow(37, props.label.length)

  return (
    <box flexDirection="row" width="100%" overflow="hidden">
      <text width={allocation().bullet} flexShrink={0} fg={props.theme()[props.status]}>• </text>
      <text
        flexBasis={0}
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
  return (
    <box flexDirection="column" width="100%">
      <box flexDirection="row" width="100%" onMouseDown={props.onToggle}>
        <text width={2}>{props.collapsed ? "▶ " : "▼ "}</text>
        <text flexBasis={0} flexGrow={1} flexShrink={1} minWidth={0}>{props.title}</text>
        <Show when={props.detail}>
          {(detail) => <CompactSummary value={detail()} theme={props.theme} />}
        </Show>
        <Show when={props.collapsed && props.detail && props.summary}>
          <text width={1} flexShrink={0}> </text>
        </Show>
        <Show when={props.collapsed ? props.summary : undefined}>
          {(summary) => <CompactSummary value={summary()} theme={props.theme} />}
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
