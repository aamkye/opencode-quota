import assert from "node:assert/strict"
import test from "node:test"

globalThis.React = {
  createElement(type, props, ...children) {
    return { type, props: { ...props, children: children.length === 1 ? children[0] : children } }
  },
}

const { mountCompactPanel } = await import("../.tmp-test/compact-panel-mounted.mjs")

function dividers(elements) {
  return elements.filter((element) =>
    element.type === "box"
    && element.props.width === "100%"
    && element.props.height === 1
    && element.props.border?.[0] === "top")
}

test("mounts a controlled collapsed header with independently colored summary segments", () => {
  const mounted = mountCompactPanel({
    collapsed: true,
    footerDivider: true,
    summary: {
      text: "stale 46%/80%",
      segments: [
        { text: "stale", status: "warning" },
        { text: " ", status: "textMuted" },
        { text: "46%/80%", status: "success" },
      ],
    },
  })

  try {
    const header = () => mounted.elements.find((element) => element.type === "box" && typeof element.props.onMouseDown === "function")
    const marker = () => mounted.elements.find((element) => element.type === "text" && ["▶ ", "▼ "].includes(element.props.children))
    const title = mounted.elements.find((element) => element.type === "text" && element.props.children === "Quota")
    const summary = mounted.elements
      .filter((element) => element.type === "text")
      .filter((element) => ["stale", " ", "46%/80%"].includes(element.props.children))

    assert.equal(marker()?.props.width, 2)
    assert.equal(title?.props.flexBasis, 0)
    assert.equal(title?.props.flexGrow, 1)
    assert.deepEqual(summary.map((element) => [element.props.children, element.props.fg]), [
      ["stale", "#ffaa00"],
      [" ", "#888888"],
      ["46%/80%", "#00ff00"],
    ])
    assert.equal(mounted.elements.some((element) => element.props.children === "Expanded content beyond the parent width"), false)
    assert.equal(dividers(mounted.elements).length, 1, "the header divider always renders but the expanded footer does not")

    header().props.onMouseDown()
    mounted.rerender({ collapsed: true })
    assert.equal(marker()?.props.children, "▶ ", "a click cannot change collapse state without a new controlled prop")

    mounted.rerender({ collapsed: false })
    assert.equal(marker()?.props.children, "▼ ", "the controlled collapsed prop expands the shell")
    assert.equal(mounted.elements.some((element) => element.props.children === "Expanded content beyond the parent width"), true)

    header().props.onMouseDown()
    mounted.rerender({ collapsed: false })
    assert.equal(mounted.toggleCalls(), 2)
    assert.equal(marker()?.props.children, "▼ ", "the shell owns no collapse state after repeated clicks")
  } finally {
    mounted.dispose()
  }
})

test("clips expanded children to parent width and obeys footerDivider", () => {
  const withFooter = mountCompactPanel({ footerDivider: true })
  const withoutFooter = mountCompactPanel()

  try {
    const content = withFooter.elements.find((element) => element.type === "text" && element.props.children === "Expanded content beyond the parent width")
    const region = withFooter.elements.find((element) =>
      element.type === "box"
      && element.props.flexDirection === "column"
      && element.props.width === "100%"
      && element.props.overflow === "hidden"
      && element.props.children === content)
    const expandedSummary = withFooter.elements.find((element) => element.type === "text" && element.props.children === "stale")

    assert.ok(content)
    assert.ok(region)
    assert.equal(expandedSummary, undefined, "summary content is collapsed-only")
    assert.equal(dividers(withFooter.elements).length, 2)
    assert.equal(dividers(withoutFooter.elements).length, 1)
  } finally {
    withFooter.dispose()
    withoutFooter.dispose()
  }
})
