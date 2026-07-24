import assert from "node:assert/strict"
import test from "node:test"

globalThis.React = {
  createElement(type, props, ...children) {
    return { type, props: { ...props, children: children.length === 1 ? children[0] : children } }
  },
  Fragment: Symbol.for("react.fragment"),
}

const { mountLspPanel } = await import("../.tmp-test/lsp-mounted.mjs")
const entries = [
  { id: "typescript", name: "TypeScript", root: "/workspace/ts", status: "connected" },
  { id: "future-ls", name: "Future", root: "/workspace/future", status: "starting" },
  { id: "yaml-ls", name: "YAML", root: "/workspace/yaml", status: "error" },
]

test("registers LSP at slot 150 and renders ordered IDs with semantic bullets and root basenames", async () => {
  const mounted = await mountLspPanel({ entries })
  try {
    const view = mounted.view()
    assert.equal(mounted.pluginID, "aamkye/opencode-tools-lsp")
    assert.equal(mounted.registrations.length, 1)
    assert.equal(mounted.registrations[0].order, 150)
    assert.deepEqual(Object.keys(mounted.registrations[0].slots), ["sidebar_content", "session_prompt_right"])
    assert.equal(view.marker, "▼ ")
    assert.equal(view.summaryText, "")
    assert.deepEqual(view.rows.map((row) => [row.id, row.bullet, row.bulletColor]), [
      ["typescript", "• ", "#00ff00"],
      ["future-ls", "• ", "#888888"],
      ["yaml-ls", "• ", "#ff0000"],
    ])
    assert.deepEqual(view.rows.map((row) => [row.label, row.labelColor]), [
      ["ts", "#888888"],
      ["future", "#888888"],
      ["yaml", "#888888"],
    ])
    assert.equal(JSON.stringify(view).includes("TypeScript"), false)
    assert.equal(JSON.stringify(view).includes("/workspace"), false)
  } finally {
    await mounted.dispose()
  }
})

test("resets configured collapse state on every session selection without kv persistence", async () => {
  const mounted = await mountLspPanel({ sessionID: "session-a", entries, defaultState: "collapsed" })
  try {
    assert.equal(mounted.view().marker, "▶ ")
    assert.equal(mounted.view().summaryText, "3")
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

test("defaults empty LSP expanded and keeps collapse interaction process-local", async () => {
  const mounted = await mountLspPanel()
  try {
    let view = mounted.view()
    assert.equal(view.marker, "▼ ")
    assert.equal(view.summaryText, "")
    assert.equal(view.hint, "LSPs will activate as files are read")
    assert.equal(view.hintColor, "#888888")
    assert.equal(view.dividerCount, 2)
    assert.deepEqual(mounted.kvWrites, [])

    view.clickHeader()
    view = mounted.view()
    assert.equal(view.marker, "▶ ")
    assert.equal(view.summaryText, "0")
    assert.equal(view.hint, "")
    assert.equal(view.dividerCount, 1)
    assert.deepEqual(mounted.kvWrites, [])
  } finally {
    await mounted.dispose()
  }
})

test("reacts between empty and populated lists without remounting or resetting preference", async () => {
  const mounted = await mountLspPanel()
  try {
    assert.equal(mounted.slotMounts(), 1)
    assert.deepEqual(mounted.kvReads, [])
    mounted.setLsp([
      { id: "yaml-ls", name: "YAML", root: "/workspace", status: "error" },
      { id: "typescript", name: "TypeScript", root: "/workspace", status: "connected" },
    ])
    assert.deepEqual(mounted.view().rows.map((row) => [row.id, row.bulletColor]), [
      ["yaml-ls", "#ff0000"],
      ["typescript", "#00ff00"],
    ])
    mounted.view().clickHeader()
    assert.equal(mounted.view().summaryText, "2")
    mounted.setLsp([{ id: "future", name: "Future", root: "/workspace", status: "loading" }])
    assert.equal(mounted.view().summaryText, "1")
    mounted.setLsp([])
    assert.equal(mounted.view().summaryText, "0")
    assert.equal(mounted.view().marker, "▶ ")
    assert.equal(mounted.slotMounts(), 1)
    assert.equal(mounted.registrations.length, 1)
    assert.deepEqual(mounted.kvReads, [])
    assert.deepEqual(mounted.kvWrites, [])
  } finally {
    await mounted.dispose()
  }
})

test("ignores persisted and unsupported defaults for an empty list", async () => {
  const mounted = await mountLspPanel({ savedCollapsed: true, defaultState: "semi-collapsed" })
  try {
    assert.equal(mounted.view().marker, "▼ ")
    assert.equal(mounted.view().hint, "LSPs will activate as files are read")
    assert.deepEqual(mounted.kvReads, [])
    assert.deepEqual(mounted.kvWrites, [])
  } finally { await mounted.dispose() }
})

test("truncates long IDs inside 37 and 36 cells without trailing whitespace", async () => {
  const longID = "typescript-language-server-with-an-extremely-long-id"
  const mounted = await mountLspPanel({
    entries: [{ id: longID, name: "ignored", root: "", status: "connected" }],
  })
  try {
    const wide = mounted.view(37).rows[0]
    const narrow = mounted.view(36).rows[0]
    assert.equal(wide.renderedText, `• ${longID.slice(0, 34)}…`)
    assert.equal(narrow.renderedText, `• ${longID.slice(0, 33)}…`)
    assert.equal(wide.renderedText.length, 37)
    assert.equal(narrow.renderedText.length, 36)
    assert.equal(wide.renderedText.trimEnd(), wide.renderedText)
    assert.equal(narrow.renderedText.trimEnd(), narrow.renderedText)
    assert.equal(wide.label, "")
    assert.equal(wide.bullet, "• ")
    assert.deepEqual({
      flexBasis: wide.idProps.flexBasis,
      flexGrow: wide.idProps.flexGrow,
      flexShrink: wide.idProps.flexShrink,
      minWidth: wide.idProps.minWidth,
      overflow: wide.idProps.overflow,
      wrapMode: wide.idProps.wrapMode,
      truncate: wide.idProps.truncate,
      width: wide.idProps.width,
    }, {
      flexBasis: 0,
      flexGrow: 1,
      flexShrink: 1,
      minWidth: 0,
      overflow: "hidden",
      wrapMode: "none",
      truncate: true,
      width: undefined,
    })
  } finally {
    await mounted.dispose()
  }
})

test("renders the root basename right-aligned in the muted color without leaking the full path", async () => {
  const mounted = await mountLspPanel({
    entries: [{
      id: "typescript",
      name: "TypeScript and JavaScript Language Server",
      root: "/Users/aam/Projects/priv/opencode-tools",
      status: "connected",
    }],
  })
  try {
    const row = mounted.view().rows[0]
    assert.equal(row.id, "typescript")
    assert.equal(row.bulletColor, "#00ff00")
    assert.equal(row.label, "opencode-tools")
    assert.equal(row.labelColor, "#888888")
    assert.equal(row.renderedText, "• typescript opencode-tools")
    assert.equal(row.renderedText.trimEnd(), row.renderedText)
    assert.equal(JSON.stringify(mounted.view()).includes("/Users"), false)
    assert.equal(JSON.stringify(mounted.view()).includes("Projects"), false)
    assert.equal(JSON.stringify(mounted.view()).includes("TypeScript"), false)
  } finally {
    await mounted.dispose()
  }
})

test("omits the label for an empty root and keeps the row trailing-whitespace free", async () => {
  const mounted = await mountLspPanel({
    entries: [{ id: "typescript", name: "TypeScript", root: "", status: "connected" }],
  })
  try {
    const row = mounted.view().rows[0]
    assert.equal(row.label, "")
    assert.equal(row.labelColor, undefined)
    assert.equal(row.renderedText, "• typescript")
    assert.equal(row.renderedText.trimEnd(), row.renderedText)
  } finally {
    await mounted.dispose()
  }
})

test("uses two full-width separators expanded and one collapsed", async () => {
  for (const entries of [[], [
    { id: "typescript", name: "TypeScript", root: "/workspace", status: "connected" },
  ]]) {
    const mounted = await mountLspPanel({ entries })
    try {
      assert.equal(mounted.view().dividerCount, 2)
      mounted.view().clickHeader()
      assert.equal(mounted.view().dividerCount, 1)
      assert.equal(mounted.view().rows.length, 0)
      assert.equal(mounted.view().hint, "")
    } finally {
      await mounted.dispose()
    }
  }
})

test("disposes the Solid root and plugin lifecycle", async () => {
  const mounted = await mountLspPanel({ entries })
  assert.equal(mounted.slotMounts(), 1)
  assert.equal(mounted.lifecycleAborted(), false)
  assert.ok(mounted.lifecycleCleanups() >= 1)
  await mounted.dispose()
  assert.equal(mounted.lifecycleAborted(), true)
  assert.equal(mounted.lifecycleCleanups(), 0)
})

test("session_prompt_right chip slot is wired and enabled by default", async () => {
  const mounted = await mountLspPanel({ entries })
  try {
    const chipSlot = mounted.registrations[0].slots.session_prompt_right
    assert.equal(typeof chipSlot, "function")
    assert.notEqual(chipSlot({}, { session_id: "ses" }), null)
  } finally {
    await mounted.dispose()
  }
})
