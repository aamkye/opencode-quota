import assert from "node:assert/strict"
import test from "node:test"

globalThis.React = {
  createElement(type, props, ...children) {
    return { type, props: { ...props, children: children.length === 1 ? children[0] : children } }
  },
}

const { mountPanel } = await import("../.tmp-test/presentation-mounted.mjs")

const model = {
  id: "usage",
  order: 10,
  title: "Very long usage overview",
  collapsedSummary: { kind: "text", text: "51%", status: "warning" },
  groups: [
    {
      id: "accounts",
      order: 10,
      header: { title: "Accounts", collapsible: true },
      items: [
        { id: "status", order: 10, kind: "header", title: "Primary", detail: "Limited", status: "error" },
        { id: "detail", order: 20, kind: "text", text: "Visible only while expanded" },
        {
          id: "limits",
          order: 30,
          kind: "table",
          columns: [
            { id: "identity", order: 10, title: "Identity" },
            { id: "model", order: 20, title: "Model" },
            { id: "remaining", order: 30, title: "Remaining", align: "end" },
          ],
          rows: [
            {
              id: "gpt",
              order: 10,
              cells: [
                { kind: "text", text: "ChatGPT" },
                { kind: "text", text: "GPT-5" },
                { kind: "quantity", value: 80, unit: "count", status: "success" },
              ],
            },
          ],
        },
      ],
    },
  ],
}

test("mounts responsive width, themed statuses, and optional compact-table identity", () => {
  const { elements: mounted, dispose } = mountPanel(model)
  const text = mounted.filter((element) => element.type === "text")

  try {
    assert.ok(text.some((element) => element.props.children === "Identity"))
    assert.equal(text.find((element) => element.props.children === "Primary: Limited")?.props.fg, "#ff0000")
    assert.equal(text.find((element) => element.props.children === "51%")?.props.fg, "#ffaa00")
    assert.equal(text.find((element) => element.props.children.includes("80"))?.props.fg, "#00ff00")
    assert.equal(text.filter((element) => typeof element.props.width === "number").slice(0, 4).reduce((sum, element) => sum + element.props.width, 0), 24)

    const constrained = mountPanel(model, 12)
    try {
      const constrainedText = constrained.elements.filter((element) => element.type === "text")
      assert.ok(!constrainedText.some((element) => element.props.children === "Identity"))
      assert.ok(constrainedText.some((element) => element.props.children.includes("80")))
    } finally {
      constrained.dispose()
    }
  } finally {
    dispose()
  }
})

test("wires mounted panel and group mouse collapse while the divider follows the parent width", () => {
  const { elements: mounted, dispose } = mountPanel(model)
  const mouseRows = mounted.filter((element) => element.type === "box" && typeof element.props["on:down"] === "function")

  try {
    assert.equal(mouseRows.length, 2)
    assert.doesNotThrow(() => mouseRows[0].props["on:down"]())
    assert.doesNotThrow(() => mouseRows[1].props["on:down"]())
    assert.ok(mounted.some((element) => element.type === "box" && element.props.width === "100%" && element.props.height === 1 && element.props.border?.[0] === "top"))
  } finally {
    dispose()
  }
})
