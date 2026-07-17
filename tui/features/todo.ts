import type { Todo } from "@opencode-ai/sdk/v2"

export type TodoStatusRole = "success" | "warning" | "text" | "textMuted"

export type TodoStatusRow = {
  content: string
  marker: "[✓]" | "[•]" | "[ ]" | "[-]"
  status: TodoStatusRole
}

export type TodoPanelModel = {
  rows: readonly TodoStatusRow[]
  completed: number
  total: number
  summary: string
}

type TodoStatusDisplay = Pick<TodoStatusRow, "marker" | "status">

const STATUS_DISPLAY = Object.freeze({
  completed: { marker: "[✓]", status: "success" },
  in_progress: { marker: "[•]", status: "warning" },
  pending: { marker: "[ ]", status: "text" },
  cancelled: { marker: "[-]", status: "textMuted" },
} satisfies Record<string, TodoStatusDisplay>)

const UNKNOWN_STATUS = Object.freeze({ marker: "[ ]", status: "text" } satisfies TodoStatusDisplay)

export function createTodoPanelModel(records: readonly Todo[]): TodoPanelModel {
  let completed = 0
  const rows = records.map((record): TodoStatusRow => {
    if (record.status === "completed") completed += 1
    const display = Object.hasOwn(STATUS_DISPLAY, record.status)
      ? STATUS_DISPLAY[record.status as keyof typeof STATUS_DISPLAY]
      : UNKNOWN_STATUS
    return { content: record.content, ...display }
  })
  const total = records.length

  return {
    rows,
    completed,
    total,
    summary: `${completed}/${total}`,
  }
}
