import { PanelRenderer } from "../tui/presentation/renderer.js"
import { createRoot, createSignal } from "solid-js"

type MountedElement = {
  type: string | ((props: Record<string, unknown>) => unknown)
  props: Record<string, unknown>
}

function isElement(value: unknown): value is MountedElement {
  return typeof value === "object" && value !== null && "type" in value && "props" in value
}

function expand(value: unknown): unknown[] {
  if (typeof value === "function") return expand(value())
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
  options: { initiallyCollapsed?: boolean; initiallyCollapsedGroupIds?: readonly string[]; resetKey?: string } = {},
) {
  let tree: unknown
  let dispose: () => void = () => undefined
  let updateResetKey = (_value?: string) => undefined as string | undefined
  let readResetKey = () => options.resetKey
  createRoot((cleanup) => {
    dispose = cleanup
    const [resetKey, setResetKey] = createSignal(options.resetKey)
    readResetKey = resetKey
    updateResetKey = (value) => setResetKey(value)
    tree = PanelRenderer({
      model: () => model,
      theme: () => ({ error: "#ff0000", warning: "#ffaa00", success: "#00ff00", text: "#ffffff", textMuted: "#888888" }),
      initiallyCollapsed: options.initiallyCollapsed,
      initiallyCollapsedGroupIds: options.initiallyCollapsedGroupIds,
      resetKey,
    })
  })

  try {
    const readElements = () => expand(tree).filter(isElement)
    return { get elements() { return readElements() }, readElements, resetKey: readResetKey, setResetKey: updateResetKey, dispose }
  } catch (error) {
    dispose()
    throw error
  }
}
