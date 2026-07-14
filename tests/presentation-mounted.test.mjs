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
        { id: "five-hour", order: 30, kind: "progress", label: "5H", value: 25, total: 100, status: "warning" },
        { id: "five-hour-reset", order: 40, kind: "timer", label: "5H reset", state: "countdown", epoch: Date.now() + 3_600_000 },
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

test("mounts responsive framing, bars, reset indentation, and right-aligned status", () => {
  const { elements, dispose } = mountPanel(model)
  const text = elements.filter((element) => element.type === "text")

  try {
    const quotaMarker = text.find((element) => element.props.children === "▼ ")
    const title = text.find((element) => element.props.children === "Very long usage overview")
    const providerTitle = text.find((element) => element.props.children === "Primary")
    const providerStatus = text.find((element) => element.props.children === "Limited")
    const filled = text.find((element) => element.props.children === "█".repeat(100))
    const empty = text.find((element) => element.props.children === "░".repeat(100))
    const percent = text.find((element) => element.props.children === " 25%")
    const indent = text.find((element) => element.props.children === "   ")

    assert.equal(quotaMarker?.props.width, 2)
    assert.equal(title?.props.flexBasis, 0)
    assert.equal(title?.props.flexGrow, 1)
    assert.equal(providerTitle?.props.flexBasis, 0)
    assert.equal(providerTitle?.props.flexGrow, 1)
    assert.equal(providerStatus?.props.fg, "#ff0000")
    assert.equal(filled?.props.flexBasis, 0)
    assert.equal(filled?.props.flexGrow, 25)
    assert.equal(filled?.props.fg, "#ffaa00")
    assert.equal(empty?.props.flexBasis, 0)
    assert.equal(empty?.props.flexGrow, 75)
    assert.equal(empty?.props.fg, "#888888")
    assert.equal(percent?.props.width, 4)
    assert.equal(percent?.props.fg, "#ffaa00")
    assert.equal(indent?.props.width, 3)

    const dividers = elements.filter((element) =>
      element.type === "box"
      && element.props.width === "100%"
      && element.props.height === 1
      && element.props.border?.[0] === "top")
    assert.equal(dividers.length, 2, "one top divider and one group divider")
  } finally {
    dispose()
  }
})

test("wires mounted panel and group mouse collapse while the divider follows the parent width", () => {
  const { elements: mounted, dispose } = mountPanel(model)
  const mouseRows = mounted.filter((element) => element.type === "box" && typeof element.props.onMouseDown === "function")

  try {
    assert.equal(mouseRows.length, 2)
    assert.doesNotThrow(() => mouseRows[0].props.onMouseDown())
    assert.doesNotThrow(() => mouseRows[1].props.onMouseDown())
    assert.ok(mounted.some((element) => element.type === "box" && element.props.width === "100%" && element.props.height === 1 && element.props.border?.[0] === "top"))
  } finally {
    dispose()
  }
})
