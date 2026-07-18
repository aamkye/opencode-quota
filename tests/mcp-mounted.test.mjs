import assert from "node:assert/strict"
import test from "node:test"

globalThis.React = {
  createElement(type, props, ...children) {
    return { type, props: { ...props, children: children.length === 1 ? children[0] : children } }
  },
  Fragment: Symbol.for("react.fragment"),
}

const { mountMcpPanel } = await import("../.tmp-test/mcp-mounted.mjs")

const statuses = [
  { name: "codegraph-global", status: "connected", label: "Connected", color: "#00ff00" },
  { name: "context7-global", status: "disabled", label: "Disabled", color: "#888888" },
  { name: "postgres-test-vendsystem-with-a-name-that-exceeds-the-sidebar", status: "failed", label: "Failed", color: "#ff0000" },
  { name: "auth", status: "needs_auth", label: "Needs auth", color: "#ffaa00" },
  { name: "client", status: "needs_client_registration", label: "Needs client ID", color: "#ff0000" },
  { name: "future", status: "future_status", label: "Unknown", color: "#888888" },
]

test("renders expanded MCP rows in source order with shared colors and 37-cell separators", async () => {
  const mounted = await mountMcpPanel({ entries: statuses })

  try {
    const view = mounted.view()
    assert.equal(mounted.pluginID, "aamkye/opencode-tools-mcp")
    assert.equal(mounted.registrations.length, 1)
    assert.equal(mounted.registrations[0].order, 111)
    assert.deepEqual(Object.keys(mounted.registrations[0].slots), ["sidebar_content"])
    assert.equal(view.marker, "▼ ")
    assert.equal(view.summaryText, "")
    assert.equal(view.dividerCount, 2)
    assert.deepEqual(view.rows.map((row) => [row.name, row.label, row.bullet, row.bulletColor, row.labelColor]),
      statuses.map((entry) => [entry.name, entry.label, "• ", entry.color, "#888888"]))
    for (const row of view.rows) {
      assert.equal(row.cells, 37)
      assert.equal(row.text.length, 37)
      assert.equal(row.text.trimEnd(), row.text)
    }
    assert.equal(view.rows[2].text, "• postgres-test-vendsystem-wi… Failed")
  } finally {
    await mounted.dispose()
  }
})

test("restores and persists only non-empty MCP collapse toggles", async () => {
  const mounted = await mountMcpPanel({
    savedCollapsed: true,
    entries: [
      { name: "docs", status: "connected" },
      { name: "database", status: "failed" },
    ],
  })

  try {
    let view = mounted.view()
    assert.equal(view.marker, "▶ ")
    assert.equal(view.summaryText, "1/2")
    assert.deepEqual(view.summarySegments, [
      ["1", "#00ff00"],
      ["/", "#888888"],
      ["2", "#ff0000"],
    ])
    assert.equal(view.rows.length, 0)
    assert.equal(view.dividerCount, 1)

    view.clickHeader()
    view = mounted.view()
    assert.equal(view.marker, "▼ ")
    assert.deepEqual(mounted.kvWrites, [["aamkye.opencode-tools-mcp.collapsed", false]])

    view.clickHeader()
    assert.equal(mounted.view().marker, "▶ ")
    assert.deepEqual(mounted.kvWrites, [
      ["aamkye.opencode-tools-mcp.collapsed", false],
      ["aamkye.opencode-tools-mcp.collapsed", true],
    ])
  } finally {
    await mounted.dispose()
  }
})

test("forces empty MCP state collapsed without writes and restores the saved signal without interaction", async () => {
  for (const savedCollapsed of [false, true]) {
    const mounted = await mountMcpPanel({ savedCollapsed })
    try {
      let view = mounted.view()
      assert.equal(view.marker, "▶ ")
      assert.equal(view.summaryText, "0/0")
      assert.deepEqual(view.summarySegments, [
        ["0", "#888888"],
        ["/", "#888888"],
        ["0", "#888888"],
      ])
      assert.equal(view.rows.length, 0)
      assert.equal(view.dividerCount, 1)
      assert.deepEqual(mounted.kvWrites, [])

      mounted.setMcp([{ name: "docs", status: "connected" }])
      view = mounted.view()
      assert.equal(view.marker, savedCollapsed ? "▶ " : "▼ ")
    } finally {
      await mounted.dispose()
    }
  }
})

test("honors one expand click received before MCP entries hydrate", async () => {
  const mounted = await mountMcpPanel({ savedCollapsed: true })

  try {
    let view = mounted.view()
    assert.equal(view.marker, "▶ ")

    view.clickHeader()
    view = mounted.view()
    assert.equal(view.marker, "▶ ")
    assert.deepEqual(mounted.kvWrites, [])

    mounted.setMcp([{ name: "docs", status: "connected" }])
    view = mounted.view()
    assert.equal(view.marker, "▼ ")
    assert.deepEqual(mounted.kvWrites, [["aamkye.opencode-tools-mcp.collapsed", false]])
  } finally {
    await mounted.dispose()
  }
})

test("reacts to MCP additions, removals, reorder, and status changes without reactivation", async () => {
  const mounted = await mountMcpPanel({
    entries: [
      { name: "first", status: "connected" },
      { name: "second", status: "disabled" },
    ],
  })

  try {
    assert.equal(mounted.slotMounts(), 1)
    assert.deepEqual(mounted.kvReads, ["aamkye.opencode-tools-mcp.collapsed"])
    assert.deepEqual(mounted.view().rows.map((row) => row.name), ["first", "second"])
    mounted.setMcp([
      { name: "third", status: "needs_auth" },
      { name: "first", status: "failed" },
    ])
    let view = mounted.view()
    assert.deepEqual(view.rows.map((row) => [row.name, row.label, row.bulletColor]), [
      ["third", "Needs auth", "#ffaa00"],
      ["first", "Failed", "#ff0000"],
    ])
    assert.equal(mounted.registrations.length, 1)

    view.clickHeader()
    view = mounted.view()
    assert.equal(view.summaryText, "0/2")
    assert.deepEqual(view.summarySegments.map((segment) => segment[1]), ["#00ff00", "#888888", "#ff0000"])

    mounted.setMcp([{ name: "first", status: "connected" }])
    assert.equal(mounted.view().summaryText, "1/1")
    mounted.setMcp([])
    assert.equal(mounted.view().summaryText, "0/0")
    assert.equal(mounted.registrations.length, 1)
    assert.equal(mounted.slotMounts(), 1)
    assert.deepEqual(mounted.kvReads, ["aamkye.opencode-tools-mcp.collapsed"])
  } finally {
    await mounted.dispose()
  }
})
