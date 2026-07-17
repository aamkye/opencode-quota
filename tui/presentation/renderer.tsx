import { For, Show, createSignal, onCleanup, type Accessor } from "solid-js"

import { CompactPanel, type PanelTheme } from "./compact-panel.js"
import { alignText, formatBytes, formatCount, formatCurrency, formatDuration, formatPercent, formatTimer, truncateText } from "./format.js"
import { allocateCompactTable, allocateHeader, allocateProgressRow, type CompactTableAllocation, type HeaderAllocation, type ProgressRowAllocation } from "./layout.js"
import { sortByOrderThenId, type DisplayValue, type PanelAlignment, type PanelGroup, type PanelItem, type PanelModel, type PanelStatus, type PanelTextSegment } from "./types.js"

type NormalizedHeader = {
  id: string
  cells: {
    id: string
    text: string
    status?: PanelStatus
  }[]
  summary?: {
    id: string
    text: string
    segments?: PanelTextSegment[]
    status?: PanelStatus
  }
  allocation: HeaderAllocation
}

type NormalizedGroupHeader = {
  id: string
  title: string
  collapsible: boolean
}

type NormalizedItem =
  | { id: string; kind: "divider" }
  | {
      id: string
      kind: "header"
      title: string
      detail?: string
      detailSegments?: PanelTextSegment[]
      status?: PanelStatus
    }
  | { id: string; kind: "text"; text: string; align: PanelAlignment; status?: PanelStatus }
  | { id: string; kind: "progress"; label: string; percent: string; allocation: ProgressRowAllocation; status?: PanelStatus }
  | { id: string; kind: "timer"; text: string; detail?: string; status?: PanelStatus }
  | { id: string; kind: "quantity"; label: string; value: string; align: PanelAlignment; status?: PanelStatus }
  | {
      id: string
      kind: "table"
      layout: "compact"
      columns: { id: string; title: string; align: PanelAlignment }[]
      rows: { id: string; cells: { text: string; status?: PanelStatus }[] }[]
      allocation: CompactTableAllocation
      status?: PanelStatus
    }

type NormalizedGroup = {
  id: string
  header?: NormalizedGroupHeader
  items: NormalizedItem[]
}

export type NormalizedPanel = {
  id: string
  title: string
  header: NormalizedHeader
  groups: NormalizedGroup[]
}

export type RendererNormalizationOptions = {
  availableCells?: number
  now?: number
}

type RenderedCell = {
  text: string
  width: number
  align: PanelAlignment
  status?: PanelStatus
}

type RenderedItem =
  | { kind: "divider" }
  | { kind: "header" | "text" | "quantity"; text: string; status?: PanelStatus }
  | { kind: "progress"; cells: RenderedCell[] }
  | { kind: "timer"; text: string; detail?: string; status?: PanelStatus }
  | { kind: "table"; rows: RenderedCell[][] }

export type { PanelTheme } from "./compact-panel.js"

export type RenderedPanelLayout = {
  collapsed: boolean
  header: { cells: RenderedCell[] }
  groups: { id: string; header?: { title: string; collapsible: boolean }; collapsed: boolean; items: RenderedItem[] }[]
  divider: { width: "100%"; border: ["top"] }
}

export type RendererLayoutOptions = RendererNormalizationOptions & {
  collapsed?: ReadonlySet<string>
}

function formatDisplayValue(value: DisplayValue): string {
  if (value.kind === "text") return value.text

  switch (value.unit) {
    case "count":
      return formatCount(value.value, value.precision)
    case "bytes":
      return formatBytes(value.value, value.precision)
    case "duration":
      return formatDuration(value.value)
    case "currency":
      return formatCurrency(value.value, value.precision)
  }
}

function formatDisplayCell(value: DisplayValue): { text: string; status?: PanelStatus } {
  return value.status ? { text: formatDisplayValue(value), status: value.status } : { text: formatDisplayValue(value) }
}

function formatItemQuantity(item: Extract<PanelItem, { kind: "quantity" }>): string {
  return formatDisplayValue({
    kind: "quantity",
    value: item.value,
    unit: item.unit,
    precision: item.precision,
  })
}

function normalizeItem(item: PanelItem, availableCells: number, now: number): NormalizedItem {
  switch (item.kind) {
    case "divider":
      return { id: item.id, kind: item.kind }
    case "header":
      return {
        id: item.id,
        kind: item.kind,
        title: item.title,
        detail: item.detail,
        detailSegments: item.detailSegments?.map((segment) => ({ ...segment })),
        status: item.status,
      }
    case "text":
      return {
        id: item.id,
        kind: item.kind,
        text: typeof item.maxWidth === "number" ? truncateText(item.text, item.maxWidth) : item.text,
        align: item.align ?? "start",
        status: item.status,
      }
    case "progress":
      return {
        id: item.id,
        kind: item.kind,
        label: item.label,
        percent: formatPercent(item.total > 0 ? (item.value / item.total) * 100 : 0),
        allocation: allocateProgressRow(availableCells),
        status: item.status,
      }
    case "timer":
      return {
        id: item.id,
        kind: item.kind,
        text: formatTimer(item, now),
        detail: item.detail,
        status: item.status,
      }
    case "quantity":
      return {
        id: item.id,
        kind: item.kind,
        label: item.label,
        value: formatItemQuantity(item),
        align: item.align ?? "end",
        status: item.status,
      }
    case "table": {
      const columns = sortByOrderThenId(item.columns)
      const columnIndexes = columns.map((column) => item.columns.indexOf(column))
      const [identityColumn, keyColumn, valueColumn] = columns.length === 3 ? columns : [undefined, columns[0], columns[1]]
      const allocation = allocateCompactTable(availableCells, {
        identity: identityColumn?.title.length,
        key: keyColumn?.title.length ?? 0,
        value: valueColumn?.title.length ?? 0,
      })

      return {
        id: item.id,
        kind: item.kind,
        layout: "compact",
        columns: columns.map((column) => ({ id: column.id, title: column.title, align: column.align ?? "start" })),
        rows: sortByOrderThenId(item.rows).map((row) => ({
          id: row.id,
          cells: columnIndexes.map((index) => formatDisplayCell(row.cells[index]!)),
        })),
        allocation,
        status: item.status,
      }
    }
  }
}

function normalizeGroup(group: PanelGroup, availableCells: number, now: number): NormalizedGroup {
  return {
    id: group.id,
    header: group.header
      ? {
          id: `${group.id}:header`,
          title: group.header.title,
          collapsible: group.header.collapsible ?? false,
        }
      : undefined,
    items: sortByOrderThenId(group.items).map((item) => normalizeItem(item, availableCells, now)),
  }
}

export function normalizePanelModel(model: PanelModel, options: RendererNormalizationOptions = {}): NormalizedPanel {
  const availableCells = options.availableCells ?? 80
  const summary = model.collapsedSummary ? formatDisplayValue(model.collapsedSummary) : undefined
  const summaryCell = summary
    ? {
        id: `${model.id}:summary`,
        text: summary,
        ...(model.collapsedSummary?.kind === "text" && model.collapsedSummary.segments?.length
          ? { segments: model.collapsedSummary.segments.map((segment) => ({ ...segment })) }
          : {}),
        status: model.collapsedSummary?.status,
      }
    : undefined

  return {
    id: model.id,
    title: truncateText(model.title, availableCells),
    header: {
      id: `${model.id}:header`,
      cells: [
        { id: `${model.id}:marker`, text: "" },
        { id: `${model.id}:title`, text: model.title },
        ...(summaryCell ? [summaryCell] : []),
      ],
      summary: summaryCell,
      allocation: allocateHeader(availableCells, model.title, summary),
    },
    groups: sortByOrderThenId(model.groups).map((group) => normalizeGroup(group, availableCells, options.now ?? Date.now())),
  }
}

function renderCell(text: string, width: number, align: PanelAlignment, status?: PanelStatus): RenderedCell {
  const cell = { text: alignText(truncateText(text, width), width, align), width, align }
  return status ? { ...cell, status } : cell
}

function renderSegmentCells(segments: readonly PanelTextSegment[], width: number): RenderedCell[] {
  const cells: RenderedCell[] = []
  let remaining = width
  for (let index = segments.length - 1; index >= 0 && remaining > 0; index -= 1) {
    const segment = segments[index]!
    const text = segment.text.slice(-remaining)
    cells.unshift(renderCell(text, text.length, "start", segment.status))
    remaining -= text.length
  }
  return cells
}

function renderItemLayout(item: NormalizedItem): RenderedItem {
  switch (item.kind) {
    case "divider":
      return { kind: item.kind }
    case "header": {
      const detail = item.detailSegments?.length
        ? item.detailSegments.map((segment) => segment.text).join("")
        : item.detail
      return {
        kind: item.kind,
        text: detail ? `${item.title}: ${detail}` : item.title,
        status: item.status,
      }
    }
    case "text":
      return { kind: item.kind, text: item.text, status: item.status }
    case "progress": {
      const filled = Math.round((Number.parseInt(item.percent, 10) / 100) * item.allocation.bar)
      const bar = "█".repeat(filled) + "░".repeat(item.allocation.bar - filled)
      return {
        kind: item.kind,
        cells: [
          renderCell(item.label, item.allocation.marker, "start", item.status),
          ...(item.allocation.beforeBarGap > 0 ? [renderCell("", item.allocation.beforeBarGap, "start", item.status)] : []),
          renderCell(bar, item.allocation.bar, "start", item.status),
          renderCell("", item.allocation.beforePercentGap, "start", item.status),
          renderCell(item.percent, item.allocation.percent, "end", item.status),
        ],
      }
    }
    case "timer":
      return { kind: item.kind, text: item.text, detail: item.detail, status: item.status }
    case "quantity":
      return { kind: item.kind, text: `${item.label}: ${item.value}`, status: item.status }
    case "table": {
      const [identityColumn, keyColumn, valueColumn] = item.columns.length === 3 ? item.columns : [undefined, item.columns[0], item.columns[1]]
      const renderRow = (cells: { text: string; status?: PanelStatus }[]) => {
        const identityOffset = identityColumn ? 1 : 0
        return [
          ...(identityColumn && item.allocation.identity > 0
            ? [
                renderCell(cells[0]?.text ?? "", item.allocation.identity, identityColumn.align, cells[0]?.status ?? item.status),
                renderCell("", item.allocation.beforeKeyGap, "start", item.status),
              ]
            : []),
          renderCell(cells[identityOffset]?.text ?? "", item.allocation.key, keyColumn?.align ?? "start", cells[identityOffset]?.status ?? item.status),
          renderCell("", item.allocation.beforeValueGap, "start", item.status),
          renderCell(cells[identityOffset + 1]?.text ?? "", item.allocation.value, item.allocation.valueAlign === "right" ? "end" : "start", cells[identityOffset + 1]?.status ?? item.status),
        ]
      }

      return {
        kind: item.kind,
        rows: [
          renderRow(
            identityColumn
              ? [{ text: identityColumn.title }, { text: keyColumn?.title ?? "" }, { text: valueColumn?.title ?? "" }]
              : [{ text: keyColumn?.title ?? "" }, { text: valueColumn?.title ?? "" }],
          ),
          ...item.rows.map((row) => renderRow(row.cells)),
        ],
      }
    }
  }
}

export function toggleCollapsed(collapsed: ReadonlySet<string>, id: string): Set<string> {
  const next = new Set(collapsed)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  return next
}

export function renderPanelLayout(model: PanelModel, options: RendererLayoutOptions = {}): RenderedPanelLayout {
  const normalized = normalizePanelModel(model, options)
  const collapsed = options.collapsed ?? new Set<string>()
  const panelCollapsed = collapsed.has(`panel:${normalized.id}`)
  const title = normalized.header.cells[1]?.text ?? ""
  const summary = panelCollapsed ? normalized.header.summary : undefined
  const allocation = allocateHeader(options.availableCells ?? 80, title, summary?.text)

  return {
    collapsed: panelCollapsed,
    header: {
      cells: [
        renderCell(panelCollapsed ? "▶ " : "▼ ", allocation.marker, "start"),
        renderCell(title, allocation.label, "start"),
        ...(allocation.beforeSummaryGap > 0 ? [renderCell("", allocation.beforeSummaryGap, "start")] : []),
        ...(summary && allocation.summary > 0
          ? summary.segments?.length
            ? renderSegmentCells(summary.segments, allocation.summary)
            : [renderCell(summary.text, allocation.summary, "end", summary.status)]
          : []),
      ],
    },
    groups: panelCollapsed
      ? []
      : normalized.groups.map((group) => {
          const groupCollapsed = group.header?.collapsible === true && collapsed.has(`group:${group.id}`)
          return {
            id: group.id,
            header: group.header,
            collapsed: groupCollapsed,
            items: groupCollapsed ? [] : group.items.map(renderItemLayout),
          }
        }),
    divider: { width: "100%", border: ["top"] },
  }
}

function GroupDivider(props: { theme: Accessor<PanelTheme> }) {
  return (
    <box flexDirection="row" width="100%" height={1}>
      <text fg={props.theme().textMuted}>{"---"}</text>
      <box flexBasis={0} flexGrow={1} height={1} />
      <text fg={props.theme().textMuted}>{"---"}</text>
    </box>
  )
}

function MountedItem(props: { item: NormalizedItem; theme: Accessor<PanelTheme> }) {
  const color = (status?: PanelStatus) => (status ? props.theme()[status] : undefined)
  const metadataColor = (status?: PanelStatus) => (status ? props.theme()[status] : props.theme().textMuted)

  switch (props.item.kind) {
    case "divider":
      return <GroupDivider theme={props.theme} />
    case "header": {
      const item = props.item
      return (
        <box flexDirection="row" width="100%">
          <text flexBasis={0} flexGrow={1}>{item.title}</text>
          <Show when={!item.detailSegments?.length ? item.detail : undefined}>
            {(detail) => <text fg={color(item.status)}>{detail()}</text>}
          </Show>
          <Show when={item.detailSegments?.length ? item.detailSegments : undefined}>
            {(segments) => (
              <box flexDirection="row">
                <For each={segments()}>
                  {(segment) => <text fg={color(segment.status)}>{segment.text}</text>}
                </For>
              </box>
            )}
          </Show>
        </box>
      )
    }
    case "text":
      return <text fg={color(props.item.status)}>{props.item.text}</text>
    case "quantity":
      return <text fg={metadataColor(props.item.status)}>{`${props.item.label}: ${props.item.value}`}</text>
    case "progress": {
      const filled = Math.max(0, Math.min(100, Number.parseInt(props.item.percent, 10)))
      return (
        <box flexDirection="row" width="100%">
          <text width={3}>{props.item.label}</text>
          <box flexDirection="row" flexBasis={0} flexGrow={1} height={1} overflow="hidden">
            <text flexBasis={0} flexGrow={filled} height={1} wrapMode="none" fg={color(props.item.status)}>{"█".repeat(100)}</text>
            <text flexBasis={0} flexGrow={100 - filled} height={1} wrapMode="none" fg={props.theme().textMuted}>{"░".repeat(100)}</text>
          </box>
          <text width={1}> </text>
          <text width={4} fg={color(props.item.status)}>{props.item.percent.padStart(4)}</text>
        </box>
      )
    }
    case "timer":
      return (
        <box flexDirection="column">
          <box flexDirection="row" width="100%">
            <text width={3}>   </text>
            <text fg={metadataColor(props.item.status)}>{props.item.text}</text>
          </box>
          <Show when={props.item.detail}>
            <box flexDirection="row" width="100%">
              <text width={3}>   </text>
              <text fg={metadataColor(props.item.status)}>{props.item.detail}</text>
            </box>
          </Show>
        </box>
      )
    case "table": {
      const item = props.item
      const rows: { id: string; cells: { text: string; status?: PanelStatus }[] }[] = [
        {
          id: `${item.id}:header`,
          cells: item.columns.map((column) => ({ text: column.title })),
        },
        ...item.rows,
      ]
      return (
        <box flexDirection="column" width="100%">
          <For each={rows}>
            {(row) => (
              <box flexDirection="row" width="100%" overflow="hidden">
                {item.columns.map((column, index) => {
                  const cell = row.cells[index] ?? { text: "" }
                  return (
                    <box
                      flexBasis={0}
                      flexGrow={1}
                      flexShrink={1}
                      minWidth={0}
                      overflow="hidden"
                      justifyContent={column.align === "end" ? "flex-end" : column.align === "center" ? "center" : "flex-start"}
                    >
                      <text
                        flexShrink={1}
                        wrapMode="none"
                        truncate={true}
                        fg={color(cell.status ?? item.status)}
                      >
                        {cell.text}
                      </text>
                    </box>
                  )
                })}
              </box>
            )}
          </For>
        </box>
      )
    }
  }
}

export function PanelRenderer(props: { model: Accessor<PanelModel>; theme: Accessor<PanelTheme>; initiallyCollapsed?: boolean }) {
  const [collapsed, setCollapsed] = createSignal(new Set(props.initiallyCollapsed ? [`panel:${props.model().id}`] : []))
  const [now, setNow] = createSignal(Date.now())
  const interval = setInterval(() => setNow(Date.now()), 1_000)
  onCleanup(() => clearInterval(interval))

  const toggle = (id: string) => {
    setCollapsed((current) => toggleCollapsed(current, id))
  }

  const normalized = () => normalizePanelModel(props.model(), { now: now() })
  const panelCollapsed = () => collapsed().has(`panel:${props.model().id}`)

  return (
    <CompactPanel
      title={props.model().title}
      collapsed={panelCollapsed()}
      summary={normalized().header.summary}
      onToggle={() => toggle(`panel:${props.model().id}`)}
      footerDivider={normalized().groups.length > 0}
      theme={props.theme}
    >
      <For each={normalized().groups}>
        {(group, index) => {
          const groupCollapsed = () => group.header?.collapsible === true && collapsed().has(`group:${group.id}`)
          const isLastGroup = () => index() === normalized().groups.length - 1
          return (
            <box flexDirection="column" width="100%">
              <Show when={group.header}>
                {(header) => (
                  <box flexDirection="row" width="100%" onMouseDown={header().collapsible ? () => toggle(`group:${group.id}`) : undefined}>
                    <text fg={group.id === "other-providers" ? props.theme().textMuted : undefined}>{header().collapsible ? (groupCollapsed() ? "▶ " : "▼ ") : ""}</text>
                    <text fg={group.id === "other-providers" ? props.theme().textMuted : undefined}>{header().title}</text>
                  </box>
                )}
              </Show>
              <Show when={!groupCollapsed()}>
                <For each={group.items}>{(item) => <MountedItem item={item} theme={props.theme} />}</For>
              </Show>
              <Show when={!isLastGroup()}>
                <GroupDivider theme={props.theme} />
              </Show>
            </box>
          )
        }}
      </For>
    </CompactPanel>
  )
}
