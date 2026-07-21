import type { PanelStatus, PanelTextSegment } from "../presentation/types.js"

export type McpStatusRow = {
  name: string
  label: string
  status: PanelStatus
}

export type McpPanelModel = {
  rows: readonly McpStatusRow[]
  connected: number
  warning: number
  error: number
  total: number
  summary: readonly PanelTextSegment[]
}

type McpEntry = {
  name: string
  status: string
  error?: unknown
}

type McpStatusDisplay = Pick<McpStatusRow, "label" | "status">

const STATUS_DISPLAY = Object.freeze({
  connected: { label: "Connected", status: "success" },
  disabled: { label: "Disabled", status: "textMuted" },
  failed: { label: "Failed", status: "error" },
  needs_auth: { label: "Needs auth", status: "error" },
  needs_client_registration: { label: "Needs client ID", status: "error" },
} satisfies Record<string, McpStatusDisplay>)

const UNKNOWN_STATUS = Object.freeze({ label: "Unknown", status: "textMuted" } satisfies McpStatusDisplay)

function bucket(status: string): "success" | "warning" | "error" {
  if (status === "connected") return "success"
  if (status === "disabled") return "warning"
  return "error"
}

export function createMcpPanelModel(entries: readonly McpEntry[]): McpPanelModel {
  let connected = 0
  let warning = 0
  let error = 0
  const rows = entries.map((entry): McpStatusRow => {
    const bucketStatus = bucket(entry.status)
    if (bucketStatus === "success") connected += 1
    else if (bucketStatus === "warning") warning += 1
    else error += 1
    const display = Object.hasOwn(STATUS_DISPLAY, entry.status)
      ? STATUS_DISPLAY[entry.status as keyof typeof STATUS_DISPLAY]
      : UNKNOWN_STATUS
    return { name: entry.name, ...display }
  })
  const total = entries.length

  return {
    rows,
    connected,
    warning,
    error,
    total,
    summary: [
      { text: String(connected), status: "success" },
      { text: "/", status: "textMuted" },
      { text: String(warning), status: "warning" },
      { text: "/", status: "textMuted" },
      { text: String(error), status: "error" },
    ],
  }
}
