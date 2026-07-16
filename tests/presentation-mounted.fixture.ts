import { PanelRenderer } from "../tui/presentation/renderer.js"
import { createRoot } from "solid-js"

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
    return items.flatMap((item, i) => expand(render(item, () => i)))
  }
  if (value.type.name === "Show") {
    if (!value.props.when) return []
    const render = value.props.children
    return expand(typeof render === "function" ? render(() => value.props.when) : render)
  }

  return expand(value.type(value.props))
}

export function mountPanel(
  model: Parameters<typeof PanelRenderer>[0]["model"] extends () => infer Model ? Model : never,
  options: { initiallyCollapsed?: boolean } = {},
) {
  let tree: unknown
  let dispose: () => void = () => undefined
  createRoot((cleanup) => {
    dispose = cleanup
    tree = PanelRenderer({
      model: () => model,
      theme: () => ({ error: "#ff0000", warning: "#ffaa00", success: "#00ff00", text: "#ffffff", textMuted: "#888888" }),
      initiallyCollapsed: options.initiallyCollapsed,
    })
  })

  try {
    return { elements: expand(tree).filter(isElement), dispose }
  } catch (error) {
    dispose()
    throw error
  }
}
