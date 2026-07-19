import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"
import stringWidth from "string-width"

globalThis.React = {
  createElement(type, props, ...children) {
    return { type, props: { ...props, children: children.length === 1 ? children[0] : children } }
  },
  Fragment: Symbol.for("react.fragment"),
}

const {
  canonicalChildren,
  subagentExpandedChildKey,
  mountSubagentPanel,
  subagentFailureKey,
  subagentPanelCollapsedKey,
  subagentRestCollapsedKey,
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

const agentsSubagentSection = readFileSync(new URL("../AGENTS.md", import.meta.url), "utf8")
  .split("### SubAgent\n", 2)[1]
  .split("\n### ", 1)[0]
const agentsSubagentLayouts = [...agentsSubagentSection.matchAll(/```\n([\s\S]*?)```/g)]
  .map(([, body]) => body.trimEnd().split("\n").map((line) => line.split(/\s+\|(?:\s|$)/, 1)[0].trimEnd()))
assert.equal(agentsSubagentLayouts.length, 6, "AGENTS SubAgent layout count changed")
const [
  oneDetailLayout,
  expandedLayout,
  staleExpandedLayout,
  semiCollapsedLayout,
  collapsedLayout,
  staleCollapsedLayout,
] = agentsSubagentLayouts
const readme = readFileSync(new URL("../README.md", import.meta.url), "utf8")

const expandedLayout37 = [
  "▼ SubAgent",
  "-------------------------------------",
  "▶ SubAgent11 with super long…  9m 45s",
  "▶ SubAgent10                   1h 15m",
  "▶ SubAgent9                    15m 4s",
  "▶ SubAgent8                    2h 18m",
  "▶ SubAgent7                    2h 18m",
  "---                               ---",
  "▼ Rest",
  "▶ SubAgent6                    9m 45s",
  "▶ SubAgent5                    1h 15m",
  "▶ SubAgent4                       15s",
  "▶ SubAgent3                       25s",
  "▶ SubAgent2                        5s",
  "▶ SubAgent1                     1h 2m",
  "-------------------------------------",
]

const terminalChildren = canonicalChildren.filter((entry) => entry.session.id !== "subagent-9")
const restRunningChildren = canonicalChildren.map((entry) => (
  ["subagent-8", "subagent-7", "subagent-6"].includes(entry.session.id)
    ? {
        ...entry,
        session: {
          ...entry.session,
          time: { created: 20_000_000 + Number(entry.session.id.slice(9)), updated: 20_000_100 },
        },
      }
    : entry
))

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
  assert.deepEqual(mounted.kvReads, [
    subagentFailureKey,
    subagentPanelCollapsedKey,
    subagentRestCollapsedKey,
    subagentExpandedChildKey,
  ])
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
    assert.equal(mounted.view().detailText, "")
    assert.equal(mounted.view().fallbackText, "No subagents")
    assert.equal(mounted.view().fallbackColor, "#888888")
    assert.deepEqual(mounted.view().lines, [
      "▼ SubAgent",
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
    assert.equal(mounted.view().dividerCount, 2)
    assert.equal(mounted.view().rest.disclosureColor, "#888888")
    assert.equal(mounted.view().rest.titleColor, "#888888")
    assert.equal(mounted.view().restDivider.nativeBorder, false)
    assert.deepEqual(mounted.view().restDivider.texts, ["---", "", "---"])
    assert.deepEqual(mounted.view().restDivider.colors, ["#888888", undefined, "#888888"])
    assert.equal(mounted.view().restDivider.middleFlexGrow, 1)
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
    assert.equal(mounted.view().openSessionInteractive, true)
  } finally {
    await mounted.dispose()
  }
})

test("matches semi-collapsed Rest and collapsed count layouts", async () => {
  const mounted = await mountSubagentPanel({ parentID: "parent-a" })
  try {
    await mounted.resolveReady()
    await mounted.view().clickRest()
    const view = mounted.view()
    assert.deepEqual(view.lines, semiCollapsedLayout)
    assert.equal(view.rest.disclosureColor, "#888888")
    assert.equal(view.rest.titleColor, "#888888")
    assert.equal(view.restDivider.nativeBorder, false)
    assert.deepEqual(view.restDivider.texts, ["---", "", "---"])
    assert.deepEqual(view.restDivider.colors, ["#888888", undefined, "#888888"])
    assert.equal(view.restDivider.middleFlexGrow, 1)
    await mounted.view().clickHeader()
    assert.deepEqual(mounted.view().lines, collapsedLayout)
    assert.deepEqual(mounted.view().summarySegments, [
      { text: "7", color: "#00ff00" },
      { text: "/", color: "#888888" },
      { text: "1", color: "#ffaa00" },
      { text: "/", color: "#888888" },
      { text: "3", color: "#ff0000" },
    ])
  } finally {
    await mounted.dispose()
  }
})

test("keeps the ready body through a successful background refresh", async () => {
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
    assert.equal(mounted.view().detailText, "")
    assert.deepEqual(mounted.view().lines, expandedLayout)

    await mounted.runTimer(200)
    assert.equal(mounted.view().detailText, "")
    await mounted.resolveReady()
    assert.equal(mounted.view().detailText, "")
    assert.deepEqual(mounted.view().lines, expandedLayout)
  } finally {
    await mounted.dispose()
  }
})

test("publishes stale only after background retries are exhausted", async () => {
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
    assert.equal(mounted.view().detailText, "")
    await mounted.runTimer(200)
    await mounted.resolveList({ error: new Error("offline") })
    for (const delay of [2_000, 4_000]) {
      assert.equal(mounted.view().detailText, "")
      await mounted.runTimer(delay)
      await mounted.resolveList({ error: new Error("offline") })
    }
    assert.equal(mounted.view().detailText, "")
    await mounted.runTimer(8_000)
    await mounted.resolveList({ error: new Error("offline") })

    assert.equal(mounted.view().detailText, "stale")
    assert.equal(mounted.view().detailColor, "#ffaa00")
    assert.deepEqual(mounted.view().lines, staleExpandedLayout)
    await mounted.view().clickHeader()
    assert.deepEqual(mounted.view().lines, staleCollapsedLayout)
    assert.equal(mounted.view().detailColor, "#ffaa00")
    assert.equal(mounted.view().summaryText, "7/1/3")
  } finally {
    await mounted.dispose()
  }
})

test("omits status bullets and colors compact and detail times by status", async () => {
  const mounted = await mountSubagentPanel({ parentID: "parent-a" })
  try {
    await mounted.resolveReady()
    assert.equal(mounted.view().bulletCount, 0)
    assert.deepEqual(
      Object.fromEntries(mounted.view().entryRows.map((row) => [row.title, row.durationColor])),
      {
        "SubAgent11 with super long name": "#00ff00",
        SubAgent10: "#00ff00",
        SubAgent9: "#ffaa00",
        SubAgent8: "#ff0000",
        SubAgent7: "#ff0000",
        SubAgent6: "#00ff00",
        SubAgent5: "#00ff00",
        SubAgent4: "#ff0000",
        SubAgent3: "#00ff00",
        SubAgent2: "#00ff00",
        SubAgent1: "#00ff00",
      },
    )
    for (const [title, color] of [["SubAgent10", "#00ff00"], ["SubAgent9", "#ffaa00"], ["SubAgent8", "#ff0000"]]) {
      await mounted.view().clickEntry(title)
      assert.equal(mounted.view().detailRows.find((row) => row.label === "time:")?.valueColor, color)
      await mounted.view().clickEntry(title)
    }
  } finally {
    await mounted.dispose()
  }
})

test("clips long detail identities to one row at 37 and 35 cells", async () => {
  const running = canonicalChildren.find((entry) => entry.session.id === "subagent-9")
  assert.ok(running)
  const longAgent = "agent-with-an-arbitrarily-long-custom-identity"
  const longModel = "provider/model-with-an-arbitrarily-long-custom-identity"
  const child = {
    ...running,
    messages: running.messages.map((entry) => ({
      ...entry,
      agent: longAgent,
      modelID: longModel,
    })),
  }
  const mounted = await mountSubagentPanel({ parentID: "parent-a" })
  try {
    await mounted.resolveReady([child])
    await mounted.view().clickEntry("SubAgent9")
    for (const width of [37, 35]) {
      await mounted.resize(width)
      const view = mounted.view()
      assert.equal(view.lines.length, 9)
      assert.deepEqual(view.detailRows.map(({ label }) => label), ["agent:", "status:", "time:", "model:"])
      assert.equal(view.detailRows.find(({ label }) => label === "time:")?.valueColor, "#ffaa00")
      for (const row of view.detailRows) {
        assert.equal(row.rowWidth, width)
        assert.equal(row.childWidths.reduce((total, cells) => total + cells, 0), width)
        assert.ok(stringWidth(row.renderedText) <= width)
        assert.equal(row.renderedText.includes("\n"), false)
      }
      for (const [label, value] of [["agent:", longAgent], ["model:", longModel]]) {
        const row = view.detailRows.find((candidate) => candidate.label === label)
        assert.ok(row)
        assert.notEqual(row.renderedValue, value)
        assert.equal(row.valueProps.flexShrink, 1)
        assert.equal(row.valueProps.minWidth, 0)
        assert.equal(row.valueProps.overflow, "hidden")
        assert.equal(row.valueProps.wrapMode, "none")
      }
    }
  } finally {
    await mounted.dispose()
  }
})

test("end-truncates measured title cells at 37 36 and scrollbar-reduced 35 cells", async () => {
  const mounted = await mountSubagentPanel({ parentID: "parent-a" })
  try {
    await mounted.resolveReady()
    for (const [width, expectedTitle] of [
      [37, "SubAgent11 with super long…"],
      [36, "SubAgent11 with super long…"],
      [35, "SubAgent11 with super lon…"],
    ]) {
      await mounted.resize(width)
      const view = mounted.view()
      if (width === 37) assert.deepEqual(view.lines, expandedLayout37)
      if (width === 36) assert.deepEqual(view.lines, expandedLayout)
      const row = view.entryRows[0]
      assert.equal(row.renderedTitle, expectedTitle)
      assert.equal(row.renderedTitle.endsWith("…"), true)
      assert.equal(row.renderedTitle.match(/…/gu)?.length, 1)
      assert.equal(row.gap, " ")
      assert.equal(row.gapWidth, 1)
      assert.equal(row.duration, "9m 45s")
      assert.equal(row.rowWidth, width)
      assert.equal(row.childWidths.reduce((total, cells) => total + cells, 0), width)
      assert.equal(row.titleProps.truncate, undefined)
      for (const line of view.lines) assert.equal(line.trimEnd(), line)
    }
    const callbackCalls = mounted.sizeChangeCalls()
    assert.ok(callbackCalls >= mounted.view().entryRows.length)
    await mounted.view().clickHeader()
    await mounted.resize(34)
    assert.equal(mounted.sizeChangeCalls(), callbackCalls)
  } finally {
    await mounted.dispose()
  }
})

test("measures wide and combining titles in terminal cells", async () => {
  const wideTitle = "界".repeat(20)
  const combiningTitle = "e\u0301".repeat(30)
  const children = canonicalChildren.slice(0, 2).map((entry, index) => ({
    ...entry,
    session: {
      ...entry.session,
      title: index === 0 ? wideTitle : combiningTitle,
    },
  }))
  const mounted = await mountSubagentPanel({ parentID: "parent-a" })
  try {
    await mounted.resolveReady(children)
    await mounted.resize(37)
    const rows = Object.fromEntries(mounted.view().entryRows.map((row) => [row.title, row]))

    assert.equal(rows[wideTitle].renderedTitle, `${"界".repeat(13)}…`)
    assert.equal(rows[combiningTitle].renderedTitle, `${"e\u0301".repeat(27)}…`)
    assert.equal(rows[wideTitle].renderedTitle.match(/…/gu)?.length, 1)
    assert.equal(rows[combiningTitle].renderedTitle.match(/…/gu)?.length, 1)
    assert.equal(stringWidth(rows[wideTitle].renderedTitle), 27)
    assert.equal(stringWidth(rows[combiningTitle].renderedTitle), 28)
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

test("persists panel and Rest collapse independently per parent", async () => {
  const store = new Map([
    [subagentPanelCollapsedKey, { "parent-z": true }],
    [subagentRestCollapsedKey, { "parent-z": true }],
  ])
  const mounted = await mountSubagentPanel({ parentID: "parent-a", store })
  try {
    await mounted.resolveReady(terminalChildren)
    await mounted.view().clickRest()
    await mounted.view().clickHeader()
    assert.deepEqual(mounted.kvWrites, [
      [subagentRestCollapsedKey, { "parent-z": true, "parent-a": true }],
      [subagentPanelCollapsedKey, { "parent-z": true, "parent-a": true }],
    ])

    await mounted.setParentID("parent-b")
    await mounted.resolveReady(terminalChildren)
    assert.equal(mounted.view().marker, "▼ ")
    assert.equal(mounted.view().lines.includes("▼ Rest"), true)
    await mounted.view().clickRest()
    await mounted.view().clickHeader()
    assert.deepEqual(mounted.kvWrites.slice(-2), [
      [subagentRestCollapsedKey, { "parent-z": true, "parent-a": true, "parent-b": true }],
      [subagentPanelCollapsedKey, { "parent-z": true, "parent-a": true, "parent-b": true }],
    ])
  } finally {
    await mounted.dispose()
  }

  const restored = await mountSubagentPanel({ parentID: "parent-a", store })
  try {
    await restored.resolveReady(terminalChildren)
    assert.equal(restored.view().marker, "▶ ")
    await restored.view().clickHeader()
    assert.equal(restored.view().lines.includes("▶ Rest"), true)
  } finally {
    await restored.dispose()
  }
})

test("restores one expanded child and replaces it when another opens", async () => {
  const store = new Map([
    [subagentExpandedChildKey, { "parent-a": "subagent-9", "parent-b": "subagent-2" }],
  ])
  const mounted = await mountSubagentPanel({ parentID: "parent-a", store })
  try {
    await mounted.resolveReady()
    assert.equal(mounted.view().entryRows.find((row) => row.title === "SubAgent9")?.disclosure, "▼ ")
    await mounted.view().clickEntry("SubAgent10")
    assert.equal(mounted.view().entryRows.find((row) => row.title === "SubAgent9")?.disclosure, "▶ ")
    assert.equal(mounted.view().entryRows.find((row) => row.title === "SubAgent10")?.disclosure, "▼ ")
    assert.deepEqual(mounted.kvWrites, [
      [subagentExpandedChildKey, { "parent-a": "subagent-10", "parent-b": "subagent-2" }],
    ])
    await mounted.view().clickEntry("SubAgent10")
    assert.deepEqual(mounted.kvWrites.at(-1), [
      subagentExpandedChildKey,
      { "parent-b": "subagent-2" },
    ])
  } finally {
    await mounted.dispose()
  }
})

test("clears a persisted child absent from a complete snapshot", async () => {
  const store = new Map([
    [subagentExpandedChildKey, { "parent-a": "missing", "parent-b": "subagent-2" }],
  ])
  const mounted = await mountSubagentPanel({ parentID: "parent-a", store })
  try {
    assert.deepEqual(mounted.kvWrites, [])
    await mounted.resolveReady(terminalChildren)
    assert.deepEqual(mounted.kvWrites, [[
      subagentExpandedChildKey,
      { "parent-b": "subagent-2" },
    ]])
  } finally {
    await mounted.dispose()
  }
})

test("keeps a selected Rest child hidden while Rest is collapsed", async () => {
  const store = new Map([
    [subagentRestCollapsedKey, { "parent-a": true }],
    [subagentExpandedChildKey, { "parent-a": "subagent-5" }],
  ])
  const mounted = await mountSubagentPanel({ parentID: "parent-a", store })
  try {
    await mounted.resolveReady(terminalChildren)
    assert.equal(mounted.view().lines.includes("▶ Rest"), true)
    assert.equal(mounted.view().entryRows.some((row) => row.title === "SubAgent5"), false)
    assert.deepEqual(store.get(subagentExpandedChildKey), { "parent-a": "subagent-5" })
    assert.deepEqual(mounted.kvWrites, [])
    await mounted.view().clickRest()
    assert.equal(mounted.view().entryRows.find((row) => row.title === "SubAgent5")?.disclosure, "▼ ")
    assert.equal(mounted.view().detailRows.some((row) => row.label === "agent:"), true)
  } finally {
    await mounted.dispose()
  }
})

test("Open Session navigates to the selected child route", async () => {
  const running = canonicalChildren.find((entry) => entry.session.id === "subagent-9")
  assert.ok(running)
  const navigationChild = {
    ...running,
    session: { ...running.session, id: "child-9" },
    messages: running.messages.map((entry) => ({
      ...entry,
      id: "child-9-message",
      sessionID: "child-9",
    })),
  }
  const mounted = await mountSubagentPanel({ parentID: "parent-a" })
  try {
    await mounted.resolveReady([navigationChild])
    await mounted.view().clickEntry("SubAgent9")
    await mounted.view().activateOpenSession()
    assert.deepEqual(mounted.routeCalls, [["session", { sessionID: "child-9" }]])
  } finally {
    await mounted.dispose()
  }
})

test("starts one clock only for visible running primary entries", async () => {
  const mounted = await mountSubagentPanel({ parentID: "parent-a" })
  try {
    await mounted.resolveReady()
    assert.deepEqual(mounted.activeIntervalDelays(), [1_000])
    assert.equal(mounted.intervalStarts(), 1)
    mounted.setNow(20_001_000)
    await mounted.runInterval()
    assert.equal(mounted.view().entryRows.find((row) => row.title === "SubAgent9")?.duration, "15m 5s")
    assert.equal(mounted.intervalStarts(), 1)
  } finally {
    await mounted.dispose()
  }

  const terminal = await mountSubagentPanel({ parentID: "parent-a" })
  try {
    await terminal.resolveReady(terminalChildren)
    assert.deepEqual(terminal.activeIntervalDelays(), [])
    assert.equal(terminal.intervalStarts(), 0)
  } finally {
    await terminal.dispose()
  }

  const collapsed = await mountSubagentPanel({
    parentID: "parent-a",
    store: new Map([[subagentPanelCollapsedKey, { "parent-a": true }]]),
  })
  try {
    await collapsed.resolveReady()
    assert.deepEqual(collapsed.activeIntervalDelays(), [])
    assert.equal(collapsed.intervalStarts(), 0)
  } finally {
    await collapsed.dispose()
  }
})

test("does not start a clock for defined non-finite completions", async () => {
  const running = canonicalChildren.find((entry) => entry.session.id === "subagent-9")
  assert.ok(running)
  const children = [Number.NaN, Number.POSITIVE_INFINITY].map((completed, index) => {
    const id = `non-finite-${index}`
    return {
      ...running,
      session: { ...running.session, id, title: id },
      status: undefined,
      messages: running.messages.map((entry) => ({
        ...entry,
        id: `${id}-message`,
        sessionID: id,
        time: { ...entry.time, completed },
      })),
    }
  })
  const mounted = await mountSubagentPanel({ parentID: "parent-a" })
  try {
    await mounted.resolveReady(children)
    assert.ok(mounted.view().entryRows.every(({ durationColor }) => durationColor === "#00ff00"))
    assert.deepEqual(mounted.activeIntervalDelays(), [])
    assert.equal(mounted.intervalStarts(), 0)
    await mounted.view().clickHeader()
    assert.equal(mounted.view().summaryText, "2/0/0")
  } finally {
    await mounted.dispose()
  }
})

test("Rest visibility controls its running clock and refreshes immediately", async () => {
  const mounted = await mountSubagentPanel({
    parentID: "parent-a",
    store: new Map([[subagentRestCollapsedKey, { "parent-a": true }]]),
  })
  try {
    await mounted.resolveReady(restRunningChildren)
    assert.equal(mounted.intervalStarts(), 0)
    mounted.setNow(20_060_000)
    await mounted.view().clickRest()
    assert.equal(mounted.view().entryRows.find((row) => row.title === "SubAgent9")?.duration, "16m 4s")
    assert.deepEqual(mounted.activeIntervalDelays(), [1_000])
    assert.equal(mounted.intervalStarts(), 1)
    await mounted.view().clickRest()
    assert.deepEqual(mounted.activeIntervalDelays(), [])
    assert.equal(mounted.intervalClears(), 1)
  } finally {
    await mounted.dispose()
  }
})

test("collapse parent switch completion and disposal stop the clock", async () => {
  const collapsed = await mountSubagentPanel({ parentID: "parent-a" })
  try {
    await collapsed.resolveReady()
    await collapsed.view().clickHeader()
    assert.equal(collapsed.intervalClears(), 1)
    assert.deepEqual(collapsed.activeIntervalDelays(), [])
  } finally {
    await collapsed.dispose()
  }

  const switched = await mountSubagentPanel({ parentID: "parent-a" })
  try {
    await switched.resolveReady()
    await switched.setParentID("parent-b")
    assert.equal(switched.intervalClears(), 1)
    assert.deepEqual(switched.activeIntervalDelays(), [])
  } finally {
    await switched.dispose()
  }

  const completed = await mountSubagentPanel({ parentID: "parent-a" })
  try {
    await completed.resolveReady()
    completed.emit({
      type: "session.updated",
      properties: { sessionID: "subagent-9", info: { id: "subagent-9", parentID: "parent-a" } },
    })
    await completed.runTimer(200)
    await completed.resolveReady(terminalChildren)
    assert.equal(completed.intervalClears(), 1)
    assert.deepEqual(completed.activeIntervalDelays(), [])
  } finally {
    await completed.dispose()
  }

  const disposed = await mountSubagentPanel({ parentID: "parent-a" })
  await disposed.resolveReady()
  const callbackCalls = disposed.sizeChangeCalls()
  await disposed.dispose()
  await disposed.resize(34)
  assert.equal(disposed.intervalClears(), 1)
  assert.deepEqual(disposed.activeIntervalDelays(), [])
  assert.equal(disposed.sizeChangeCalls(), callbackCalls)
})

test("documents the corrected SubAgent visual behavior", () => {
  for (const statement of [
    "Compact durations and expanded time values use the child's status color.",
    "Titles are grapheme-safe, end-truncated to the measured terminal-cell width, including scrollbar width changes.",
    "The Rest disclosure and title are muted, and its divider is two muted three-dash segments separated by flexible space.",
  ]) assert.equal(readme.includes(statement), true, `missing README statement: ${statement}`)
})
