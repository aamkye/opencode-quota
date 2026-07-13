import { For, Show, createSignal, onCleanup, type Accessor } from "solid-js"

import { formatBytes, formatCount, formatCurrency, formatDuration, formatPercent, formatTimer, truncateText } from "./format.js"
import { allocateCompactTable, allocateHeader, allocateProgressRow, type CompactTableAllocation, type HeaderAllocation, type ProgressRowAllocation } from "./layout.js"
import { sortByOrderThenId, type DisplayValue, type PanelAlignment, type PanelGroup, type PanelItem, type PanelModel, type PanelStatus } from "./types.js"

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
  | { id: string; kind: "header"; title: string; detail?: string; status?: PanelStatus }
  | { id: string; kind: "text"; text: string; align: PanelAlignment; status?: PanelStatus }
  | { id: string; kind: "progress"; label: string; percent: string; allocation: ProgressRowAllocation; status?: PanelStatus }
  | { id: string; kind: "timer"; text: string; detail?: string; status?: PanelStatus }
  | { id: string; kind: "quantity"; label: string; value: string; align: PanelAlignment; status?: PanelStatus }
  | {
      id: string
      kind: "table"
      layout: "compact"
      columns: { id: string; title: string; align: PanelAlignment }[]
      rows: { id: string; cells: string[] }[]
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
    case "header":
      return { id: item.id, kind: item.kind, title: item.title, detail: item.detail, status: item.status }
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
        text: `${item.label}: ${formatTimer(item, now)}`,
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
      const [keyColumn, valueColumn] = columns
      const allocation = allocateCompactTable(availableCells, {
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
          cells: columnIndexes.map((index) => formatDisplayValue(row.cells[index]!)),
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
    ? { id: `${model.id}:summary`, text: summary, status: model.collapsedSummary?.status }
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

function Divider() {
  return (
    <box width="100%">
      <text>────────────────</text>
    </box>
  )
}

function RenderItem(props: { item: NormalizedItem }) {
  switch (props.item.kind) {
    case "header":
      return <text>{props.item.detail ? `${props.item.title}: ${props.item.detail}` : props.item.title}</text>
    case "text":
      return <text>{props.item.text}</text>
    case "progress":
      return (
        <box flexDirection="row" width="100%">
          <text>{props.item.label}</text>
          <box flexGrow={1} />
          <text>{props.item.percent}</text>
        </box>
      )
    case "timer":
      return (
        <box flexDirection="column">
          <text>{props.item.text}</text>
          <Show when={props.item.detail}>
            <text>{props.item.detail}</text>
          </Show>
        </box>
      )
    case "quantity":
      return <text>{`${props.item.label}: ${props.item.value}`}</text>
    case "table":
      return (
        <box flexDirection="column">
          <For each={props.item.rows}>
            {(row) => <text>{row.cells.join(" ")}</text>}
          </For>
        </box>
      )
  }
}

export function PanelRenderer(props: { model: Accessor<PanelModel> }) {
  const [collapsed, setCollapsed] = createSignal(new Set<string>())
  const [now, setNow] = createSignal(Date.now())
  const interval = setInterval(() => setNow(Date.now()), 1_000)
  onCleanup(() => clearInterval(interval))

  const isCollapsed = (id: string) => collapsed().has(id)
  const toggle = (id: string) => {
    setCollapsed((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  const normalized = () => normalizePanelModel(props.model(), { now: now() })

  return (
    <box flexDirection="column" width="100%">
      <box flexDirection="row" width="100%" onMouseDown={() => toggle(`panel:${normalized().id}`)}>
        <text>{isCollapsed(`panel:${normalized().id}`) ? "▶" : "▼"}</text>
        <text>{normalized().title}</text>
        <box flexGrow={1} />
        <Show when={normalized().header.summary}>
          {(summary) => <text>{summary().text}</text>}
        </Show>
      </box>
      <Show when={!isCollapsed(`panel:${normalized().id}`)}>
        <For each={normalized().groups}>
          {(group) => (
            <box flexDirection="column" width="100%">
              <Show when={group.header}>
                {(header) => (
                  <box
                    flexDirection="row"
                    width="100%"
                    onMouseDown={header().collapsible ? () => toggle(`group:${group.id}`) : undefined}
                  >
                    <text>{header().collapsible ? (isCollapsed(`group:${group.id}`) ? "▶" : "▼") : ""}</text>
                    <text>{header().title}</text>
                  </box>
                )}
              </Show>
              <Show when={!isCollapsed(`group:${group.id}`)}>
                <For each={group.items}>
                  {(item) => <RenderItem item={item} />}
                </For>
              </Show>
              <Divider />
            </box>
          )}
        </For>
      </Show>
    </box>
  )
}
