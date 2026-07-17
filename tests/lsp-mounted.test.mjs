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

test("registers after MCP and renders ordered IDs with semantic bullets", async () => {
  const mounted = await mountLspPanel({ entries })
  try {
    const view = mounted.view()
    assert.equal(mounted.pluginID, "aamkye/opencode-tools-lsp")
    assert.equal(mounted.registrations.length, 1)
    assert.equal(mounted.registrations[0].order, 112)
    assert.deepEqual(Object.keys(mounted.registrations[0].slots), ["sidebar_content"])
    assert.equal(view.marker, "▼ ")
    assert.equal(view.summaryText, "")
    assert.deepEqual(view.rows.map((row) => [row.id, row.bullet, row.bulletColor]), [
      ["typescript", "• ", "#00ff00"],
      ["future-ls", "• ", "#888888"],
      ["yaml-ls", "• ", "#ff0000"],
    ])
    assert.equal(JSON.stringify(view).includes("TypeScript"), false)
    assert.equal(JSON.stringify(view).includes("/workspace"), false)
  } finally {
    await mounted.dispose()
  }
})

test("persists populated collapse toggles and restores them after restart", async () => {
  const first = await mountLspPanel({ entries })
  const store = first.store
  first.view().clickHeader()
  assert.equal(first.view().marker, "▶ ")
  assert.equal(first.view().summaryText, "3")
  assert.deepEqual(first.view().summaryColors, [undefined])
  assert.deepEqual(first.kvWrites, [["aamkye.opencode-tools-lsp.collapsed", true]])
  await first.dispose()

  const second = await mountLspPanel({ entries, store })
  try {
    assert.equal(second.view().marker, "▶ ")
    second.view().clickHeader()
    assert.equal(second.view().marker, "▼ ")
    assert.deepEqual(second.kvWrites, [["aamkye.opencode-tools-lsp.collapsed", false]])
  } finally {
    await second.dispose()
  }
})
