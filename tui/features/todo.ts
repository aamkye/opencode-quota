import type { Todo } from "@opencode-ai/sdk/v2"
import type { PanelTextSegment } from "../presentation/types.js"

type TodoPanelRecord = Pick<Todo, "content" | "status">

export type TodoStatusRole = "success" | "warning" | "text" | "textMuted"

export type TodoStatusRow = {
  content: string
  marker: "[✓]" | "[•]" | "[ ]" | "[-]"
  status: TodoStatusRole
}

export type TodoPanelModel = {
  rows: readonly TodoStatusRow[]
  completed: number
  done: number
  working: number
  todo: number
  total: number
  summary: readonly PanelTextSegment[]
}

type TodoStatusDisplay = Pick<TodoStatusRow, "marker" | "status">

const STATUS_DISPLAY = Object.freeze({
  completed: { marker: "[✓]", status: "success" },
  in_progress: { marker: "[•]", status: "warning" },
  pending: { marker: "[ ]", status: "text" },
  cancelled: { marker: "[-]", status: "textMuted" },
} satisfies Record<string, TodoStatusDisplay>)

const UNKNOWN_STATUS = Object.freeze({ marker: "[ ]", status: "text" } satisfies TodoStatusDisplay)

type TodoBucket = "done" | "working" | "todo"

function bucket(status: string): TodoBucket | undefined {
  if (status === "completed") return "done"
  if (status === "in_progress") return "working"
  if (status === "pending") return "todo"
  if (status === "cancelled") return undefined
  return "todo"
}

export function createTodoPanelModel(records: readonly TodoPanelRecord[]): TodoPanelModel {
  let done = 0
  let working = 0
  let todo = 0
  const rows = records.map((record): TodoStatusRow => {
    const bucketStatus = bucket(record.status)
    if (bucketStatus === "done") done += 1
    else if (bucketStatus === "working") working += 1
    else if (bucketStatus === "todo") todo += 1
    const display = Object.hasOwn(STATUS_DISPLAY, record.status)
      ? STATUS_DISPLAY[record.status as keyof typeof STATUS_DISPLAY]
      : UNKNOWN_STATUS
    return { content: record.content, ...display }
  })
  const total = records.length

  return {
    rows,
    completed: done,
    done,
    working,
    todo,
    total,
    summary: [
      { text: String(done), status: "success" },
      { text: "/", status: "textMuted" },
      { text: String(working), status: "warning" },
      { text: "/", status: "textMuted" },
      { text: String(todo), status: "text" },
    ],
  }
}
