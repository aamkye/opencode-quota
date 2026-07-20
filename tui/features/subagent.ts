import type { Message } from "@opencode-ai/sdk/v2"

import type { PanelTextSegment } from "../presentation/types.js"
import type { SubagentChildSnapshot, SubagentSnapshot } from "../services/subagent-snapshot.js"

export type SubagentStatus = "successful" | "running" | "failed"

export type SubagentEntry = {
  id: string
  title: string
  agent: string
  model: string
  status: SubagentStatus
  durationMs: number
  duration: string
}

export type SubagentPanelModel = {
  primary: readonly SubagentEntry[]
  rest: readonly SubagentEntry[]
  successful: number
  running: number
  failed: number
  summary: readonly PanelTextSegment[]
}

export type SubagentEntryRowAllocation = {
  disclosure: number
  title: number
  beforeDurationGap: number
  duration: number
}

function finite(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined
}

function normalizedCells(value: number): number {
  return Math.max(0, Math.floor(finite(value) ?? 0))
}

function newestMessage(messages: readonly Message[], role: Message["role"]): Message | undefined {
  let newest: Message | undefined
  let newestCreated = Number.NEGATIVE_INFINITY
  for (const message of messages) {
    if (message.role !== role) continue
    const created = finite(message.time?.created) ?? Number.NEGATIVE_INFINITY
    if (!newest || created > newestCreated) {
      newest = message
      newestCreated = created
    }
  }
  return newest
}

function identity(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined
}

function durationBetween(end: unknown, start: unknown): number {
  const finiteEnd = finite(end)
  const finiteStart = finite(start)
  if (finiteEnd === undefined || finiteStart === undefined) return 0
  return Math.max(0, Math.floor(finiteEnd - finiteStart))
}

function formatDuration(durationMs: number): string {
  const seconds = Math.floor(durationMs / 1_000)
  if (seconds >= 3_600) return `${Math.floor(seconds / 3_600)}h ${Math.floor((seconds % 3_600) / 60)}m`
  if (seconds >= 60) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
  return `${seconds}s`
}

export function allocateSubagentEntryRow(
  availableCells: number,
  durationCells: number,
): SubagentEntryRowAllocation {
  const available = normalizedCells(availableCells)
  const requestedDuration = normalizedCells(durationCells)
  const disclosure = Math.min(2, available)
  const remaining = available - disclosure
  const gap = disclosure > 0 && requestedDuration > 0 ? 2 : 0
  const duration = requestedDuration + gap <= remaining ? requestedDuration : 0
  const beforeDurationGap = duration > 0 ? gap : 0
  const title = remaining - beforeDurationGap - duration
  return { disclosure, title, beforeDurationGap, duration }
}

export function createSubagentPanelModel(
  snapshot: SubagentSnapshot,
  failureTimes: Readonly<Record<string, number>>,
  now: number,
): SubagentPanelModel {
  const direct = (snapshot.children
    .filter(({ session }) => session.parentID === snapshot.parentID) as SubagentChildSnapshot[] & {
      toSorted(compareFn: (left: SubagentChildSnapshot, right: SubagentChildSnapshot) => number): SubagentChildSnapshot[]
    })
    .toSorted((left, right) =>
      right.session.time.created - left.session.time.created
        || left.session.id.localeCompare(right.session.id))

  const entries = direct.map(({ session, status: synchronizedStatus, messages }) => {
    const newestAssistant = newestMessage(messages, "assistant")
    const newestUser = newestMessage(messages, "user")
    const assistant = newestAssistant?.role === "assistant" ? newestAssistant : undefined
    const user = newestUser?.role === "user" ? newestUser : undefined
    const errorTimes = messages
      .map((message) => message.role === "assistant" && message.error
        ? finite(message.time.completed ?? message.time.created)
        : undefined)
      .filter((value): value is number => value !== undefined)
    const hasRetainedFailure = Object.hasOwn(failureTimes, session.id)
    const retainedFailureTime = finite(failureTimes[session.id])
    const hasAssistantError = messages.some((message) => message.role === "assistant" && Boolean(message.error))
    const hasFailure = hasRetainedFailure || hasAssistantError
    const status: SubagentStatus = hasFailure
      ? "failed"
      : synchronizedStatus?.type === "busy" || synchronizedStatus?.type === "retry"
        ? "running"
        : synchronizedStatus?.type === "idle"
          ? "successful"
          : assistant?.time.completed !== undefined ? "successful" : "running"
    const failureTime = [retainedFailureTime, ...errorTimes]
      .filter((value): value is number => value !== undefined)
      .reduce<number | undefined>((earliest, value) => earliest === undefined ? value : Math.min(earliest, value), undefined)
    const durationMs = status === "successful"
      ? durationBetween(session.time.updated, session.time.created)
      : status === "failed"
        ? durationBetween(failureTime, session.time.created)
        : durationBetween(now, session.time.created)

    return {
      id: session.id,
      title: session.title,
      agent: identity(assistant?.agent) ?? identity(user?.agent) ?? "-",
      model: identity(assistant?.modelID) ?? identity(user?.model?.modelID) ?? "-",
      status,
      durationMs,
      duration: formatDuration(durationMs),
    }
  })
  const successful = entries.filter(({ status }) => status === "successful").length
  const running = entries.filter(({ status }) => status === "running").length
  const failed = entries.filter(({ status }) => status === "failed").length

  return {
    primary: entries.slice(0, 5),
    rest: entries.slice(5),
    successful,
    running,
    failed,
    summary: [
      { text: String(successful), status: "success" },
      { text: "/", status: "textMuted" },
      { text: String(running), status: "warning" },
      { text: "/", status: "textMuted" },
      { text: String(failed), status: "error" },
    ],
  }
}
