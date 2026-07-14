import { createStore } from "solid-js/store"

import { createQuotaSelection } from "../tui/quota.js"

type HostMessage = {
  id: string
  role: string
  model?: {
    providerID?: string
    modelID?: string
  }
}

type HostProvider = {
  id: string
  key?: string
}

export function createQuotaSelectionHost(input: {
  provider: readonly HostProvider[]
  messages: Record<string, readonly HostMessage[]>
  disposeRegistrationError?: Error
}) {
  const [state, setState] = createStore({
    provider: [...input.provider],
    messages: Object.fromEntries(Object.entries(input.messages).map(([id, messages]) => [id, [...messages]])),
    unreadableMessages: false,
  })
  const controller = new AbortController()
  let cleanup: (() => void | Promise<void>)[] = []
  let disposed = false
  let providerReads = 0

  const api = {
    state: {
      get provider() {
        providerReads += 1
        return state.provider
      },
      session: {
        messages(sessionID: string) {
          if (state.unreadableMessages) throw new Error("messages unavailable")
          return state.messages[sessionID] ?? []
        },
      },
      part: () => [],
    },
    lifecycle: {
      signal: controller.signal,
      onDispose(fn: () => void | Promise<void>) {
        if (input.disposeRegistrationError) throw input.disposeRegistrationError
        if (disposed) return () => undefined
        cleanup.push(fn)
        return () => {
          cleanup = cleanup.filter((candidate) => candidate !== fn)
        }
      },
    },
    kv: { get: () => undefined, set: () => undefined },
    theme: { current: { error: "error", warning: "warning", success: "success", text: "text", textMuted: "muted" } },
    slots: { register: () => undefined },
  } as unknown as Parameters<typeof createQuotaSelection>[0]

  return {
    api,
    lifecycleCount: () => cleanup.length,
    providerReadCount: () => providerReads,
    setMessages(sessionID: string, messages: readonly HostMessage[]) {
      setState("messages", sessionID, [...messages])
    },
    setProvider(provider: readonly HostProvider[]) {
      setState("provider", [...provider])
    },
    setUnreadableMessages(unreadable: boolean) {
      setState("unreadableMessages", unreadable)
    },
    async dispose() {
      if (disposed) return
      disposed = true
      controller.abort()
      const queue = cleanup.reverse()
      cleanup = []
      for (const fn of queue) await fn()
    },
  }
}

export function mountQuotaSelection(...args: Parameters<typeof createQuotaSelection>) {
  const selection = createQuotaSelection(...args)
  return {
    ...selection,
    renderSidebar(sessionID: string) {
      selection.setSessionID(sessionID)
      for (const provider of args[1]) provider.setSessionID(sessionID)
    },
  }
}
