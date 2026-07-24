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
    assert.deepEqual(Object.keys(mounted.registrations[0].slots), ["sidebar_content", "session_prompt_right"])
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
    assert.deepEqual(mounted.kvWrites, [])
  } finally {
    await mounted.dispose()
  }
})

test("excludes every cancelled record from the collapsed summary while still rendering the rows", async () => {
  const sessions = new Map([
    ["session-c", [
      { content: "abandoned one", status: "cancelled", priority: "low" },
      { content: "abandoned two", status: "cancelled", priority: "low" },
    ]],
  ])
  const mounted = await mountTodoPanel({ sessionID: "session-c", sessions })
  try {
    assert.equal(mounted.view().marker, "▼ ")
    assert.deepEqual(mounted.view().rows.map((row) => [row.content, row.marker, row.markerColor]), [
      ["abandoned one", "[-] ", "#888888"],
      ["abandoned two", "[-] ", "#888888"],
    ])
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

test("resets configured collapse state per session and keeps summaries reactive without kv persistence", async () => {
  const mounted = await mountTodoPanel({ sessionID: "session-a", records, defaultState: "collapsed" })
  try {
    assert.equal(mounted.view().marker, "▶ ")
    assert.equal(mounted.view().summaryText, "1/1/2")
    assert.deepEqual(mounted.view().summarySegments, [
    ["1", "#00ff00"],
    ["/", "#888888"],
    ["1", "#ffaa00"],
    ["/", "#888888"],
    ["2", "#ffffff"],
    ])
    mounted.setTodos("session-a", [
      { content: "done", status: "completed", priority: "high" },
      { content: "also done", status: "completed", priority: "medium" },
    ])
    assert.equal(mounted.view().summaryText, "2/0/0")
    mounted.view().clickHeader()
    assert.equal(mounted.view().marker, "▼ ")
    mounted.setSessionID("session-b")
    assert.equal(mounted.view().marker, "▶ ")
    mounted.view().clickHeader()
    mounted.setSessionID("session-a")
    assert.equal(mounted.view().marker, "▶ ")
    assert.deepEqual(mounted.kvReads, [])
    assert.deepEqual(mounted.kvWrites, [])
  } finally { await mounted.dispose() }
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
