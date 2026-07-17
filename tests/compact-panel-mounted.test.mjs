import assert from "node:assert/strict"
import { build } from "esbuild"
import test from "node:test"

globalThis.React = {
  createElement(type, props, ...children) {
    return { type, props: { ...props, children: children.length === 1 ? children[0] : children } }
  },
}

const { mountCompactPanel } = await import("../.tmp-test/compact-panel-mounted.mjs")

await build({
  bundle: true,
  entryPoints: ["tui/presentation/compact-panel.tsx"],
  external: ["solid-js"],
  format: "esm",
  outfile: ".tmp-test/compact-status-row.mjs",
  platform: "node",
  target: "es2022",
})

const { CompactStatusRow } = await import("../.tmp-test/compact-status-row.mjs")

function mountedElements(value, parent) {
  if (Array.isArray(value)) return value.flatMap((child) => mountedElements(child, parent))
  if (!value || typeof value !== "object" || !("type" in value) || !("props" in value)) return []
  const mounted = { element: value, parent }
  return [mounted, ...mountedElements(value.props.children, mounted)]
}

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

test("mounts a bounded status row with a semantic bullet and truncating long name", () => {
  const labels = ["Connected", "Disabled", "Failed", "Needs auth", "Needs client ID", "Unknown"]
  const longName = "postgres-test-vendsystem-with-a-name-that-exceeds-the-sidebar"
  const theme = {
    error: "#ff0000",
    warning: "#ffaa00",
    success: "#00ff00",
    text: "#ffffff",
    textMuted: "#888888",
  }

  for (const label of labels) {
    const row = CompactStatusRow({ name: longName, label, status: "warning", theme: () => theme })
    const mounted = mountedElements(row)
    const root = mounted[0]?.element
    const bullet = mounted.find(({ element }) => element.type === "text" && element.props.children === "• ")?.element
    const name = mounted.find(({ element }) => element.type === "text" && element.props.children === longName)?.element
    const labelMount = mounted.find(({ element }) => element.type === "text" && element.props.children === label)

    assert.equal(root?.type, "box")
    assert.equal(root?.props.flexDirection, "row")
    assert.equal(root?.props.width, "100%")
    assert.equal(root?.props.overflow, "hidden")
    assert.equal(bullet?.props.width, 2)
    assert.equal(bullet?.props.fg, "#ffaa00", "the supplied semantic role colors the bullet")
    assert.equal(mounted.some(({ element }) => element.props.children === "● "), false)
    assert.equal(name?.props.minWidth, 0)
    assert.equal(name?.props.overflow, "hidden")
    assert.equal(name?.props.wrapMode, "none")
    assert.equal(name?.props.truncate, true)
    assert.equal(labelMount?.element.props.fg, "#888888")
    assert.equal(labelMount?.parent?.element.props.width, label.length)
    assert.equal(labelMount?.parent?.element.props.justifyContent, "flex-end")
  }
})
