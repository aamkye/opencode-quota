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
    done: 1,
    working: 1,
    todo: 2,
    total: 5,
    summary: [
      { text: "1", status: "success" },
      { text: "/", status: "textMuted" },
      { text: "1", status: "warning" },
      { text: "/", status: "textMuted" },
      { text: "2", status: "text" },
    ],
  })
  assert.deepEqual(records, before)
  assert.equal(JSON.stringify(createTodoPanelModel(records)).includes("priority"), false)
})

test("counts done/working/todo while excluding cancelled and bucketing unknown as todo", () => {
  const model = createTodoPanelModel([
    { content: "done one", status: "completed", priority: "high" },
    { content: "done two", status: "completed", priority: "low" },
    { content: "cancelled", status: "cancelled", priority: "medium" },
    { content: "unknown", status: "future", priority: "medium" },
  ])

  assert.equal(model.completed, 2)
  assert.equal(model.done, 2)
  assert.equal(model.working, 0)
  assert.equal(model.todo, 1)
  assert.equal(model.total, 4)
  assert.deepEqual(model.summary, [
    { text: "2", status: "success" },
    { text: "/", status: "textMuted" },
    { text: "0", status: "warning" },
    { text: "/", status: "textMuted" },
    { text: "1", status: "text" },
  ])
  assert.deepEqual(model.rows.map((row) => [row.content, row.marker, row.status]), [
    ["done one", "[✓]", "success"],
    ["done two", "[✓]", "success"],
    ["cancelled", "[-]", "textMuted"],
    ["unknown", "[ ]", "text"],
  ])
})

test("returns the stable empty TODO model with colored zeros", () => {
  assert.deepEqual(createTodoPanelModel([]), {
    rows: [],
    completed: 0,
    done: 0,
    working: 0,
    todo: 0,
    total: 0,
    summary: [
      { text: "0", status: "success" },
      { text: "/", status: "textMuted" },
      { text: "0", status: "warning" },
      { text: "/", status: "textMuted" },
      { text: "0", status: "text" },
    ],
  })
})
