import assert from "node:assert/strict"
import test from "node:test"

globalThis.React = {
  createElement(type, props, ...children) {
    return { type, props: { ...props, children: children.length === 1 ? children[0] : children } }
  },
  Fragment: Symbol.for("react.fragment"),
}

const {
  mountSesTokensPanel,
  oneMessage,
  readyMessages,
} = await import("../.tmp-test/ses-tokens-mounted.mjs")

const eventTypes = [
  "message.updated",
  "message.removed",
  "session.created",
  "session.updated",
  "session.deleted",
  "tui.session.select",
]

async function resolveReady(mounted, sessionID = "session-a", messages = readyMessages) {
  await mounted.resolveList({ data: [{ id: sessionID }] })
  await mounted.resolveMessages(sessionID, { data: messages.map((info) => ({ info })) })
}

async function exhaustFailedLoad(mounted) {
  await mounted.resolveList({})
  for (const delay of [2_000, 4_000, 8_000]) {
    await mounted.runTimer(delay)
    await mounted.resolveList({ error: new Error("offline") })
  }
}

test("registers SesTokens at slot 110 and one session-scoped sidebar slot", async () => {
  const mounted = await mountSesTokensPanel()
  try {
    assert.equal(mounted.pluginID, "aamkye/opencode-tools-ses-tokens")
    assert.equal(mounted.registrations.length, 1)
    assert.equal(mounted.registrations[0].order, 110)
    assert.deepEqual(Object.keys(mounted.registrations[0].slots), ["sidebar_content"])
    assert.deepEqual(mounted.listCalls, [])
    assert.equal(await mounted.setSessionID(), null)
    assert.deepEqual(mounted.listCalls, [])
    await mounted.setSessionID("session-a")
    assert.deepEqual(mounted.listCalls, [{ directory: "/repo" }])
  } finally {
    await mounted.dispose()
  }
})

test("renders the exact expanded row order symbols values and three dividers", async () => {
  const mounted = await mountSesTokensPanel({ sessionID: "session-a" })
  try {
    await resolveReady(mounted)
    const view = mounted.view()
    assert.equal(view.marker, "▼ ")
    assert.equal(view.title, "SesTokens")
    assert.equal(view.detailText, "")
    assert.equal(view.summaryText, "")
    assert.deepEqual(view.rows.map(({ label, value }) => [label, value]), [
      ["↻ turns", "97"],
      ["↑ in", "4.4M"],
      ["↓ out", "18.6K"],
      ["▤ cache write", "0"],
      ["▤ cache read", "24.7M"],
      ["ø cache hit ratio", "5.6×"],
      ["✦ think", "2.8K"],
      ["Σ total", "29.1M"],
    ])
    assert.equal(view.dividerCount, 3)
    assert.deepEqual(mounted.listCalls, [{ directory: "/repo" }])
    assert.deepEqual(mounted.messageCalls, [{ sessionID: "session-a", directory: "/repo" }])
  } finally {
    await mounted.dispose()
  }
})

test("collapses to the token-turn summary and persists across remount", async () => {
  const first = await mountSesTokensPanel({ sessionID: "session-a" })
  await resolveReady(first)
  const store = first.store
  assert.deepEqual(first.kvReads, ["aamkye.opencode-tools-ses-tokens.collapsed"])
  await first.view().clickHeader()
  assert.equal(first.view().marker, "▶ ")
  assert.equal(first.view().summaryText, "Σ 29.1M / ↻ 97")
  assert.equal(first.view().rows.length, 0)
  assert.equal(first.view().dividerCount, 1)
  assert.deepEqual(first.kvWrites, [["aamkye.opencode-tools-ses-tokens.collapsed", true]])
  await first.dispose()

  const second = await mountSesTokensPanel({ sessionID: "session-a", store })
  try {
    await resolveReady(second)
    assert.equal(second.view().marker, "▶ ")
    assert.equal(second.view().summaryText, "Σ 29.1M / ↻ 97")
    assert.deepEqual(second.kvWrites, [])
    await second.view().clickHeader()
    assert.equal(second.view().marker, "▼ ")
    assert.deepEqual(second.kvWrites, [["aamkye.opencode-tools-ses-tokens.collapsed", false]])
  } finally {
    await second.dispose()
  }
})

test("renders stale detail in expanded and collapsed option-A headers", async () => {
  const mounted = await mountSesTokensPanel({ sessionID: "session-a" })
  try {
    await resolveReady(mounted)
    mounted.emit({ type: "message.updated", properties: { sessionID: "session-a" } })
    await mounted.runTimer(200)
    await exhaustFailedLoad(mounted)

    assert.equal(mounted.view().detailText, "stale")
    assert.equal(mounted.view().detailColor, "#ffaa00")
    assert.equal(mounted.view().summaryText, "")
    assert.equal(mounted.view().rows.at(-1).value, "29.1M")
    await mounted.view().clickHeader()
    assert.equal(mounted.view().detailText, "stale")
    assert.equal(mounted.view().detailColor, "#ffaa00")
    assert.equal(mounted.view().summaryText, "Σ 29.1M / ↻ 97")
  } finally {
    await mounted.dispose()
  }
})

test("renders muted loading and unavailable states without zero metrics", async () => {
  const mounted = await mountSesTokensPanel({ sessionID: "session-a" })
  try {
    assert.equal(mounted.view().fallbackText, "Loading...")
    assert.equal(mounted.view().fallbackColor, "#888888")
    assert.equal(mounted.view().rows.length, 0)
    await exhaustFailedLoad(mounted)
    assert.equal(mounted.view().fallbackText, "Usage unavailable")
    assert.equal(mounted.view().fallbackColor, "#888888")
    assert.equal(mounted.view().rows.length, 0)
    await mounted.view().clickHeader()
    assert.equal(mounted.view().summaryText, "Usage unavailable")
    assert.deepEqual(mounted.view().summarySegments, [{ text: "Usage unavailable", color: "#888888" }])
  } finally {
    await mounted.dispose()
  }
})

test("renders every all-zero ready row as valid data", async () => {
  const mounted = await mountSesTokensPanel({ sessionID: "session-a" })
  try {
    await resolveReady(mounted, "session-a", [])
    assert.equal(mounted.view().fallbackText, "")
    assert.deepEqual(mounted.view().rows.map(({ label, value }) => [label, value]), [
      ["↻ turns", "0"],
      ["↑ in", "0"],
      ["↓ out", "0"],
      ["▤ cache write", "0"],
      ["▤ cache read", "0"],
      ["ø cache hit ratio", "-"],
      ["✦ think", "0"],
      ["Σ total", "0"],
    ])
  } finally {
    await mounted.dispose()
  }
})

test("right-aligns values within 37 cells without trailing whitespace", async () => {
  const mounted = await mountSesTokensPanel({ sessionID: "session-a" })
  try {
    await resolveReady(mounted)
    const view = mounted.view(37)
    assert.equal(view.renderedWidth, 37)
    for (const row of view.rows) {
      assert.equal(row.cellCount, 2)
      assert.equal(row.rowWidth, 37)
      assert.ok(row.childWidths.reduce((total, width) => total + width, 0) <= row.rowWidth)
      assert.equal(row.rowProps.width, "100%")
      assert.equal(row.rowProps.overflow, "hidden")
      assert.equal(row.labelProps.flexBasis, 0)
      assert.equal(row.labelProps.flexGrow, 1)
      assert.equal(row.labelProps.flexShrink, 1)
      assert.equal(row.labelProps.minWidth, 0)
      assert.equal(row.valueProps.flexShrink, 0)
      assert.ok(row.cells <= 37)
      assert.equal(row.label.trimEnd(), row.label)
      assert.equal(row.value.trimEnd(), row.value)
      assert.equal(row.renderedText.trimEnd(), row.renderedText)
    }
  } finally {
    await mounted.dispose()
  }
})

test("switches slot sessions without remounting or leaking prior metrics", async () => {
  const mounted = await mountSesTokensPanel({ sessionID: "session-a" })
  try {
    await resolveReady(mounted)
    assert.equal(mounted.view().rows[1].value, "4.4M")
    await mounted.view().clickHeader()
    assert.equal(mounted.view().marker, "▶ ")
    await mounted.setSessionID("session-b")
    assert.equal(mounted.view().summaryText, "Loading...")
    assert.equal(mounted.view().rows.length, 0)
    await resolveReady(mounted, "session-b", oneMessage("session-b", 12))
    assert.equal(mounted.view().marker, "▶ ")
    assert.equal(mounted.view().summaryText, "Σ 12 / ↻ 1")
    assert.equal(mounted.view().rows.length, 0)
    await mounted.view().clickHeader()
    assert.deepEqual(mounted.view().rows.map((row) => row.value), ["1", "12", "0", "0", "0", "0.0×", "0", "12"])
    assert.equal(mounted.panelMounts(), 1)
    assert.equal(mounted.panelDisposals(), 0)
    assert.equal(mounted.slotRenders(), 1)
    assert.equal(mounted.sourceFactoryCalls(), 1)
    for (const type of eventTypes) assert.equal(mounted.registrationCount(type), 1)
    const listCallCount = mounted.listCalls.length
    const messageCallCount = mounted.messageCalls.length
    await mounted.setSessionID()
    assert.equal(mounted.listCalls.length, listCallCount)
    assert.equal(mounted.messageCalls.length, messageCallCount)
    assert.equal(mounted.panelMounts(), 1)
    assert.equal(mounted.panelDisposals(), 1)
  } finally {
    await mounted.dispose()
  }
})

test("rejects defined falsy client errors", async () => {
  const listFailure = await mountSesTokensPanel({ sessionID: "session-a" })
  try {
    await listFailure.resolveList({ data: [{ id: "session-a" }], error: false })
    assert.deepEqual(listFailure.messageCalls, [])
    assert.deepEqual(listFailure.pendingDelays(), [2_000])
  } finally {
    await listFailure.dispose()
  }

  const messagesFailure = await mountSesTokensPanel({ sessionID: "session-a" })
  try {
    await messagesFailure.resolveList({ data: [{ id: "session-a" }] })
    await messagesFailure.resolveMessages("session-a", { data: [], error: 0 })
    assert.deepEqual(messagesFailure.pendingDelays(), [2_000])
    assert.equal(messagesFailure.view().fallbackText, "Loading...")
  } finally {
    await messagesFailure.dispose()
  }
})

test("registers refresh events and removes subscriptions and timers on disposal", async () => {
  const mounted = await mountSesTokensPanel({ sessionID: "session-a" })
  assert.deepEqual(mounted.registeredTypes(), eventTypes)
  await resolveReady(mounted)
  mounted.emit({ type: "message.updated", properties: { sessionID: "session-a" } })
  assert.deepEqual(mounted.pendingDelays(), [200])
  assert.equal(mounted.lifecycleAborted(), false)
  assert.ok(mounted.lifecycleCleanups() >= 1)

  await mounted.dispose()
  assert.deepEqual(mounted.registeredTypes(), [])
  assert.deepEqual(mounted.pendingDelays(), [])
  assert.equal(mounted.lifecycleAborted(), true)
  assert.equal(mounted.lifecycleCleanups(), 0)
  for (const type of eventTypes) assert.equal(mounted.unsubscribeCount(type), 1)
})
