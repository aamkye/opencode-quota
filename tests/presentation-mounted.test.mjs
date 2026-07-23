import assert from "node:assert/strict"
import test from "node:test"

globalThis.React = {
  createElement(type, props, ...children) {
    return { type, props: { ...props, children: children.length === 1 ? children[0] : children } }
  },
}

const { mountPanel } = await import("../.tmp-test/presentation-mounted.mjs")
const { normalizePanelModel } = await import("../.tmp-test/presentation-renderer.mjs")
const { mapOpenAiPanelState } = await import("../.tmp-test/provider-openai.mjs")
const { mapZaiPanelState } = await import("../.tmp-test/provider-zai.mjs")

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
            { id: "model", order: 20, title: "Model", align: "center" },
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

const quotaSnapshotModel = {
  id: "quota",
  order: 10,
  title: "Quota",
  collapsedSummary: { kind: "text", text: "46%" },
  groups: [
    {
      id: "openai",
      order: 10,
      items: [
        { id: "openai-header", order: 10, kind: "header", title: "OpenAI: Pro Lite" },
        { id: "openai-weekly", order: 20, kind: "progress", label: "7D", value: 46, total: 100 },
        { id: "openai-reset", order: 30, kind: "timer", label: "7D reset", state: "countdown", epoch: 143 * 3_600_000 },
      ],
    },
    {
      id: "other-providers",
      order: 20,
      header: { title: "Other providers", collapsible: true },
      items: [
        { id: "zai-header", order: 10, kind: "header", title: "Z.AI: Max" },
        { id: "zai-five-hour", order: 20, kind: "progress", label: "5H", value: 100, total: 100 },
        { id: "zai-reset", order: 30, kind: "timer", label: "5H reset", state: "idle" },
      ],
    },
  ],
}

function textualSnapshot(layout, width) {
  const divider = "-".repeat(width)
  const middleDivider = `---${" ".repeat(width - 6)}---`
  const row = (cells) => cells.map((cell) => cell.text).join("").trimEnd()
  const itemLines = (item) => {
    if (item.kind === "divider") return [middleDivider]
    if (item.kind === "progress") return [row(item.cells)]
    if (item.kind === "timer") return [`   ${item.text}`, ...(item.detail ? [`   ${item.detail}`] : [])]
    if (item.kind === "table") return item.rows.map(row)
    return [item.text]
  }
  const lines = [row(layout.header.cells), divider]

  if (!layout.collapsed) {
    layout.groups.forEach((group, index) => {
      if (group.header) lines.push(`${group.header.collapsible ? (group.collapsed ? "▶ " : "▼ ") : ""}${group.header.title}`)
      if (!group.collapsed) lines.push(...group.items.flatMap(itemLines))
      if (index < layout.groups.length - 1) lines.push(middleDivider)
    })
    if (layout.groups.length > 0) lines.push(divider)
  }

  assert.ok(lines.every((line) => line.length <= width), `snapshot exceeds ${width} cells`)
  assert.ok(lines.every((line) => line === line.trimEnd()), "snapshot contains trailing whitespace")
  return lines.join("\n")
}

test("normalizes quota snapshot model with 37-cell allocation", () => {
  const normalized = normalizePanelModel(quotaSnapshotModel, { availableCells: 37, now: 0 })
  assert.equal(normalized.id, "quota")
  assert.equal(normalized.title, "Quota")
  const progress = normalized.groups[0].items.find((item) => item.kind === "progress")
  assert.ok(progress)
  assert.equal(progress.allocation.bar, 29)
})

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

test("resets panel and group disclosure when the session reset key changes", async () => {
  const mounted = mountPanel(quotaSnapshotModel, {
    initiallyCollapsedGroupIds: ["other-providers"],
    resetKey: "session-a",
  })

  try {
    await new Promise((resolve) => setImmediate(resolve))
    let elements = mounted.readElements()
    let mouseRows = elements.filter((element) => element.type === "box" && typeof element.props.onMouseDown === "function")
    let panelHeader = mouseRows.find((row) => row.props.children?.[1]?.props?.children === "Quota")
    let groupHeader = mouseRows.find((row) => row.props.children?.[1]?.props?.children === "Other providers")
    assert.equal(panelHeader?.props.children[0]?.props?.children, "▼ ")
    assert.equal(groupHeader?.props.children[0]?.props?.children, "▶ ")
    groupHeader.props.onMouseDown()
    panelHeader.props.onMouseDown()
    elements = mounted.readElements()
    mouseRows = elements.filter((element) => element.type === "box" && typeof element.props.onMouseDown === "function")
    panelHeader = mouseRows.find((row) => row.props.children?.[1]?.props?.children === "Quota")
    assert.equal(panelHeader?.props.children[0]?.props?.children, "▶ ")

    mounted.setResetKey("session-b")
    await new Promise((resolve) => setImmediate(resolve))
    assert.equal(mounted.resetKey(), "session-b")
    elements = mounted.readElements()
    mouseRows = elements.filter((element) => element.type === "box" && typeof element.props.onMouseDown === "function")
    panelHeader = mouseRows.find((row) => row.props.children?.[1]?.props?.children === "Quota")
    groupHeader = mouseRows.find((row) => row.props.children?.[1]?.props?.children === "Other providers")
    assert.equal(panelHeader?.props.children[0]?.props?.children, "▼ ")
    assert.equal(groupHeader?.props.children[0]?.props?.children, "▶ ")
  } finally {
    mounted.dispose()
  }
})

test("mounts collapsed stale and quota summary segments with independent colors", () => {
  const collapsedModel = {
    id: "quota",
    order: 10,
    title: "Quota",
    collapsedSummary: {
      kind: "text",
      text: "stale 46%/80%",
      segments: [
        { text: "stale", status: "warning" },
        { text: " ", status: "textMuted" },
        { text: "46%/80%", status: "success" },
      ],
    },
    groups: [],
  }
  const mounted = mountPanel(collapsedModel, { initiallyCollapsed: true })

  try {
    const summary = mounted.elements
      .filter((element) => element.type === "text")
      .filter((element) => ["stale", " ", "46%", "/", "80%"].includes(element.props.children))

    assert.deepEqual(summary.map((element) => [element.props.children, element.props.fg]), [
      ["stale", "#ffaa00"],
      [" ", "#888888"],
      ["46%", "#00ff00"],
      ["/", "#888888"],
      ["80%", "#00ff00"],
    ])
  } finally {
    mounted.dispose()
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
    assert.ok(dashEnds.every((element) => element.props.fg === "#888888"))

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
    assert.ok(dashEnds.every((element) => element.props.fg === "#888888"))
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

test("mutes only the Other providers group marker and title", () => {
  const groupHeaderModel = {
    id: "quota",
    order: 10,
    title: "Quota",
    groups: [
      {
        id: "primary-group",
        order: 10,
        header: { title: "Primary group", collapsible: true },
        items: [],
      },
      {
        id: "other-providers",
        order: 20,
        header: { title: "Other providers", collapsible: true },
        items: [],
      },
    ],
  }
  const { elements, dispose } = mountPanel(groupHeaderModel)

  try {
    const headerRows = elements.filter((element) =>
      element.type === "box"
      && typeof element.props.onMouseDown === "function"
      && Array.isArray(element.props.children)
      && element.props.children.length === 2)
    const primaryHeader = headerRows.find((row) => row.props.children[1]?.props?.children === "Primary group")
    const otherHeader = headerRows.find((row) => row.props.children[1]?.props?.children === "Other providers")

    assert.equal(primaryHeader?.props.children[0]?.props?.fg, undefined)
    assert.equal(primaryHeader?.props.children[1]?.props?.fg, undefined)
    assert.equal(otherHeader?.props.children[0]?.props?.fg, "#888888")
    assert.equal(otherHeader?.props.children[1]?.props?.fg, "#888888")
  } finally {
    dispose()
  }
})

test("mounts ordinary and segmented provider-header details at the right edge", () => {
  const headerModel = {
    id: "quota",
    order: 10,
    title: "Quota",
    groups: [{
      id: "providers",
      order: 10,
      items: [
        { id: "ordinary", order: 10, kind: "header", title: "Ordinary", detail: "Limited", status: "error" },
        { id: "openai", order: 20, kind: "header", title: "OpenAI: Pro", detailSegments: [{ text: "stale", status: "warning" }] },
        {
          id: "zai-peak",
          order: 30,
          kind: "header",
          title: "Z.AI: Max",
          detailSegments: [
            { text: "Peak (3x)", status: "error" },
            { text: " / ", status: "textMuted" },
            { text: "stale", status: "warning" },
          ],
        },
        {
          id: "zai-off-peak",
          order: 40,
          kind: "header",
          title: "Z.AI: Pro",
          detailSegments: [
            { text: "Off-Peak (1x)", status: "success" },
            { text: " / ", status: "textMuted" },
            { text: "stale", status: "warning" },
          ],
        },
      ],
    }],
  }
  const { elements, dispose } = mountPanel(headerModel)
  const details = elements
    .filter((element) => element.type === "text")
    .filter((element) => ["Limited", "stale", "Peak (3x)", " / ", "Off-Peak (1x)"].includes(element.props.children))

  try {
    assert.deepEqual(details.map((element) => [element.props.children, element.props.fg]), [
      ["Limited", "#ff0000"],
      ["stale", "#ffaa00"],
      ["Peak (3x)", "#ff0000"],
      [" / ", "#888888"],
      ["stale", "#ffaa00"],
      ["Off-Peak (1x)", "#00ff00"],
      [" / ", "#888888"],
      ["stale", "#ffaa00"],
    ])
    const titles = elements.filter((element) =>
      element.type === "text"
      && ["Ordinary", "OpenAI: Pro", "Z.AI: Max", "Z.AI: Pro"].includes(element.props.children))
    assert.ok(titles.every((element) => element.props.flexBasis === 0 && element.props.flexGrow === 1))
  } finally {
    dispose()
  }
})

test("mounts unsupported provider details in expanded and collapsed 37-cell quota panels", () => {
  const unsupportedModel = {
    id: "quota",
    order: 10,
    title: "Quota",
    collapsedSummary: {
      kind: "text",
      text: "anthropic unsupported",
      segments: [{ text: "anthropic" }, { text: " " }, { text: "unsupported", status: "error" }],
    },
    groups: [{
      id: "unsupported",
      order: 10,
      items: [{
        id: "unsupported:header",
        order: 10,
        kind: "header",
        title: "anthropic",
        detailSegments: [{ text: "unsupported", status: "error" }],
      }],
    }],
  }
  const expanded = mountPanel(unsupportedModel)
  const collapsed = mountPanel(unsupportedModel, { initiallyCollapsed: true })

  try {
    const expandedTitle = expanded.elements.find((element) => element.type === "text" && element.props.children === "anthropic")
    const expandedDetail = expanded.elements.find((element) => element.type === "text" && element.props.children === "unsupported")
    const collapsedProvider = collapsed.elements.find((element) => element.type === "text" && element.props.children === "anthropic")
    const collapsedDetail = collapsed.elements.find((element) => element.type === "text" && element.props.children === "unsupported")

    assert.equal(expandedTitle?.props.flexBasis, 0)
    assert.equal(expandedTitle?.props.flexGrow, 1)
    assert.equal(expandedDetail?.props.fg, "#ff0000")
    assert.equal(expandedTitle?.props.fg, undefined)
    assert.equal(collapsedProvider?.props.fg, undefined)
    assert.equal(collapsedDetail?.props.fg, "#ff0000")
  } finally {
    expanded.dispose()
    collapsed.dispose()
  }
})

test("mounts compact tables as clipped non-wrapping parent-width flex rows", () => {
  const { elements, dispose } = mountPanel(model)

  try {
    const tableRows = elements.filter((element) =>
      element.type === "box"
      && element.props.width === "100%"
      && element.props.overflow === "hidden"
      && Array.isArray(element.props.children)
      && element.props.children.length === 3
      && element.props.children.every((child) => child?.type === "box"),
    )

    assert.equal(tableRows.length, 2, "header and data rows use responsive table layout")
    for (const row of tableRows) {
      for (const cell of row.props.children) {
        assert.equal(cell.props.flexBasis, 0)
        assert.equal(cell.props.flexGrow, 1)
        assert.equal(cell.props.flexShrink, 1)
        assert.equal(cell.props.minWidth, 0)
        assert.equal(cell.props.overflow, "hidden")
        assert.equal(typeof cell.props.width, "undefined")
        assert.equal(cell.props.children?.type, "text")
        assert.equal(cell.props.children?.props.wrapMode, "none")
        assert.equal(cell.props.children?.props.truncate, true)
        assert.equal(typeof cell.props.children?.props.width, "undefined")
      }
    }

    assert.deepEqual(
      tableRows[0].props.children.map((cell) => cell.props.children.props.children),
      ["Identity", "Model", "Remaining"],
    )
    assert.deepEqual(
      tableRows[0].props.children.map((cell) => cell.props.justifyContent),
      ["flex-start", "center", "flex-end"],
    )
    assert.equal(tableRows[1].props.children[2].props.children.props.fg, "#00ff00")
  } finally {
    dispose()
  }
})

test("mounts stale OpenAI state as warning text in the provider header", () => {
  const staleModel = mapOpenAiPanelState({
    phase: "stale",
    now: Date.UTC(2026, 6, 13, 6, 0, 0),
    data: {
      planType: "Pro Lite",
      primary: { used_percent: 54, limit_window_seconds: 604_800, reset_after_seconds: 3_600 },
      secondary: null,
      codeReview: null,
      limitReached: false,
      creditsBalance: null,
      creditsUnlimited: false,
    },
  })
  const { elements, dispose } = mountPanel(staleModel)
  const text = elements.filter((element) => element.type === "text")

  try {
    const title = text.find((element) => element.props.children === "OpenAI: Pro Lite")
    const stale = text.find((element) => element.props.children === "stale")
    assert.equal(title?.props.flexBasis, 0)
    assert.equal(title?.props.flexGrow, 1)
    assert.equal(stale?.props.fg, "#ffaa00")
    assert.equal(text.some((element) => element.props.children === "~stale"), false)
  } finally {
    dispose()
  }
})

test("mounts stale Z.AI state as colored Peak, separator, and stale header segments", () => {
  const staleModel = mapZaiPanelState({
    phase: "stale",
    now: Date.UTC(2026, 6, 13, 6, 0, 0),
    data: {
      level: "Max",
      tokenUsedPct: 25,
      tokenRemainingPct: 75,
      tokenNextResetEpoch: Date.UTC(2026, 6, 13, 7, 0, 0),
      tokenAbsolute: null,
      weeklyLimit: null,
      timeLimit: null,
    },
  })
  const { elements, dispose } = mountPanel(staleModel)
  const text = elements.filter((element) => element.type === "text")

  try {
    const title = text.find((element) => element.props.children === "Z.AI: Max")
    const segments = text.filter((element) => ["Peak (3x)", " / ", "stale"].includes(element.props.children))
    assert.equal(title?.props.flexBasis, 0)
    assert.equal(title?.props.flexGrow, 1)
    assert.deepEqual(segments.map((element) => [element.props.children, element.props.fg]), [
      ["Peak (3x)", "#ff0000"],
      [" / ", "#888888"],
      ["stale", "#ffaa00"],
    ])
    assert.equal(text.some((element) => element.props.children === "~stale"), false)
  } finally {
    dispose()
  }
})
