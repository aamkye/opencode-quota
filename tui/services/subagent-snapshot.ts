import type { Message, Session, SessionStatus } from "@opencode-ai/sdk/v2"

export type SubagentChildSnapshot = {
  session: Pick<Session, "id" | "parentID" | "title" | "time">
  status: SessionStatus | undefined
  messages: readonly Message[]
}

export type SubagentSnapshot = {
  parentID: string
  childIDs: readonly string[]
  children: readonly SubagentChildSnapshot[]
}
