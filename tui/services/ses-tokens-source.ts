import type { Event } from "@opencode-ai/sdk/v2"

import type { SessionTreeSnapshot, SessionTreeSnapshotLoader } from "./session-tree-snapshot.js"

export type SesTokensSourceState =
  | { phase: "loading"; sessionID: string }
  | { phase: "unavailable"; sessionID: string }
  | { phase: "ready"; sessionID: string; snapshot: SessionTreeSnapshot }
  | { phase: "stale"; sessionID: string; snapshot: SessionTreeSnapshot }

export type SesTokensRefreshEvent = Extract<Event, { type:
  | "message.updated"
  | "message.removed"
  | "session.created"
  | "session.updated"
  | "session.deleted"
  | "tui.session.select"
}>

export type SesTokensEventRegistrar = <Type extends SesTokensRefreshEvent["type"]>(
  type: Type,
  handler: (event: Extract<SesTokensRefreshEvent, { type: Type }>) => void,
) => () => void

export type SesTokensSourceDependencies = {
  loadSnapshot: SessionTreeSnapshotLoader
  onEvent: SesTokensEventRegistrar
  setTimer(callback: () => void, delayMs: number): unknown
  clearTimer(timer: unknown): void
}

export type SesTokensSource = {
  state(): SesTokensSourceState | undefined
  subscribe(listener: () => void): () => void
  setSessionID(sessionID: string): void
  dispose(): void
}

const RETRY_DELAYS_MS = [2_000, 4_000, 8_000] as const
const REFRESH_DEBOUNCE_MS = 200

export function createSesTokensSource({
  loadSnapshot,
  onEvent,
  setTimer = (callback, delayMs) => globalThis.setTimeout(callback, delayMs),
  clearTimer = (timer) => globalThis.clearTimeout(timer as ReturnType<typeof globalThis.setTimeout>),
}: SesTokensSourceDependencies): SesTokensSource {
  let sessionID = ""
  let generation = 0
  let currentState: SesTokensSourceState | undefined
  let debounceTimer: unknown
  let disposed = false
  const knownSessionIDs = new Set<string>()
  const listeners = new Set<() => void>()
  const retryTimers = new Set<unknown>()

  function notify(): void {
    for (const listener of listeners) listener()
  }

  function clearRetryTimers(): void {
    for (const timer of retryTimers) clearTimer(timer)
    retryTimers.clear()
  }

  function clearTimers(): void {
    if (debounceTimer !== undefined) {
      clearTimer(debounceTimer)
      debounceTimer = undefined
    }
    clearRetryTimers()
  }

  function isCurrent(capturedSessionID: string, capturedGeneration: number): boolean {
    return !disposed && sessionID === capturedSessionID && generation === capturedGeneration
  }

  async function attemptLoad(
    capturedSessionID: string,
    capturedGeneration: number,
    attempt: number,
  ): Promise<void> {
    if (!isCurrent(capturedSessionID, capturedGeneration)) return
    try {
      const snapshot = await loadSnapshot(capturedSessionID)
      if (!isCurrent(capturedSessionID, capturedGeneration)) return
      knownSessionIDs.clear()
      for (const id of snapshot.sessionIDs) knownSessionIDs.add(id)
      currentState = { phase: "ready", sessionID: capturedSessionID, snapshot }
      notify()
    } catch {
      if (!isCurrent(capturedSessionID, capturedGeneration)) return
      const retryDelay = RETRY_DELAYS_MS[attempt]
      if (retryDelay !== undefined) {
        let timer: unknown
        timer = setTimer(() => {
          retryTimers.delete(timer)
          if (!isCurrent(capturedSessionID, capturedGeneration)) return
          void attemptLoad(capturedSessionID, capturedGeneration, attempt + 1)
        }, retryDelay)
        retryTimers.add(timer)
        return
      }

      if (currentState?.sessionID !== capturedSessionID) return
      if (currentState.phase === "ready" || currentState.phase === "stale") {
        currentState = {
          phase: "stale",
          sessionID: capturedSessionID,
          snapshot: currentState.snapshot,
        }
      } else {
        currentState = { phase: "unavailable", sessionID: capturedSessionID }
      }
      notify()
    }
  }

  function startRefresh(): void {
    generation += 1
    clearRetryTimers()
    void attemptLoad(sessionID, generation, 0)
  }

  function scheduleRefresh(): void {
    if (disposed || sessionID === "") return
    if (debounceTimer !== undefined) clearTimer(debounceTimer)
    debounceTimer = setTimer(() => {
      debounceTimer = undefined
      if (disposed || sessionID === "") return
      startRefresh()
    }, REFRESH_DEBOUNCE_MS)
  }

  function hasKnownSessionID(...ids: (string | undefined)[]): boolean {
    return ids.some((id) => id !== undefined && knownSessionIDs.has(id))
  }

  const unsubscribers = [
    onEvent("message.updated", (event) => {
      if (hasKnownSessionID(event.properties.sessionID)) scheduleRefresh()
    }),
    onEvent("message.removed", (event) => {
      if (hasKnownSessionID(event.properties.sessionID)) scheduleRefresh()
    }),
    onEvent("session.created", (event) => {
      if (hasKnownSessionID(
        event.properties.info.id,
        event.properties.sessionID,
        event.properties.info.parentID,
      )) scheduleRefresh()
    }),
    onEvent("session.updated", (event) => {
      if (hasKnownSessionID(
        event.properties.info.id,
        event.properties.sessionID,
        event.properties.info.parentID,
      )) scheduleRefresh()
    }),
    onEvent("session.deleted", (event) => {
      if (hasKnownSessionID(event.properties.info.id, event.properties.sessionID)) scheduleRefresh()
    }),
    onEvent("tui.session.select", (event) => {
      if (event.properties.sessionID !== "" && event.properties.sessionID !== sessionID) {
        setSessionID(event.properties.sessionID)
      }
    }),
  ]

  function setSessionID(nextSessionID: string): void {
    if (disposed || nextSessionID === sessionID) return
    generation += 1
    clearTimers()
    sessionID = nextSessionID
    knownSessionIDs.clear()
    if (nextSessionID === "") {
      currentState = undefined
      notify()
      return
    }

    knownSessionIDs.add(nextSessionID)
    currentState = { phase: "loading", sessionID: nextSessionID }
    notify()
    void attemptLoad(nextSessionID, generation, 0)
  }

  return {
    state: () => currentState,
    subscribe(listener) {
      if (disposed) return () => {}
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    setSessionID,
    dispose() {
      if (disposed) return
      disposed = true
      generation += 1
      clearTimers()
      for (const unsubscribe of unsubscribers) unsubscribe()
      listeners.clear()
    },
  }
}
