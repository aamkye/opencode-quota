import { createRoot } from "solid-js"

import { CompactPanel, type CompactPanelSummary, type PanelTheme } from "../tui/presentation/compact-panel.js"

type MountedElement = {
  type: string | ((props: Record<string, unknown>) => unknown)
  props: Record<string, unknown>
}

function isElement(value: unknown): value is MountedElement {
  return typeof value === "object" && value !== null && "type" in value && "props" in value
}

function expand(value: unknown): unknown[] {
  if (Array.isArray(value)) return value.flatMap(expand)
  if (!isElement(value)) return [value]
  if (typeof value.type === "string") return [value, ...expand(value.props.children)]

  if (value.type.name === "For") {
    const items = value.props.each as readonly unknown[]
    const render = value.props.children as (item: unknown, index: () => number) => unknown
    return items.flatMap((item, index) => expand(render(item, () => index)))
  }
  if (value.type.name === "Show") {
    if (!value.props.when) return []
    const render = value.props.children
    return expand(typeof render === "function" ? render(() => value.props.when) : render)
  }

  return expand(value.type(value.props))
}

const theme: PanelTheme = {
  error: "#ff0000",
  warning: "#ffaa00",
  success: "#00ff00",
  text: "#ffffff",
  textMuted: "#888888",
}

export function mountCompactPanel(options: {
  collapsed?: boolean
  summary?: CompactPanelSummary
  footerDivider?: boolean
} = {}) {
  let tree: unknown
  let toggleCalls = 0
  let dispose: () => void = () => undefined
  const child = { type: "text", props: { children: "Expanded content beyond the parent width" } }

  createRoot((cleanup) => {
    dispose = cleanup
    tree = CompactPanel({
      title: "Quota",
      collapsed: options.collapsed ?? false,
      summary: options.summary,
      onToggle: () => {
        toggleCalls += 1
      },
      theme: () => theme,
      footerDivider: options.footerDivider ?? false,
      children: child as never,
    })
  })

  try {
    return {
      elements: expand(tree).filter(isElement),
      toggleCalls: () => toggleCalls,
      dispose,
    }
  } catch (error) {
    dispose()
    throw error
  }
}
