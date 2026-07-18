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

test("registers at order 112 and renders the expanded metric contract", async () => {
  const mounted = await mountContextPanel({ sessionID: "session-a", sessions, providers: [provider()] })
  try {
    const view = mounted.view()
    assert.equal(mounted.pluginID, "aamkye/opencode-tools-context")
    assert.equal(mounted.registrations[0].order, 112)
    assert.deepEqual(Object.keys(mounted.registrations[0].slots), ["sidebar_content"])
    assert.equal(view.marker, "▼ ")
    assert.equal(view.title, "Context")
    assert.equal(view.summaryText, "")
    assert.deepEqual(view.rows.map(({ label, value }) => [label, value]), [
      ["Tokens", "322K"],
      ["Used", "64%"],
      ["Spent", "$1.25"],
    ])
    assert.equal(view.dividerCount, 2)
  } finally { await mounted.dispose() }
})

test("collapses to usage, persists the key, and restores on remount", async () => {
  const first = await mountContextPanel({ sessionID: "session-a", sessions, providers: [provider()] })
  const store = first.store
  assert.deepEqual(first.kvReads, ["aamkye.opencode-tools-context.collapsed"])
  first.view().clickHeader()
  assert.equal(first.view().marker, "▶ ")
  assert.equal(first.view().summaryText, "64%")
  assert.equal(first.view().rows.length, 0)
  assert.equal(first.view().dividerCount, 1)
  assert.deepEqual(first.kvWrites, [["aamkye.opencode-tools-context.collapsed", true]])
  await first.dispose()

  const second = await mountContextPanel({ sessionID: "session-a", sessions, providers: [provider()], store })
  try {
    assert.equal(second.view().marker, "▶ ")
    second.view().clickHeader()
    assert.equal(second.view().marker, "▼ ")
    assert.deepEqual(second.kvWrites, [["aamkye.opencode-tools-context.collapsed", false]])
  } finally { await second.dispose() }
})

test("renders and collapses unavailable state without an empty-session host call", async () => {
  const mounted = await mountContextPanel()
  try {
    assert.deepEqual(mounted.messageCalls, [])
    assert.deepEqual(mounted.view().rows.map(({ label, value }) => [label, value]), [
      ["Tokens", "-"], ["Used", "-"], ["Spent", "$0.00"],
    ])
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
    assert.equal(mounted.view().rows[1].value, "64%")
    mounted.setSessionID("session-b")
    assert.deepEqual(mounted.view().rows.map((row) => row.value), ["322K", "16%", "$0.50"])
    mounted.setMessages("session-b", [message({ input: 100_000, cost: 0.75 })])
    assert.equal(mounted.view().rows[1].value, "31%")
    mounted.setProviders([provider(200_000)])
    assert.deepEqual(mounted.view().rows.map((row) => row.value), ["200K", "50%", "$0.75"])
    mounted.setSessionID()
    assert.deepEqual(mounted.view().rows.map((row) => row.value), ["-", "-", "$0.00"])
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
