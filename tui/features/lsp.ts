import { pathBasename } from "../presentation/format.js"
import type { PanelStatus } from "../presentation/types.js"

export type LspStatusRow = {
  id: string
  label: string
  status: PanelStatus
}

export type LspPanelModel = {
  rows: readonly LspStatusRow[]
  total: number
}

type LspEntry = {
  id: string
  name: string
  root: string
  status: string
}

function statusRole(status: string): PanelStatus {
  if (status === "connected") return "success"
  if (status === "error") return "error"
  return "textMuted"
}

export function createLspPanelModel(entries: readonly LspEntry[]): LspPanelModel {
  return {
    rows: entries.map((entry) => ({
      id: entry.id,
      label: pathBasename(entry.root),
      status: statusRole(entry.status),
    })),
    total: entries.length,
  }
}
