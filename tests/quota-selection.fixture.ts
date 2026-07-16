import { createStore } from "solid-js/store"
import type { TuiPluginApi } from "@opencode-ai/plugin/tui"

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

type HostMessageUpdatedEvent = {
  id: string
  type: "message.updated"
  properties: {
    sessionID: string
    info: HostMessage & { sessionID: string }
  }
}

export function typecheckMessageUpdatedEventContract(api: TuiPluginApi) {
  return api.event.on("message.updated", (event: HostMessageUpdatedEvent) => void event)
}

export function createQuotaSelectionHost(input: {
  provider: readonly HostProvider[]
  messages: Record<string, readonly HostMessage[]>
  disposeRegistrationError?: Error
}) {
  const messagesBySession = Object.fromEntries(Object.entries(input.messages).map(([id, items]) => [id, [...items]]))
  const [state, setState] = createStore({
    provider: [...input.provider],
    unreadableMessages: false,
  })
  const controller = new AbortController()
  const messageUpdatedListeners = new Set<(event: HostMessageUpdatedEvent) => void>()
  let cleanup: (() => void | Promise<void>)[] = []
  let disposed = false
  let messageReads = 0
  let providerReads = 0

  const api = {
    state: {
      get provider() {
        providerReads += 1
        return state.provider
      },
      session: {
        messages(sessionID: string) {
          messageReads += 1
          if (state.unreadableMessages) throw new Error("messages unavailable")
          return messagesBySession[sessionID] ?? []
        },
      },
      part: () => [],
    },
    event: {
      on(type: string, handler: (event: HostMessageUpdatedEvent) => void) {
        if (type !== "message.updated") return () => undefined
        messageUpdatedListeners.add(handler)
        return () => {
          messageUpdatedListeners.delete(handler)
        }
      },
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
    eventListenerCount: () => messageUpdatedListeners.size,
    lifecycleCount: () => cleanup.length,
    messageReadCount: () => messageReads,
    providerReadCount: () => providerReads,
    setMessages(sessionID: string, messages: readonly HostMessage[]) {
      messagesBySession[sessionID] = [...messages]
    },
    setProvider(provider: readonly HostProvider[]) {
      setState("provider", [...provider])
    },
    setUnreadableMessages(unreadable: boolean) {
      setState("unreadableMessages", unreadable)
    },
    emitMessageUpdated(sessionID: string, message?: HostMessage) {
      const info = message ?? messagesBySession[sessionID]?.at(-1) ?? { id: `event-${sessionID}`, role: "user" }
      for (const handler of messageUpdatedListeners) {
        handler({
          id: `message.updated:${info.id}`,
          type: "message.updated",
          properties: { sessionID, info: { ...info, sessionID } },
        })
      }
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
