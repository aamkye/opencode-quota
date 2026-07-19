import type { Event } from "@opencode-ai/sdk/v2"

import type { SubagentSnapshot, SubagentSnapshotLoader } from "./subagent-snapshot.js"

export type RetainedFailures = Record<string, Record<string, number>>

export type SubagentSourceState =
  | { phase: "loading"; parentID: string }
  | { phase: "unavailable"; parentID: string }
  | {
    phase: "ready"
    parentID: string
    snapshot: SubagentSnapshot
    failureTimes: Readonly<Record<string, number>>
  }
  | {
    phase: "stale"
    parentID: string
    snapshot: SubagentSnapshot
    failureTimes: Readonly<Record<string, number>>
  }

export type SubagentRefreshEvent = Extract<Event, { type:
  | "session.created"
  | "session.updated"
  | "session.deleted"
  | "session.status"
  | "session.idle"
  | "session.error"
  | "message.updated"
  | "message.removed"
  | "tui.session.select"
}>

export type SubagentEventRegistrar = <Type extends SubagentRefreshEvent["type"]>(
  type: Type,
  handler: (event: Extract<SubagentRefreshEvent, { type: Type }>) => void,
) => () => void

export type SubagentSourceDependencies = {
  loadSnapshot: SubagentSnapshotLoader
  onEvent: SubagentEventRegistrar
  loadFailures(): RetainedFailures
  saveFailures(value: RetainedFailures): void
  now(): number
  setTimer(callback: () => void, delayMs: number): unknown
  clearTimer(timer: unknown): void
}

export type SubagentSource = {
  state(): SubagentSourceState | undefined
  subscribe(listener: () => void): () => void
  setParentID(parentID: string): void
  dispose(): void
}

const RETRY_DELAYS_MS = [2_000, 4_000, 8_000] as const
const REFRESH_DEBOUNCE_MS = 200

function copyFailures(value: RetainedFailures): RetainedFailures {
  return Object.fromEntries(Object.entries(value).map(([parentID, failures]) => [
    parentID,
    { ...failures },
  ]))
}

export function createSubagentSource({
  loadSnapshot,
  onEvent,
  loadFailures,
  saveFailures,
  now,
  setTimer,
  clearTimer,
}: SubagentSourceDependencies): SubagentSource {
  let parentID = ""
  let generation = 0
  let currentState: SubagentSourceState | undefined
  let debounceTimer: unknown
  let loadController: AbortController | undefined
  let retainedFailures = copyFailures(loadFailures())
  let disposed = false
  const knownDirectChildIDs = new Set<string>()
  const listeners = new Set<() => void>()
  const retryTimers = new Set<unknown>()

  function notify(): void {
    for (const listener of [...listeners]) {
      try {
        listener()
      } catch {
        // Subscriber failures must not alter source state or refresh behavior.
      }
    }
  }

  function failureTimesFor(capturedParentID: string): Readonly<Record<string, number>> {
    return Object.freeze({ ...(retainedFailures[capturedParentID] ?? {}) })
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

  function isCurrent(
    capturedParentID: string,
    capturedGeneration: number,
    controller: AbortController,
  ): boolean {
    return !disposed
      && !controller.signal.aborted
      && parentID === capturedParentID
      && generation === capturedGeneration
      && loadController === controller
  }

  function isCurrentGeneration(capturedParentID: string, capturedGeneration: number): boolean {
    return !disposed && parentID === capturedParentID && generation === capturedGeneration
  }

  function replaceKnownChildIDs(childIDs: readonly string[]): void {
    knownDirectChildIDs.clear()
    for (const childID of childIDs) knownDirectChildIDs.add(childID)
  }

  function persistFailures(): void {
    saveFailures(copyFailures(retainedFailures))
  }

  function pruneFailures(capturedParentID: string, childIDs: readonly string[]): void {
    const existing = retainedFailures[capturedParentID]
    if (!existing) return
    const childIDSet = new Set(childIDs)
    const pruned = Object.fromEntries(
      Object.entries(existing).filter(([childID]) => childIDSet.has(childID)),
    )
    if (Object.keys(pruned).length === Object.keys(existing).length) return

    retainedFailures = { ...retainedFailures }
    if (Object.keys(pruned).length === 0) delete retainedFailures[capturedParentID]
    else retainedFailures[capturedParentID] = pruned
    persistFailures()
  }

  async function attemptLoad(
    capturedParentID: string,
    capturedGeneration: number,
    attempt: number,
    controller: AbortController,
  ): Promise<void> {
    if (!isCurrent(capturedParentID, capturedGeneration, controller)) return
    try {
      const snapshot = await loadSnapshot(capturedParentID, {
        signal: controller.signal,
        onChildIDs(childIDs) {
          if (!isCurrent(capturedParentID, capturedGeneration, controller)) return
          replaceKnownChildIDs(childIDs)
        },
      })
      if (!isCurrent(capturedParentID, capturedGeneration, controller)) return
      replaceKnownChildIDs(snapshot.childIDs)
      pruneFailures(capturedParentID, snapshot.childIDs)
      if (!isCurrent(capturedParentID, capturedGeneration, controller)) return
      currentState = {
        phase: "ready",
        parentID: capturedParentID,
        snapshot,
        failureTimes: failureTimesFor(capturedParentID),
      }
      notify()
    } catch {
      if (!isCurrent(capturedParentID, capturedGeneration, controller)) return
      const retryDelay = RETRY_DELAYS_MS[attempt]
      if (retryDelay !== undefined) {
        let timer: unknown
        timer = setTimer(() => {
          retryTimers.delete(timer)
          if (!isCurrent(capturedParentID, capturedGeneration, controller)) return
          void attemptLoad(capturedParentID, capturedGeneration, attempt + 1, controller)
        }, retryDelay)
        retryTimers.add(timer)
        return
      }

      if (currentState?.parentID !== capturedParentID) return
      if (currentState.phase === "ready" || currentState.phase === "stale") {
        currentState = {
          phase: "stale",
          parentID: capturedParentID,
          snapshot: currentState.snapshot,
          failureTimes: failureTimesFor(capturedParentID),
        }
      } else {
        currentState = { phase: "unavailable", parentID: capturedParentID }
      }
      notify()
    }
  }

  function startRefresh(capturedParentID: string, capturedGeneration: number): void {
    if (!isCurrentGeneration(capturedParentID, capturedGeneration)) return
    loadController = new AbortController()
    void attemptLoad(capturedParentID, capturedGeneration, 0, loadController)
  }

  function invalidate(): number {
    loadController?.abort()
    loadController = undefined
    generation += 1
    clearRetryTimers()
    return generation
  }

  function markStale(): void {
    if (currentState?.parentID !== parentID) return
    if (currentState.phase !== "ready" && currentState.phase !== "stale") return
    currentState = {
      phase: "stale",
      parentID,
      snapshot: currentState.snapshot,
      failureTimes: failureTimesFor(parentID),
    }
    notify()
  }

  function scheduleRefresh(capturedParentID: string, capturedGeneration: number): void {
    if (!isCurrentGeneration(capturedParentID, capturedGeneration)) return
    if (debounceTimer !== undefined) clearTimer(debounceTimer)
    let timer: unknown
    timer = setTimer(() => {
      if (debounceTimer === timer) debounceTimer = undefined
      startRefresh(capturedParentID, capturedGeneration)
    }, REFRESH_DEBOUNCE_MS)
    debounceTimer = timer
  }

  function invalidateAndSchedule(): void {
    if (disposed || parentID === "") return
    const capturedParentID = parentID
    const capturedGeneration = invalidate()
    markStale()
    scheduleRefresh(capturedParentID, capturedGeneration)
  }

  function recordFailure(childID: string): void {
    const capturedParentID = parentID
    const capturedGeneration = invalidate()
    const existing = retainedFailures[capturedParentID] ?? {}
    if (!(childID in existing)) {
      const failureTime = now()
      if (!isCurrentGeneration(capturedParentID, capturedGeneration)) return
      retainedFailures = {
        ...retainedFailures,
        [capturedParentID]: { ...existing, [childID]: failureTime },
      }
      persistFailures()
      if (!isCurrentGeneration(capturedParentID, capturedGeneration)) return
    }
    markStale()
    scheduleRefresh(capturedParentID, capturedGeneration)
  }

  function known(childID: string | undefined): boolean {
    return childID !== undefined && knownDirectChildIDs.has(childID)
  }

  const unsubscribers = [
    onEvent("session.created", (event) => {
      if (event.properties.info.parentID === parentID) invalidateAndSchedule()
    }),
    onEvent("session.updated", (event) => {
      if (
        known(event.properties.sessionID)
        || known(event.properties.info.id)
        || event.properties.info.parentID === parentID
      ) invalidateAndSchedule()
    }),
    onEvent("session.deleted", (event) => {
      if (known(event.properties.sessionID) || known(event.properties.info.id)) invalidateAndSchedule()
    }),
    onEvent("session.status", (event) => {
      if (known(event.properties.sessionID)) invalidateAndSchedule()
    }),
    onEvent("session.idle", (event) => {
      if (known(event.properties.sessionID)) invalidateAndSchedule()
    }),
    onEvent("session.error", (event) => {
      const childID = event.properties.sessionID
      if (childID !== undefined && known(childID)) recordFailure(childID)
    }),
    onEvent("message.updated", (event) => {
      if (known(event.properties.sessionID)) invalidateAndSchedule()
    }),
    onEvent("message.removed", (event) => {
      if (known(event.properties.sessionID)) invalidateAndSchedule()
    }),
    onEvent("tui.session.select", (event) => {
      if (event.properties.sessionID !== "") setParentID(event.properties.sessionID)
    }),
  ]

  function setParentID(nextParentID: string): void {
    if (disposed || nextParentID === parentID) return
    loadController?.abort()
    loadController = undefined
    generation += 1
    clearTimers()
    knownDirectChildIDs.clear()
    parentID = nextParentID
    if (nextParentID === "") {
      currentState = undefined
      notify()
      return
    }

    currentState = { phase: "loading", parentID: nextParentID }
    notify()
    startRefresh(nextParentID, generation)
  }

  return {
    state: () => currentState,
    subscribe(listener) {
      if (disposed) return () => {}
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    setParentID,
    dispose() {
      if (disposed) return
      disposed = true
      loadController?.abort()
      loadController = undefined
      generation += 1
      clearTimers()
      for (const unsubscribe of unsubscribers) {
        try {
          unsubscribe()
        } catch {
          // Cleanup of one event source must not prevent the remaining cleanup.
        }
      }
      listeners.clear()
    },
  }
}
