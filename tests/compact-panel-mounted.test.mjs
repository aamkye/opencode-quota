import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { build } from "esbuild"
import test from "node:test"

import { transformSolidSource } from "../node_modules/@opentui/solid/scripts/solid-transform.js"

globalThis.React = {
  createElement(type, props, ...children) {
    return { type, props: { ...props, children: children.length === 1 ? children[0] : children } }
  },
}

const { mountCompactPanel } = await import("../.tmp-test/compact-panel-mounted.mjs")

await build({
  bundle: true,
  conditions: ["browser"],
  entryPoints: ["tests/compact-panel-mounted.fixture.ts"],
  format: "esm",
  outfile: ".tmp-test/compact-panel-reactive-mounted.mjs",
  platform: "node",
  plugins: [{
    name: "compact-panel-reactive-mount",
    setup(build) {
      build.onResolve({ filter: /^compact-panel-test-renderer$/ }, () => ({
        path: "compact-panel-test-renderer",
        namespace: "compact-panel-test-renderer",
      }))
      build.onLoad({ filter: /.*/, namespace: "compact-panel-test-renderer" }, () => ({
        contents: `export {
          reactiveCreateComponent as createComponent,
          reactiveCreateElement as createElement,
          reactiveCreateTextNode as createTextNode,
          reactiveEffect as effect,
          reactiveInsert as insert,
          reactiveInsertNode as insertNode,
          reactiveMemo as memo,
          reactiveMergeProps as mergeProps,
          reactiveSetProp as setProp,
          reactiveSpread as spread
        } from ${JSON.stringify(`${process.cwd()}/tests/compact-panel-mounted.fixture.ts`)}`,
        loader: "js",
        resolveDir: process.cwd(),
      }))
      build.onLoad({ filter: /\.[cm]?tsx?$/ }, async (args) => {
        if (args.path.includes("node_modules")) return undefined
        return {
          contents: await transformSolidSource(await readFile(args.path, "utf8"), {
            filename: args.path,
            moduleName: "compact-panel-test-renderer",
          }),
          loader: "js",
        }
      })
    },
  }],
  target: "es2022",
})

const { mountReactiveCompactPanel } = await import("../.tmp-test/compact-panel-reactive-mounted.mjs")

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
      .filter((element) => ["stale", " ", "46%", "/", "80%"].includes(element.props.children))

    assert.equal(marker()?.props.width, 2)
    assert.equal(title?.props.flexBasis, 0)
    assert.equal(title?.props.flexGrow, 1)
    assert.deepEqual(
      mounted.elements
        .filter((element) => element.type === "text")
        .map((element) => [element.props.children, element.props.fg]),
      [
        ["▶ ", undefined],
        ["Quota", undefined],
        ["stale", "#ffaa00"],
        [" ", "#888888"],
        ["46%", "#00ff00"],
        ["/", "#888888"],
        ["80%", "#00ff00"],
      ],
      "the no-detail collapsed text and color sequence mutes numeric slashes",
    )
    assert.deepEqual(summary.map((element) => [element.props.children, element.props.fg]), [
      ["stale", "#ffaa00"],
      [" ", "#888888"],
      ["46%", "#00ff00"],
      ["/", "#888888"],
      ["80%", "#00ff00"],
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

test("mutes only numeric slash separators across plain and segmented summaries", () => {
  const cases = [
    {
      summary: { text: "2/5" },
      expected: [["2", undefined], ["/", "#888888"], ["5", undefined]],
    },
    {
      summary: { text: "46%/80%", status: "success" },
      expected: [["46%", "#00ff00"], ["/", "#888888"], ["80%", "#00ff00"]],
    },
    {
      summary: { text: "7/1/3", status: "error" },
      expected: [["7", "#ff0000"], ["/", "#888888"], ["1", "#ff0000"], ["/", "#888888"], ["3", "#ff0000"]],
    },
    {
      summary: { text: "1.2K/-5", status: "warning" },
      expected: [["1.2K", "#ffaa00"], ["/", "#888888"], ["-5", "#ffaa00"]],
    },
    {
      summary: {
        text: "2/5",
        segments: [{ text: "2", status: "success" }, { text: "/5", status: "error" }],
      },
      expected: [["2", "#00ff00"], ["/", "#888888"], ["5", "#ff0000"]],
    },
    {
      summary: { text: "docs/api", status: "warning" },
      expected: [["docs/api", "#ffaa00"]],
    },
    {
      summary: { text: "SDK/5", status: "warning" },
      expected: [["SDK/5", "#ffaa00"]],
    },
    {
      summary: { text: "5/5SDK", status: "warning" },
      expected: [["5/5SDK", "#ffaa00"]],
    },
  ]

  for (const { summary, expected } of cases) {
    const mounted = mountCompactPanel({ collapsed: true, summary })
    try {
      const rendered = mounted.elements
        .filter((element) => element.type === "text")
        .filter((element) => !["▶ ", "Quota"].includes(element.props.children))
        .map((element) => [element.props.children, element.props.fg])
      assert.deepEqual(rendered, expected)
    } finally {
      mounted.dispose()
    }
  }

  const detailMounted = mountCompactPanel({ collapsed: false, detail: { text: "2/5" } })
  try {
    const detail = detailMounted.elements
      .filter((element) => element.type === "text")
      .filter((element) => ["2", "/", "5"].includes(element.props.children))
      .map((element) => [element.props.children, element.props.fg])
    assert.deepEqual(detail, [["2", undefined], ["/", "#888888"], ["5", undefined]])
  } finally {
    detailMounted.dispose()
  }
})

test("renders optional detail in expanded and collapsed headers", () => {
  const detail = { text: "stale", status: "warning" }
  const summary = { text: "Σ 29.1M / ↻ 97", segments: [{ text: "Σ 29.1M / ↻ 97" }] }
  const mounted = mountCompactPanel({ detail, summary })

  try {
    const texts = () => mounted.elements.filter((element) => element.type === "text")
    const title = () => texts().find((element) => element.props.children === "Quota")
    const stale = () => texts().find((element) => element.props.children === "stale")
    const metric = () => texts().find((element) => element.props.children === "Σ 29.1M / ↻ 97")

    assert.ok(stale())
    assert.equal(stale()?.props.fg, "#ffaa00")
    assert.ok(texts().indexOf(stale()) > texts().indexOf(title()), "detail follows the flexible title")
    assert.equal(metric(), undefined, "summary remains collapsed-only")

    mounted.rerender({ collapsed: true })
    const rightSide = texts().filter((element) => ["stale", " ", "Σ 29.1M / ↻ 97"].includes(element.props.children))
    const separators = rightSide.filter((element) => element.props.children === " ")

    assert.equal(separators.length, 1)
    assert.equal(separators[0]?.props.width, 1)
    assert.equal(rightSide.map((element) => element.props.children).join(""), "stale Σ 29.1M / ↻ 97")
    assert.equal(title()?.props.flexBasis, 0)
    assert.equal(title()?.props.flexGrow, 1)
    assert.equal(title()?.props.flexShrink, 1)
    assert.equal(title()?.props.minWidth, 0)
    assert.equal(stale()?.props.flexShrink, 0)
    assert.equal(separators[0]?.props.flexShrink, 0)
    assert.equal(metric()?.props.flexShrink, 0)
    assert.equal(mounted.elements.filter((element) => (
      element.type === "box"
      && element.props.flexDirection === "row"
      && element.props.flexShrink === 0
    )).length, 2, "the detail and summary wrappers do not shrink")
  } finally {
    mounted.dispose()
  }
})

test("preserves statuses on segmented header detail", () => {
  const mounted = mountCompactPanel({
    detail: {
      text: "stale / limited",
      segments: [
        { text: "stale", status: "warning" },
        { text: "limited", status: "error" },
      ],
    },
  })

  try {
    const segments = mounted.elements
      .filter((element) => element.type === "text")
      .filter((element) => ["stale", "limited"].includes(element.props.children))
    assert.deepEqual(segments.map((element) => [element.props.children, element.props.fg]), [
      ["stale", "#ffaa00"],
      ["limited", "#ff0000"],
    ])
    assert.ok(segments.every((element) => element.props.flexShrink === 0))
    assert.ok(mounted.elements.some((element) => (
      element.type === "box"
      && element.props.flexDirection === "row"
      && element.props.flexShrink === 0
    )))
  } finally {
    mounted.dispose()
  }
})

test("reactively switches header detail from text to segments and back", async () => {
  const mounted = await mountReactiveCompactPanel({ text: "stale", status: "warning" })
  const detailText = () => mounted.textElements()
    .filter((element) => ["stale", " / ", "limited"].includes(element.text))
    .map((element) => [element.text, element.fg])

  try {
    assert.equal(mounted.panelMounts(), 1)
    assert.deepEqual(detailText(), [["stale", "#ffaa00"]])

    await mounted.setDetail({
      text: "stale / limited",
      segments: [
        { text: "stale", status: "warning" },
        { text: " / ", status: "textMuted" },
        { text: "limited", status: "error" },
      ],
    })
    assert.equal(mounted.panelMounts(), 1, "CompactPanel remains mounted across the representation update")
    assert.deepEqual(detailText(), [
      ["stale", "#ffaa00"],
      [" / ", "#888888"],
      ["limited", "#ff0000"],
    ])

    await mounted.setDetail({ text: "limited", status: "error" })
    assert.equal(mounted.panelMounts(), 1)
    assert.deepEqual(detailText(), [["limited", "#ff0000"]])
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

test("makes the name the only flexible status-row child", () => {
  const label = "Connected"
  const row = CompactStatusRow({
    name: "codegraph-global",
    label,
    status: "success",
    theme: () => ({
      error: "#ff0000",
      warning: "#ffaa00",
      success: "#00ff00",
      text: "#ffffff",
      textMuted: "#888888",
    }),
  })
  const mounted = mountedElements(row)
  const bullet = mounted.find(({ element }) => element.type === "text" && element.props.children === "• ")?.element
  const name = mounted.find(({ element }) => element.type === "text" && element.props.children === "codegraph-global")?.element
  const gap = mounted.find(({ element }) => element.type === "text" && element.props.children === " ")?.element
  const labelMount = mounted.find(({ element }) => element.type === "text" && element.props.children === label)

  assert.equal(Number(bullet?.props.width) + Number(gap?.props.width) + Number(labelMount?.parent?.element.props.width), 12)
  assert.equal(name?.props.width, undefined, "the name must not retain a fixed 37-cell allocation")
  assert.equal(name?.props.flexBasis, 0)
  assert.equal(name?.props.flexGrow, 1)
  assert.equal(name?.props.flexShrink, 1)
  assert.equal(labelMount?.parent?.element.props.flexShrink, 0)
  assert.equal(labelMount?.element.props.children, "Connected")
})
