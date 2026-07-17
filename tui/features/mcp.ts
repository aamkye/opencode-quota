import type { PanelStatus, PanelTextSegment } from "../presentation/types.js"

export type McpStatusRow = {
  name: string
  label: string
  status: PanelStatus
}

export type McpPanelModel = {
  rows: readonly McpStatusRow[]
  connected: number
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
  needs_auth: { label: "Needs auth", status: "warning" },
  needs_client_registration: { label: "Needs client ID", status: "error" },
} satisfies Record<string, McpStatusDisplay>)

const UNKNOWN_STATUS = Object.freeze({ label: "Unknown", status: "textMuted" } satisfies McpStatusDisplay)

export function createMcpPanelModel(entries: readonly McpEntry[]): McpPanelModel {
  let connected = 0
  const rows = entries.map((entry): McpStatusRow => {
    if (entry.status === "connected") connected += 1
    const display = Object.hasOwn(STATUS_DISPLAY, entry.status)
      ? STATUS_DISPLAY[entry.status as keyof typeof STATUS_DISPLAY]
      : UNKNOWN_STATUS
    return { name: entry.name, ...display }
  })
  const total = entries.length
  const empty = total === 0
  const healthy = connected === total

  return {
    rows,
    connected,
    total,
    summary: [
      { text: String(connected), status: empty ? "textMuted" : "success" },
      { text: "/", status: "textMuted" },
      { text: String(total), status: empty ? "textMuted" : healthy ? "success" : "error" },
    ],
  }
}
