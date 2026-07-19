import { createRoot, createSignal } from "solid-js"
import { createRenderer } from "solid-js/universal"

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
    if (!value.props.when) return expand(value.props.fallback)
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

type ReactiveNode = {
  type: string
  props: Record<string, unknown>
  children: ReactiveNode[]
  parent?: ReactiveNode
  text?: string
}

const reactiveRenderer = createRenderer<ReactiveNode>({
  createElement: (type: string) => ({ type, props: {}, children: [] }),
  createTextNode: (text: string) => ({ type: "#text", props: {}, children: [], text }),
  isTextNode: (node: ReactiveNode) => node.type === "#text",
  replaceText(node: ReactiveNode, text: string) {
    node.text = text
  },
  insertNode(parent: ReactiveNode, node: ReactiveNode, anchor?: ReactiveNode) {
    if (node.parent) {
      const previousIndex = node.parent.children.indexOf(node)
      if (previousIndex >= 0) node.parent.children.splice(previousIndex, 1)
    }
    const index = anchor ? parent.children.indexOf(anchor) : -1
    parent.children.splice(index >= 0 ? index : parent.children.length, 0, node)
    node.parent = parent
  },
  removeNode(parent: ReactiveNode, node: ReactiveNode) {
    const index = parent.children.indexOf(node)
    if (index >= 0) parent.children.splice(index, 1)
    node.parent = undefined
  },
  setProperty(node: ReactiveNode, name: string, value: unknown) {
    node.props[name] = value
  },
  getParentNode: (node: ReactiveNode) => node.parent,
  getFirstChild: (node: ReactiveNode) => node.children[0],
  getNextSibling(node: ReactiveNode) {
    if (!node.parent) return undefined
    return node.parent.children[node.parent.children.indexOf(node) + 1]
  },
})

export const reactiveCreateComponent = reactiveRenderer.createComponent
export const reactiveCreateElement = reactiveRenderer.createElement
export const reactiveCreateTextNode = reactiveRenderer.createTextNode
export const reactiveEffect = reactiveRenderer.effect
export const reactiveInsert = reactiveRenderer.insert
export const reactiveInsertNode = reactiveRenderer.insertNode
export const reactiveMemo = reactiveRenderer.memo
export const reactiveMergeProps = reactiveRenderer.mergeProps
export const reactiveSetProp = reactiveRenderer.setProp
export const reactiveSpread = reactiveRenderer.spread

export async function mountReactiveCompactPanel(detailValue: CompactPanelSummary) {
  const [detail, setDetail] = createSignal(detailValue)
  let panelMounts = 0
  const root: ReactiveNode = { type: "root", props: {}, children: [] }
  const dispose = reactiveRenderer.render(() => {
    panelMounts += 1
    return CompactPanel({
      title: "Quota",
      collapsed: false,
      get detail() {
        return detail()
      },
      onToggle: () => undefined,
      theme: () => theme,
      footerDivider: false,
      children: "Expanded content" as never,
    }) as never
  }, root)

  const textElements = () => {
    const elements: ReactiveNode[] = []
    const visit = (node: ReactiveNode) => {
      if (node.type === "text") elements.push(node)
      node.children.forEach(visit)
    }
    root.children.forEach(visit)
    return elements.map((node) => ({
      text: node.children.map((child) => child.text ?? "").join(""),
      fg: node.props.fg,
    }))
  }

  return {
    panelMounts: () => panelMounts,
    textElements,
    async setDetail(value: CompactPanelSummary) {
      setDetail(value)
      await Promise.resolve()
    },
    dispose,
  }
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
