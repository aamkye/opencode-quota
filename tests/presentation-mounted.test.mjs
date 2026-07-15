import assert from "node:assert/strict"
import test from "node:test"

globalThis.React = {
  createElement(type, props, ...children) {
    return { type, props: { ...props, children: children.length === 1 ? children[0] : children } }
  },
}

const { mountPanel } = await import("../.tmp-test/presentation-mounted.mjs")

const fullTitle = "Very long usage overview with enough detail to exceed the normalization fallback width of eighty cells"

const model = {
  id: "usage",
  order: 10,
  title: fullTitle,
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
        { id: "five-hour-reset", order: 40, kind: "timer", label: "5H reset", state: "countdown", epoch: Date.now() + 3_600_000, detail: "Next cycle" },
        { id: "tools-used", order: 50, kind: "quantity", label: "Tools used", value: 0, unit: "count" },
        { id: "tools-total", order: 60, kind: "quantity", label: "Tools total", value: 4_000, unit: "count", status: "success" },
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
    const title = text.find((element) => element.props.children === fullTitle)
    const providerTitle = text.find((element) => element.props.children === "Primary")
    const providerStatus = text.find((element) => element.props.children === "Limited")
    const collapsedSummary = text.find((element) => element.props.children === "51%")
    const progressLabel = text.find((element) => element.props.children === "5H")
    const filled = text.find((element) => element.props.children === "█".repeat(100))
    const empty = text.find((element) => element.props.children === "░".repeat(100))
    const percent = text.find((element) => element.props.children === " 25%")
    const indent = text.find((element) => element.props.children === "   ")
    const barContainer = elements.find((element) =>
      element.type === "box"
      && element.props.children?.[0] === filled
      && element.props.children?.[1] === empty)
    const progressRow = elements.find((element) =>
      element.type === "box"
      && element.props.children?.[0] === progressLabel
      && element.props.children?.[1] === barContainer)
    const separator = progressRow?.props.children?.[2]
    const providerRow = elements.find((element) =>
      element.type === "box"
      && element.props.children?.[0] === providerTitle
      && element.props.children?.[1]?.props?.when === "Limited")

    assert.equal(quotaMarker?.props.width, 2)
    assert.equal(title?.props.flexBasis, 0)
    assert.equal(title?.props.flexGrow, 1)
    assert.equal(providerRow?.props.width, "100%")
    assert.equal(providerTitle?.props.flexBasis, 0)
    assert.equal(providerTitle?.props.flexGrow, 1)
    assert.equal(providerStatus?.props.fg, "#ff0000")
    assert.equal(collapsedSummary, undefined, "expanded panels must not render the collapsed summary")
    assert.equal(progressLabel?.props.width, 3)
    assert.equal(barContainer?.props.flexBasis, 0)
    assert.equal(barContainer?.props.flexGrow, 1)
    assert.equal(barContainer?.props.height, 1)
    assert.equal(barContainer?.props.overflow, "hidden")
    assert.equal(filled?.props.flexBasis, 0)
    assert.equal(filled?.props.flexGrow, 25)
    assert.equal(filled?.props.height, 1)
    assert.equal(filled?.props.wrapMode, "none")
    assert.equal(filled?.props.fg, "#ffaa00")
    assert.equal(empty?.props.flexBasis, 0)
    assert.equal(empty?.props.flexGrow, 75)
    assert.equal(empty?.props.height, 1)
    assert.equal(empty?.props.wrapMode, "none")
    assert.equal(empty?.props.fg, "#888888")
    assert.equal(separator?.type, "text")
    assert.equal(separator?.props.width, 1)
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

test("defaults mounted timer and quantity metadata to muted while preserving explicit status", () => {
  const { elements, dispose } = mountPanel(model)
  const text = elements.filter((element) => element.type === "text")

  try {
    const reset = text.find((element) =>
      typeof element.props.children === "string" && element.props.children.startsWith("resets in "))
    const timerDetail = text.find((element) => element.props.children === "Next cycle")
    const toolsUsed = text.find((element) => element.props.children === "Tools used: 0")
    const toolsTotal = text.find((element) => element.props.children === "Tools total: 4K")

    assert.equal(reset?.props.fg, "#888888")
    assert.equal(timerDetail?.props.fg, "#888888")
    assert.equal(toolsUsed?.props.fg, "#888888")
    assert.equal(toolsTotal?.props.fg, "#00ff00")
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

test("renders middle group dividers as short dashes with flexible spacing", () => {
  const multiGroupModel = {
    id: "quota",
    order: 10,
    title: "Quota",
    groups: [
      {
        id: "primary",
        order: 10,
        items: [
          { id: "p1", order: 10, kind: "text", text: "Primary" },
        ],
      },
      {
        id: "other",
        order: 20,
        header: { title: "Other", collapsible: true },
        items: [
          { id: "o1", order: 10, kind: "text", text: "Other" },
        ],
      },
    ],
  }
  const { elements, dispose } = mountPanel(multiGroupModel)

  try {
    const fullDividers = elements.filter((element) =>
      element.type === "box"
      && element.props.width === "100%"
      && element.props.height === 1
      && element.props.border?.[0] === "top")
    assert.equal(fullDividers.length, 2, "top and bottom full-width dividers only")

    const dashEnds = elements.filter((element) =>
      element.type === "text" && element.props.children === "---")
    assert.equal(dashEnds.length, 2, "one middle divider with two --- ends")

    const spacer = elements.find((element) =>
      element.type === "box"
      && element.props.flexBasis === 0
      && element.props.flexGrow === 1
      && element.props.height === 1
      && !element.props.border)
    assert.ok(spacer, "middle divider has a flexible spacer between the dash ends")
  } finally {
    dispose()
  }
})

test("renders a semantic divider inside one panel group", () => {
  const dividerModel = {
    id: "quota",
    order: 10,
    title: "Quota",
    groups: [{
      id: "other-providers",
      order: 10,
      header: { title: "Other providers", collapsible: true },
      items: [
        { id: "first", order: 10, kind: "text", text: "OpenCode GO" },
        { id: "between", order: 20, kind: "divider" },
        { id: "second", order: 30, kind: "text", text: "Z.AI" },
      ],
    }],
  }
  const { elements, dispose } = mountPanel(dividerModel)

  try {
    const dashEnds = elements.filter((element) => element.type === "text" && element.props.children === "---")
    assert.equal(dashEnds.length, 2)
    assert.ok(elements.some((element) =>
      element.type === "box"
      && element.props.width === "100%"
      && element.props.flexDirection === "row"
      && element.props.height === 1
      && !element.props.border))
  } finally {
    dispose()
  }
})
