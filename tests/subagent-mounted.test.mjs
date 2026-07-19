import assert from "node:assert/strict"
import test from "node:test"

globalThis.React = {
  createElement(type, props, ...children) {
    return { type, props: { ...props, children: children.length === 1 ? children[0] : children } }
  },
  Fragment: Symbol.for("react.fragment"),
}

const {
  mountSubagentPanel,
  subagentFailureKey,
} = await import("../.tmp-test/subagent-mounted.mjs")

const eventTypes = [
  "session.created",
  "session.updated",
  "session.deleted",
  "session.status",
  "session.idle",
  "session.error",
  "message.updated",
  "message.removed",
  "tui.session.select",
]

const expandedLayout = [
  "▼ SubAgent",
  "------------------------------------",
  "▶ • SubAgent11 with super lo… 9m 45s",
  "▶ • SubAgent10                1h 15m",
  "▶ • SubAgent9                 15m 4s",
  "▶ • SubAgent8                 2h 18m",
  "▶ • SubAgent7                 2h 18m",
  "---                              ---",
  "▼ Rest",
  "▶ • SubAgent6                 9m 45s",
  "▶ • SubAgent5                 1h 15m",
  "▶ • SubAgent4                    15s",
  "▶ • SubAgent3                    25s",
  "▶ • SubAgent2                     5s",
  "▶ • SubAgent1                  1h 2m",
  "------------------------------------",
]

const expandedLayout37 = [
  "▼ SubAgent",
  "-------------------------------------",
  "▶ • SubAgent11 with super lon… 9m 45s",
  "▶ • SubAgent10                 1h 15m",
  "▶ • SubAgent9                  15m 4s",
  "▶ • SubAgent8                  2h 18m",
  "▶ • SubAgent7                  2h 18m",
  "---                               ---",
  "▼ Rest",
  "▶ • SubAgent6                  9m 45s",
  "▶ • SubAgent5                  1h 15m",
  "▶ • SubAgent4                     15s",
  "▶ • SubAgent3                     25s",
  "▶ • SubAgent2                      5s",
  "▶ • SubAgent1                   1h 2m",
  "-------------------------------------",
]

const oneDetailLayout = [
  "▼ SubAgent",
  "------------------------------------",
  "▶ • SubAgent11 with super lo… 9m 45s",
  "▶ • SubAgent10                1h 15m",
  "▼ • SubAgent9",
  "  agent:                     general",
  "  status:                    running",
  "  time:                       15m 4s",
  "  model:                 gpt-4o-mini",
  "  Open Session",
  "▶ • SubAgent8                 2h 18m",
  "▶ • SubAgent7                 2h 18m",
  "---                              ---",
  "▼ Rest",
  "▶ • SubAgent6                 9m 45s",
  "▶ • SubAgent5                 1h 15m",
  "▶ • SubAgent4                    15s",
  "▶ • SubAgent3                    25s",
  "▶ • SubAgent2                     5s",
  "▶ • SubAgent1                  1h 2m",
  "------------------------------------",
]

const semiCollapsedLayout = [
  "▼ SubAgent",
  "------------------------------------",
  "▶ • SubAgent11 with super lo… 9m 45s",
  "▶ • SubAgent10                1h 15m",
  "▶ • SubAgent9                 15m 4s",
  "▶ • SubAgent8                 2h 18m",
  "▶ • SubAgent7                 2h 18m",
  "---                              ---",
  "▶ Rest",
  "------------------------------------",
]

async function exhaustFailedLoad(mounted) {
  await mounted.resolveList({})
  for (const delay of [2_000, 4_000, 8_000]) {
    await mounted.runTimer(delay)
    await mounted.resolveList({ error: new Error("offline") })
  }
}

test("registers the SubAgent ID and session-scoped slot 120", async () => {
  const mounted = await mountSubagentPanel()
  assert.equal(mounted.pluginID, "aamkye/opencode-tools-subagent")
  assert.equal(mounted.registrations.length, 1)
  assert.equal(mounted.registrations[0].order, 120)
  assert.deepEqual(Object.keys(mounted.registrations[0].slots), ["sidebar_content"])
  assert.equal(mounted.sourceFactoryCalls(), 1)
  assert.deepEqual(mounted.registeredTypes(), eventTypes)
  assert.deepEqual(mounted.kvReads, [subagentFailureKey])
  assert.deepEqual(mounted.listCalls, [])
  await mounted.setParentID("parent-a")
  assert.deepEqual(mounted.listCalls, [{ directory: "/repo" }])
  await mounted.resolveList({})
  assert.deepEqual(mounted.pendingDelays(), [2_000])
  for (const type of eventTypes) assert.equal(mounted.registrationCount(type), 1)
  await mounted.dispose()
  assert.equal(mounted.lifecycleAborted(), true)
  assert.equal(mounted.lifecycleCleanups(), 0)
  assert.deepEqual(mounted.registeredTypes(), [])
  assert.deepEqual(mounted.pendingDelays(), [])
  for (const type of eventTypes) assert.equal(mounted.unsubscribeCount(type), 1)
})

test("renders no element for empty loading and unavailable parents", async () => {
  const mounted = await mountSubagentPanel({ parentID: "parent-a" })
  try {
    assert.equal(mounted.view().panelExists, false)
    assert.equal(mounted.view().title, "")
    await exhaustFailedLoad(mounted)
    assert.equal(mounted.view().panelExists, false)
    assert.equal(mounted.view().title, "")
    const calls = mounted.listCalls.length
    await mounted.setParentID()
    assert.equal(mounted.view().panelExists, false)
    assert.equal(mounted.listCalls.length, calls)
  } finally {
    await mounted.dispose()
  }

  const populated = await mountSubagentPanel({ parentID: "parent-a" })
  try {
    await populated.resolveReady()
    assert.equal(populated.view().panelExists, true)
    await populated.setParentID()
    assert.equal(populated.view().panelExists, false)
    assert.equal(populated.view().title, "")
  } finally {
    await populated.dispose()
  }
})

test("renders muted No subagents for a complete empty snapshot", async () => {
  const mounted = await mountSubagentPanel({ parentID: "parent-a" })
  try {
    await mounted.resolveReady([])
    assert.equal(mounted.view().fallbackText, "No subagents")
    assert.equal(mounted.view().fallbackColor, "#888888")
    assert.deepEqual(mounted.view().lines, [
      "▼ SubAgent",
      "------------------------------------",
      "No subagents",
      "------------------------------------",
    ])
    mounted.emit({
      type: "session.created",
      properties: {
        sessionID: "subagent-new",
        info: { id: "subagent-new", parentID: "parent-a" },
      },
    })
    assert.equal(mounted.view().detailText, "stale")
    assert.equal(mounted.view().detailColor, "#ffaa00")
    assert.equal(mounted.view().fallbackText, "No subagents")
    assert.equal(mounted.view().fallbackColor, "#888888")
    assert.deepEqual(mounted.view().lines, [
      "▼ SubAgent                     stale",
      "------------------------------------",
      "No subagents",
      "------------------------------------",
    ])
  } finally {
    await mounted.dispose()
  }
})

test("matches every expanded AGENTS layout and exact row order", async () => {
  const mounted = await mountSubagentPanel({ parentID: "parent-a" })
  try {
    await mounted.resolveReady()
    assert.deepEqual(mounted.view().lines, expandedLayout)
    assert.equal(mounted.view().dividerCount, 3)
    assert.equal(mounted.view().restDividerColor, "#888888")
    assert.deepEqual(mounted.messageCalls.map(({ sessionID }) => sessionID), [
      "subagent-11", "subagent-10", "subagent-9", "subagent-8", "subagent-7",
      "subagent-6", "subagent-5", "subagent-4", "subagent-3", "subagent-2", "subagent-1",
    ])
    assert.deepEqual(mounted.statusCalls, mounted.messageCalls.map(({ sessionID }) => sessionID))
  } finally {
    await mounted.dispose()
  }
})

test("matches one-detail and expanded-Rest AGENTS layouts", async () => {
  const mounted = await mountSubagentPanel({ parentID: "parent-a" })
  try {
    await mounted.resolveReady()
    await mounted.view().clickEntry("SubAgent9")
    assert.deepEqual(mounted.view().lines, oneDetailLayout)
    assert.equal(mounted.view().openSessionInteractive, false)
    await mounted.view().activateOpenSession()
    assert.deepEqual(mounted.routeCalls, [])
  } finally {
    await mounted.dispose()
  }
})

test("matches semi-collapsed Rest and collapsed count layouts", async () => {
  const mounted = await mountSubagentPanel({ parentID: "parent-a" })
  try {
    await mounted.resolveReady()
    await mounted.view().clickRest()
    assert.deepEqual(mounted.view().lines, semiCollapsedLayout)
    await mounted.view().clickHeader()
    assert.deepEqual(mounted.view().lines, [
      "▶ SubAgent                     7/1/3",
      "------------------------------------",
    ])
    assert.deepEqual(mounted.view().summarySegments, [
      { text: "7", color: "#00ff00" },
      { text: "/", color: "#888888" },
      { text: "1", color: "#ffaa00" },
      { text: "/", color: "#888888" },
      { text: "3", color: "#ff0000" },
    ])
    assert.deepEqual(mounted.kvWrites, [])
  } finally {
    await mounted.dispose()
  }
})

test("retains the body and warning detail in stale layouts", async () => {
  const mounted = await mountSubagentPanel({ parentID: "parent-a" })
  try {
    await mounted.resolveReady()
    mounted.emit({
      type: "session.updated",
      properties: {
        sessionID: "subagent-9",
        info: { id: "subagent-9", parentID: "parent-a" },
      },
    })
    assert.equal(mounted.view().detailText, "stale")
    assert.equal(mounted.view().detailColor, "#ffaa00")
    assert.deepEqual(mounted.view().lines, [
      "▼ SubAgent                     stale",
      ...expandedLayout.slice(1),
    ])
    await mounted.view().clickHeader()
    assert.deepEqual(mounted.view().lines, [
      "▶ SubAgent               stale 7/1/3",
      "------------------------------------",
    ])
    assert.equal(mounted.view().detailColor, "#ffaa00")
    assert.equal(mounted.view().summaryText, "7/1/3")
  } finally {
    await mounted.dispose()
  }
})

test("colors bullets and status values by semantic status", async () => {
  const mounted = await mountSubagentPanel({ parentID: "parent-a" })
  try {
    await mounted.resolveReady()
    const bulletColors = Object.fromEntries(mounted.view().entryRows.map((row) => [row.title, row.bulletColor]))
    assert.equal(bulletColors.SubAgent10, "#00ff00")
    assert.equal(bulletColors.SubAgent9, "#ffaa00")
    assert.equal(bulletColors.SubAgent8, "#ff0000")
    for (const title of ["SubAgent10", "SubAgent9", "SubAgent8"]) {
      await mounted.view().clickEntry(title)
      const status = mounted.view().detailRows.find((row) => row.label === "status:")
      assert.equal(status.valueColor, bulletColors[title])
      await mounted.view().clickEntry(title)
    }
  } finally {
    await mounted.dispose()
  }
})

test("truncates only titles at 37 and 36 cells without trailing whitespace", async () => {
  const mounted = await mountSubagentPanel({ parentID: "parent-a" })
  try {
    await mounted.resolveReady()
    const view37 = mounted.view(37)
    const view36 = mounted.view(36)
    const width37 = view37.entryRows[0]
    const width36 = view36.entryRows[0]
    assert.deepEqual(view37.lines, expandedLayout37)
    assert.deepEqual(view36.lines, expandedLayout)
    assert.equal(width37.renderedText, "▶ • SubAgent11 with super lon… 9m 45s")
    assert.equal(width36.renderedText, "▶ • SubAgent11 with super lo… 9m 45s")
    for (const width of [36, 37]) {
      const view = mounted.view(width)
      for (const line of view.lines) assert.equal(line.trimEnd(), line)
      for (const row of view.entryRows) {
        assert.equal(row.rowWidth, width)
        assert.equal(row.rowProps.width, "100%")
        assert.equal(row.rowProps.overflow, "hidden")
        assert.equal(row.titleProps.flexBasis, 0)
        assert.equal(row.titleProps.flexGrow, 1)
        assert.equal(row.titleProps.flexShrink, 1)
        assert.equal(row.titleProps.minWidth, 0)
        assert.equal(row.titleProps.truncate, true)
        assert.ok(row.childWidths.reduce((total, value) => total + value, 0) <= width)
        assert.equal(row.renderedText.trimEnd(), row.renderedText)
        assert.equal(row.duration.trimEnd(), row.duration)
      }
    }
  } finally {
    await mounted.dispose()
  }
})

test("rejects defined falsy list and message envelope errors", async () => {
  const listFailure = await mountSubagentPanel({ parentID: "parent-a" })
  try {
    await listFailure.resolveList({ data: [], error: false })
    assert.deepEqual(listFailure.messageCalls, [])
    assert.deepEqual(listFailure.pendingDelays(), [2_000])
  } finally {
    await listFailure.dispose()
  }

  const messageFailure = await mountSubagentPanel({ parentID: "parent-a" })
  try {
    await messageFailure.resolveList({ data: [
      { id: "parent-a", title: "Parent", time: { created: 0, updated: 0 } },
      { id: "subagent-1", parentID: "parent-a", title: "SubAgent1", time: { created: 1, updated: 2 } },
    ] })
    await messageFailure.resolveMessages("subagent-1", { data: [], error: 0 })
    assert.deepEqual(messageFailure.pendingDelays(), [2_000])
    assert.equal(messageFailure.view().panelExists, false)
  } finally {
    await messageFailure.dispose()
  }
})
