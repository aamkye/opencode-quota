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
  detail?: CompactPanelSummary
  summary?: CompactPanelSummary
  footerDivider?: boolean
} = {}) {
  let tree: unknown
  let collapsed = options.collapsed ?? false
  let elements: MountedElement[] = []
  let toggleCalls = 0
  let dispose: () => void = () => undefined
  const child = { type: "text", props: { children: "Expanded content beyond the parent width" } }

  const render = () => {
    tree = CompactPanel({
      title: "Quota",
      collapsed,
      detail: options.detail,
      summary: options.summary,
      onToggle: () => {
        toggleCalls += 1
      },
      theme: () => theme,
      footerDivider: options.footerDivider ?? false,
      children: child as never,
    })
    elements = expand(tree).filter(isElement)
  }

  createRoot((cleanup) => {
    dispose = cleanup
    render()
  })

  try {
    return {
      get elements() {
        return elements
      },
      rerender(next: { collapsed: boolean }) {
        collapsed = next.collapsed
        render()
      },
      toggleCalls: () => toggleCalls,
      dispose,
    }
  } catch (error) {
    dispose()
    throw error
  }
}
