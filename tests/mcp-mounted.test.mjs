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
  { name: "auth", status: "needs_auth", label: "Needs auth", color: "#ff0000" },
  { name: "client", status: "needs_client_registration", label: "Needs client ID", color: "#ff0000" },
  { name: "future", status: "future_status", label: "Unknown", color: "#888888" },
]

test("registers MCP at slot 140 and renders rows in source order", async () => {
  const mounted = await mountMcpPanel({ entries: statuses })

  try {
    const view = mounted.view()
    assert.equal(mounted.pluginID, "aamkye/opencode-tools-mcp")
    assert.equal(mounted.registrations.length, 1)
    assert.equal(mounted.registrations[0].order, 140)
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

test("restores and persists MCP collapse toggles", async () => {
  const mounted = await mountMcpPanel({
    savedCollapsed: true,
    entries: [
      { name: "docs", status: "connected" },
      { name: "database", status: "needs_auth" },
    ],
  })

  try {
    let view = mounted.view()
    assert.equal(view.marker, "▶ ")
    assert.equal(view.summaryText, "1/0/1")
    assert.deepEqual(view.summarySegments, [
      ["1", "#00ff00"],
      ["/", "#888888"],
      ["0", "#ffaa00"],
      ["/", "#888888"],
      ["1", "#ff0000"],
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

test("renders an expanded empty MCP panel and persists its header toggles", async () => {
  for (const savedCollapsed of [false, true]) {
    const mounted = await mountMcpPanel({ savedCollapsed })
    try {
      let view = mounted.view()
      assert.equal(view.marker, savedCollapsed ? "▶ " : "▼ ")
      assert.equal(view.summaryText, savedCollapsed ? "0/0/0" : "")
      if (savedCollapsed) {
        assert.deepEqual(view.summarySegments, [
          ["0", "#00ff00"],
          ["/", "#888888"],
          ["0", "#ffaa00"],
          ["/", "#888888"],
          ["0", "#ff0000"],
        ])
        assert.equal(view.rows.length, 0)
        assert.equal(view.dividerCount, 1)
      } else {
        assert.deepEqual(view.rows.map((row) => [row.name, row.label, row.bulletColor, row.labelColor]), [
          ["No MCP servers configured", "", "#888888", "#888888"],
        ])
        assert.equal(view.dividerCount, 2)
      }
      assert.deepEqual(mounted.kvWrites, [])

      if (savedCollapsed) view.clickHeader()
      view = mounted.view()
      assert.equal(view.marker, "▼ ")
      assert.equal(view.summaryText, "")
      assert.deepEqual(view.rows.map((row) => [row.name, row.label, row.bulletColor, row.labelColor]), [
        ["No MCP servers configured", "", "#888888", "#888888"],
      ])
      assert.equal(view.dividerCount, 2)
      assert.deepEqual(mounted.kvWrites, savedCollapsed ? [["aamkye.opencode-tools-mcp.collapsed", false]] : [])

      view.clickHeader()
      view = mounted.view()
      assert.equal(view.marker, "▶ ")
      assert.equal(view.summaryText, "0/0/0")
      assert.equal(view.dividerCount, 1)
      assert.deepEqual(mounted.kvWrites.at(-1), ["aamkye.opencode-tools-mcp.collapsed", true])
    } finally {
      await mounted.dispose()
    }
  }
})

test("retains the empty MCP expansion when entries hydrate", async () => {
  const mounted = await mountMcpPanel({ savedCollapsed: true })

  try {
    let view = mounted.view()
    assert.equal(view.marker, "▶ ")

    view.clickHeader()
    view = mounted.view()
    assert.equal(view.marker, "▼ ")
    assert.deepEqual(mounted.kvWrites, [["aamkye.opencode-tools-mcp.collapsed", false]])

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
      ["third", "Needs auth", "#ff0000"],
      ["first", "Failed", "#ff0000"],
    ])
    assert.equal(mounted.registrations.length, 1)

    view.clickHeader()
    view = mounted.view()
    assert.equal(view.summaryText, "0/0/2")
    assert.deepEqual(view.summarySegments, [
      ["0", "#00ff00"],
      ["/", "#888888"],
      ["0", "#ffaa00"],
      ["/", "#888888"],
      ["2", "#ff0000"],
    ])

    mounted.setMcp([{ name: "first", status: "connected" }])
    assert.equal(mounted.view().summaryText, "1/0/0")
    mounted.setMcp([])
    assert.equal(mounted.view().summaryText, "0/0/0")
    assert.equal(mounted.registrations.length, 1)
    assert.equal(mounted.slotMounts(), 1)
    assert.deepEqual(mounted.kvReads, ["aamkye.opencode-tools-mcp.collapsed"])
  } finally {
    await mounted.dispose()
  }
})
