import { createRenderer } from "solid-js/universal"

export type HostNode = {
  type: string
  props: Record<string, unknown>
  children: HostNode[]
  parent?: HostNode
  removed: boolean
  width: number
  on(event: string, listener: (...args: unknown[]) => void): HostNode
  off(event: string, listener: (...args: unknown[]) => void): HostNode
  emit(event: string, ...args: unknown[]): boolean
  listenerCount(event: string): number
}

export function createHostNode(type: string): HostNode {
  const listeners = new Map<string, Set<(...args: unknown[]) => void>>()
  return {
    type,
    props: {},
    children: [],
    removed: false,
    width: 0,
    on(event, listener) {
      const eventListeners = listeners.get(event) ?? new Set()
      eventListeners.add(listener)
      listeners.set(event, eventListeners)
      return this
    },
    off(event, listener) {
      listeners.get(event)?.delete(listener)
      return this
    },
    emit(event, ...args) {
      const eventListeners = [...(listeners.get(event) ?? [])]
      for (const listener of eventListeners) listener(...args)
      return eventListeners.length > 0
    },
    listenerCount(event) {
      return listeners.get(event)?.size ?? 0
    },
  }
}

function removeFromParent(node: HostNode): void {
  if (!node.parent) return
  const index = node.parent.children.indexOf(node)
  if (index >= 0) node.parent.children.splice(index, 1)
  node.parent = undefined
}

function markRemoved(node: HostNode): void {
  node.removed = true
  for (const child of node.children) markRemoved(child)
}

const hostRenderer = createRenderer<HostNode>({
  createElement: createHostNode,
  createTextNode(value) {
    const node = createHostNode("#text")
    node.props.value = value
    return node
  },
  replaceText(node, value) {
    node.props.value = value
  },
  isTextNode: (node) => node.type === "#text",
  setProperty(node, name, value) {
    node.props[name] = value
  },
  insertNode(parent, node, anchor) {
    removeFromParent(node)
    node.parent = parent
    node.removed = false
    const index = anchor ? parent.children.indexOf(anchor) : -1
    if (index >= 0) parent.children.splice(index, 0, node)
    else parent.children.push(node)
  },
  removeNode(parent, node) {
    const index = parent.children.indexOf(node)
    if (index >= 0) parent.children.splice(index, 1)
    node.parent = undefined
    markRemoved(node)
  },
  getParentNode: (node) => node.parent,
  getFirstChild: (node) => node.children[0],
  getNextSibling(node) {
    if (!node.parent) return undefined
    return node.parent.children[node.parent.children.indexOf(node) + 1]
  },
})

export const {
  createComponent,
  createElement,
  createTextNode,
  effect,
  insert,
  insertNode,
  memo,
  mergeProps,
  render,
  setProp,
  spread,
  use,
} = hostRenderer
