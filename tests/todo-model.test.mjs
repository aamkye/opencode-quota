import assert from "node:assert/strict"
import test from "node:test"

const { createTodoPanelModel } = await import("../.tmp-test/todo-model.mjs")

test("maps TODO statuses in source order without mutating SDK records", () => {
  const records = Object.freeze([
    Object.freeze({ content: "completed task", status: "completed", priority: "high" }),
    Object.freeze({ content: "active task", status: "in_progress", priority: "medium" }),
    Object.freeze({ content: "queued task", status: "pending", priority: "low" }),
    Object.freeze({ content: "cancelled task", status: "cancelled", priority: "low" }),
    Object.freeze({ content: "future task", status: "blocked", priority: "high" }),
  ])
  const before = structuredClone(records)

  assert.deepEqual(createTodoPanelModel(records), {
    rows: [
      { content: "completed task", marker: "[✓]", status: "success" },
      { content: "active task", marker: "[•]", status: "warning" },
      { content: "queued task", marker: "[ ]", status: "text" },
      { content: "cancelled task", marker: "[-]", status: "textMuted" },
      { content: "future task", marker: "[ ]", status: "text" },
    ],
    completed: 1,
    total: 5,
    summary: "1/5",
  })
  assert.deepEqual(records, before)
  assert.equal(JSON.stringify(createTodoPanelModel(records)).includes("priority"), false)
})

test("counts only completed TODOs while retaining cancelled and unknown records", () => {
  const model = createTodoPanelModel([
    { content: "done one", status: "completed", priority: "high" },
    { content: "done two", status: "completed", priority: "low" },
    { content: "cancelled", status: "cancelled", priority: "medium" },
    { content: "unknown", status: "future", priority: "medium" },
  ])

  assert.equal(model.completed, 2)
  assert.equal(model.total, 4)
  assert.equal(model.summary, "2/4")
  assert.deepEqual(model.rows.map((row) => row.content), ["done one", "done two", "cancelled", "unknown"])
})

test("returns the stable empty TODO model", () => {
  assert.deepEqual(createTodoPanelModel([]), {
    rows: [],
    completed: 0,
    total: 0,
    summary: "0/0",
  })
})
