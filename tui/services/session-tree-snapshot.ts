import type { Message, Session } from "@opencode-ai/sdk/v2"

export type SessionTreeRecord = Pick<Session, "id" | "parentID">

export type SessionTreeSnapshot = {
  sessionIDs: readonly string[]
  messages: readonly Message[]
}

export type SessionTreeSnapshotLoader = (rootSessionID: string) => Promise<SessionTreeSnapshot>

export type LoadSessionTreeSnapshotOptions = {
  rootSessionID: string
  listSessions(): Promise<readonly SessionTreeRecord[]>
  listMessages(sessionID: string): Promise<readonly Message[]>
  concurrency?: number
}

export function indexSessionsByParent(
  sessions: readonly SessionTreeRecord[],
): ReadonlyMap<string, readonly SessionTreeRecord[]> {
  const byParent = new Map<string, SessionTreeRecord[]>()
  for (const session of sessions) {
    if (session.parentID === undefined) continue
    const children = byParent.get(session.parentID)
    if (children) children.push(session)
    else byParent.set(session.parentID, [session])
  }
  return byParent
}

export function collectSessionTreeIDs(
  rootSessionID: string,
  byParent: ReadonlyMap<string, readonly SessionTreeRecord[]>,
): string[] {
  const sessionIDs = [rootSessionID]
  const visited = new Set(sessionIDs)
  for (let cursor = 0; cursor < sessionIDs.length; cursor += 1) {
    for (const child of byParent.get(sessionIDs[cursor]) ?? []) {
      if (visited.has(child.id)) continue
      visited.add(child.id)
      sessionIDs.push(child.id)
    }
  }
  return sessionIDs
}

export async function loadSessionTreeSnapshot(
  options: LoadSessionTreeSnapshotOptions,
): Promise<SessionTreeSnapshot> {
  const sessions = await options.listSessions()
  const sessionIDs = collectSessionTreeIDs(options.rootSessionID, indexSessionsByParent(sessions))
  const requestedConcurrency = options.concurrency ?? 4
  const concurrency = Number.isFinite(requestedConcurrency) && requestedConcurrency > 0
    ? Math.min(4, Math.max(1, Math.floor(requestedConcurrency)))
    : 4
  const messagesBySession: (readonly Message[])[] = new Array(sessionIDs.length)
  let cursor = 0

  async function worker(): Promise<void> {
    while (cursor < sessionIDs.length) {
      const index = cursor
      cursor += 1
      messagesBySession[index] = await options.listMessages(sessionIDs[index])
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, sessionIDs.length) },
    () => worker(),
  )
  await Promise.all(workers)
  return { sessionIDs, messages: messagesBySession.flat() }
}
