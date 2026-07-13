export type PanelItemKind = "header" | "text" | "progress" | "timer" | "quantity" | "table"

export type TimerState = "unavailable" | "idle" | "countdown" | "expired"

export type QuantityUnit = "count" | "bytes" | "duration" | "currency"

export type PanelStatus = "error" | "warning" | "success" | "text" | "textMuted"

export type PanelAlignment = "start" | "center" | "end"

export type DisplayValue =
  | {
      kind: "text"
      text: string
      status?: PanelStatus
      maxWidth?: number
    }
  | {
      kind: "quantity"
      value: number
      unit: QuantityUnit
      precision?: number
      status?: PanelStatus
    }

type PanelItemBase = {
  id: string
  order: number
  status?: PanelStatus
  minWidth?: number
  maxWidth?: number
}

export type PanelItem =
  | (PanelItemBase & {
      kind: "header"
      title: string
      detail?: string
    })
  | (PanelItemBase & {
      kind: "text"
      text: string
      align?: PanelAlignment
    })
  | (PanelItemBase & {
      kind: "progress"
      label: string
      value: number
      total: number
    })
  | (PanelItemBase & {
      kind: "timer"
      label: string
      state: TimerState
      epoch?: number
      detail?: string
    })
  | (PanelItemBase & {
      kind: "quantity"
      label: string
      value: number
      unit: QuantityUnit
      precision?: number
      align?: PanelAlignment
    })
  | (PanelItemBase & {
      kind: "table"
      columns: readonly PanelTableColumn[]
      rows: readonly PanelTableRow[]
    })

export type PanelTableColumn = {
  id: string
  order: number
  title: string
  align?: PanelAlignment
  minWidth?: number
  maxWidth?: number
}

export type PanelTableRow = {
  id: string
  order: number
  cells: readonly DisplayValue[]
}

export type PanelGroup = {
  id: string
  order: number
  header?: {
    title: string
    collapsible?: boolean
  }
  items: readonly PanelItem[]
}

export type PanelModel = {
  id: string
  order: number
  title: string
  collapsedSummary?: DisplayValue
  groups: readonly PanelGroup[]
}

export function sortByOrderThenId<T extends { id: string; order: number }>(items: readonly T[]): T[] {
  return [...items].sort((left, right) => left.order - right.order || left.id.localeCompare(right.id))
}
