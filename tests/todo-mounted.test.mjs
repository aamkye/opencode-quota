import assert from "node:assert/strict"
import test from "node:test"

globalThis.React = {
  createElement(type, props, ...children) {
    return { type, props: { ...props, children: children.length === 1 ? children[0] : children } }
  },
  Fragment: Symbol.for("react.fragment"),
}

const { mountTodoPanel } = await import("../.tmp-test/todo-mounted.mjs")
const records = [
  { content: "done", status: "completed", priority: "high" },
  { content: "working", status: "in_progress", priority: "medium" },
  { content: "queued", status: "pending", priority: "low" },
  { content: "cancelled", status: "cancelled", priority: "low" },
  { content: "future", status: "blocked", priority: "high" },
]

test("registers TODO at slot 160 and renders ordered status rows", async () => {
  const mounted = await mountTodoPanel({ sessionID: "session-a", records })
  try {
    const view = mounted.view()
    assert.equal(mounted.pluginID, "aamkye/opencode-tools-todo")
    assert.equal(mounted.registrations.length, 1)
    assert.equal(mounted.registrations[0].order, 160)
    assert.deepEqual(Object.keys(mounted.registrations[0].slots), ["sidebar_content"])
    assert.equal(view.marker, "▼ ")
    assert.equal(view.title, "TODO")
    assert.equal(view.summaryText, "")
    assert.deepEqual(view.rows.map((row) => [row.content, row.marker, row.markerColor]), [
      ["done", "[✓] ", "#00ff00"],
      ["working", "[•] ", "#ffaa00"],
      ["queued", "[ ] ", "#ffffff"],
      ["cancelled", "[-] ", "#888888"],
      ["future", "[ ] ", "#ffffff"],
    ])
    assert.deepEqual(view.allText, [
      "▼ ", "TODO",
      "[✓] ", "done",
      "[•] ", "working",
      "[ ] ", "queued",
      "[-] ", "cancelled",
      "[ ] ", "future",
    ])
  } finally {
    await mounted.dispose()
  }
})

test("does not look up an empty session and renders the empty state", async () => {
  const mounted = await mountTodoPanel()
  try {
    assert.deepEqual(mounted.todoCalls, [])
    assert.equal(mounted.view().marker, "▼ ")
    assert.equal(mounted.view().hint, "No TODOs for this session")
    assert.equal(mounted.view().hintColor, "#888888")
    assert.equal(mounted.view().dividerCount, 2)
    mounted.view().clickHeader()
    assert.equal(mounted.view().marker, "▶ ")
    assert.equal(mounted.view().summaryText, "0/0/0")
    assert.deepEqual(mounted.view().summarySegments, [
      ["0", "#00ff00"],
      ["/", "#888888"],
      ["0", "#ffaa00"],
      ["/", "#888888"],
      ["0", "#ffffff"],
    ])
    assert.equal(mounted.view().hint, "")
    assert.equal(mounted.view().dividerCount, 1)
    assert.deepEqual(mounted.kvWrites, [["aamkye.opencode-tools-todo.collapsed", true]])
  } finally {
    await mounted.dispose()
  }
})

test("switches sessions and reacts to synchronized TODO changes without remounting", async () => {
  const sessions = new Map([
    ["session-a", [{ content: "A", status: "pending", priority: "low" }]],
    ["session-b", [{ content: "B", status: "completed", priority: "high" }]],
  ])
  const mounted = await mountTodoPanel({ sessionID: "session-a", sessions })
  try {
    assert.deepEqual(mounted.view().rows.map((row) => row.content), ["A"])
    mounted.setSessionID("session-b")
    assert.deepEqual(mounted.view().rows.map((row) => row.content), ["B"])
    mounted.setTodos("session-b", [
      { content: "B2", status: "in_progress", priority: "medium" },
      { content: "B1", status: "completed", priority: "high" },
    ])
    assert.deepEqual(mounted.view().rows.map((row) => row.content), ["B2", "B1"])
    assert.equal(mounted.slotMounts(), 1)
    assert.equal(mounted.registrations.length, 1)
    assert.equal(mounted.todoCalls.includes(""), false)
    mounted.setSessionID()
    assert.equal(mounted.view().hint, "No TODOs for this session")
    assert.equal(mounted.todoCalls.includes(""), false)
  } finally {
    await mounted.dispose()
  }
})

test("wraps content under the 33-cell text column without trailing whitespace", async () => {
  const content = "Implement a TODO row with content that wraps below its text column"
  const mounted = await mountTodoPanel({
    sessionID: "session-a",
    records: [{ content, status: "in_progress", priority: "medium" }],
  })
  try {
    const row = mounted.view(37).rows[0]
    assert.equal(row.rowProps.width, "100%")
    assert.equal(row.rowProps.overflow, "hidden")
    assert.equal(row.markerProps.width, 4)
    assert.equal(row.markerProps.flexShrink, 0)
    assert.deepEqual({
      flexBasis: row.contentProps.flexBasis,
      flexGrow: row.contentProps.flexGrow,
      flexShrink: row.contentProps.flexShrink,
      minWidth: row.contentProps.minWidth,
      overflow: row.contentProps.overflow,
      wrapMode: row.contentProps.wrapMode,
      truncate: row.contentProps.truncate,
      width: row.contentProps.width,
    }, {
      flexBasis: 0,
      flexGrow: 1,
      flexShrink: 1,
      minWidth: 0,
      overflow: "hidden",
      wrapMode: "word",
      truncate: undefined,
      width: undefined,
    })
    assert.ok(row.renderedLines.length > 1)
    assert.equal(row.renderedLines[0].startsWith("[•] "), true)
    assert.equal(row.renderedLines.slice(1).every((line) => line.startsWith("    ")), true)
    assert.equal(row.renderedLines.every((line) => [...line].length <= 37), true)
    assert.equal(row.renderedLines.every((line) => line.trimEnd() === line), true)
  } finally {
    await mounted.dispose()
  }
})

test("persists collapse, updates the summary reactively, and restores the preference", async () => {
  const collapsedKey = "aamkye.opencode-tools-todo.collapsed"
  const first = await mountTodoPanel({ sessionID: "session-a", records })
  const store = first.store
  assert.deepEqual(first.kvReads, [collapsedKey])
  first.view().clickHeader()
  assert.equal(first.view().marker, "▶ ")
  assert.equal(first.view().summaryText, "1/1/2")
  assert.deepEqual(first.view().summarySegments, [
    ["1", "#00ff00"],
    ["/", "#888888"],
    ["1", "#ffaa00"],
    ["/", "#888888"],
    ["2", "#ffffff"],
  ])
  assert.equal(first.view().rows.length, 0)
  assert.deepEqual(first.kvWrites, [["aamkye.opencode-tools-todo.collapsed", true]])
  first.setTodos("session-a", [
    { content: "done", status: "completed", priority: "high" },
    { content: "also done", status: "completed", priority: "medium" },
  ])
  assert.equal(first.view().summaryText, "2/0/0")
  await first.dispose()

  const second = await mountTodoPanel({ sessionID: "session-a", records, store })
  try {
    assert.deepEqual(second.kvReads, [collapsedKey])
    assert.equal(second.view().marker, "▶ ")
    assert.equal(second.view().summaryText, "1/1/2")
    assert.deepEqual(second.kvWrites, [])
    second.view().clickHeader()
    assert.equal(second.view().marker, "▼ ")
    assert.deepEqual(second.kvWrites, [["aamkye.opencode-tools-todo.collapsed", false]])
  } finally {
    await second.dispose()
  }

  const conflictingStore = new Map([[collapsedKey, true]])
  const conflicting = await mountTodoPanel({ sessionID: "session-a", records, store: conflictingStore })
  try {
    assert.deepEqual(conflicting.kvReads, [collapsedKey])
    assert.equal(conflicting.view().marker, "▶ ")
    assert.equal(conflicting.view().summaryText, "1/1/2")
    assert.deepEqual(conflicting.kvWrites, [])
  } finally {
    await conflicting.dispose()
  }
})

test("uses standard dividers and disposes the Solid and plugin lifecycles", async () => {
  const mounted = await mountTodoPanel({ sessionID: "session-a", records })
  assert.equal(mounted.view().dividerCount, 2)
  assert.equal(mounted.slotMounts(), 1)
  assert.equal(mounted.lifecycleAborted(), false)
  assert.ok(mounted.lifecycleCleanups() >= 1)
  mounted.view().clickHeader()
  assert.equal(mounted.view().dividerCount, 1)
  await mounted.dispose()
  assert.equal(mounted.lifecycleAborted(), true)
  assert.equal(mounted.lifecycleCleanups(), 0)
})
