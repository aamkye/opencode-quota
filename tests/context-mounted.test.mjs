import assert from "node:assert/strict"
import test from "node:test"

globalThis.React = {
  createElement(type, props, ...children) {
    return { type, props: { ...props, children: children.length === 1 ? children[0] : children } }
  },
  Fragment: Symbol.for("react.fragment"),
}

const { mountContextPanel } = await import("../.tmp-test/context-mounted.mjs")
const provider = (context = 322_000) => ({ id: "openai", models: { gpt: { limit: { context } } } })
const message = ({ input = 205_000, cost = 1.25 } = {}) => ({
  role: "assistant",
  providerID: "openai",
  modelID: "gpt",
  cost,
  tokens: { input, output: 0, reasoning: 0, cache: { read: 0, write: 0 } },
})
const sessions = new Map([["session-a", [message()]]])

test("registers Context at slot 100 and renders the expanded metric contract", async () => {
  const mounted = await mountContextPanel({ sessionID: "session-a", sessions, providers: [provider()] })
  try {
    const view = mounted.view()
    assert.equal(mounted.pluginID, "aamkye/opencode-tools-context")
    assert.equal(mounted.registrations[0].order, 100)
    assert.deepEqual(Object.keys(mounted.registrations[0].slots), ["sidebar_content", "session_prompt_right"])
    assert.equal(view.marker, "▼ ")
    assert.equal(view.title, "Context")
    assert.equal(view.summaryText, "")
    assert.deepEqual(view.rows.map(({ label, value }) => [label, value]), [
      ["Limit", "322K"],
      ["Tokens", "205K"],
      ["Used", "64%"],
      ["Spent", "$1.25"],
    ])
    assert.equal(view.rows[2].valueColor, "#ff0000")
    assert.equal(view.dividerCount, 2)
  } finally { await mounted.dispose() }
})

test("resets configured collapse state on every session selection without kv persistence", async () => {
  const mounted = await mountContextPanel({ sessionID: "session-a", sessions, providers: [provider()], defaultState: "collapsed" })
  try {
    assert.equal(mounted.view().marker, "▶ ")
    assert.equal(mounted.view().summaryText, "64%")
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

test("renders and collapses unavailable state without an empty-session host call", async () => {
  const mounted = await mountContextPanel()
  try {
    assert.deepEqual(mounted.messageCalls, [])
    assert.deepEqual(mounted.view().rows.map(({ label, value }) => [label, value]), [
      ["Limit", "-"], ["Tokens", "-"], ["Used", "-"], ["Spent", "$0.00"],
    ])
    assert.equal(mounted.view().rows[3].valueColor, "#888888")
    mounted.view().clickHeader()
    assert.equal(mounted.view().summaryText, "-")
  } finally { await mounted.dispose() }
})

test("switches sessions and reacts to messages and providers without remounting", async () => {
  const initial = new Map([
    ["session-a", [message()]],
    ["session-b", [message({ input: 50_000, cost: 0.5 })]],
  ])
  const mounted = await mountContextPanel({ sessionID: "session-a", sessions: initial, providers: [provider()] })
  try {
    assert.equal(mounted.view().rows[2].value, "64%")
    mounted.setSessionID("session-b")
    assert.deepEqual(mounted.view().rows.map((row) => row.value), ["322K", "50K", "16%", "$0.50"])
    mounted.setMessages("session-b", [message({ input: 100_000, cost: 0.75 })])
    assert.equal(mounted.view().rows[2].value, "31%")
    mounted.setProviders([provider(200_000)])
    assert.deepEqual(mounted.view().rows.map((row) => row.value), ["200K", "100K", "50%", "$0.75"])
    mounted.setSessionID()
    assert.deepEqual(mounted.view().rows.map((row) => row.value), ["-", "-", "-", "$0.00"])
    assert.equal(mounted.messageCalls.includes(""), false)
    assert.equal(mounted.slotMounts(), 1)
  } finally { await mounted.dispose() }
})

test("right-anchors all metric values within 37 cells without trailing whitespace", async () => {
  const mounted = await mountContextPanel({ sessionID: "session-a", sessions, providers: [provider(1_500_000)] })
  try {
    for (const row of mounted.view(37).rows) {
      assert.equal(row.rowProps.width, "100%")
      assert.equal(row.rowProps.overflow, "hidden")
      assert.equal(row.labelProps.flexBasis, 0)
      assert.equal(row.labelProps.flexGrow, 1)
      assert.equal(row.labelProps.flexShrink, 1)
      assert.equal(row.labelProps.minWidth, 0)
      assert.equal(row.valueProps.flexShrink, 0)
      assert.equal(row.renderedText.length, 37)
      assert.equal(row.renderedText.trimEnd(), row.renderedText)
    }
  } finally { await mounted.dispose() }
})

test("disposes only the Solid root and host lifecycle", async () => {
  const mounted = await mountContextPanel({ sessionID: "session-a", sessions, providers: [provider()] })
  assert.equal(mounted.slotMounts(), 1)
  assert.equal(mounted.lifecycleAborted(), false)
  assert.ok(mounted.lifecycleCleanups() >= 1)
  await mounted.dispose()
  assert.equal(mounted.lifecycleAborted(), true)
  assert.equal(mounted.lifecycleCleanups(), 0)
})
