export type OpenCodeGoOptions = {
  workspaceId?: string
  workspaceToken?: string
}

export type OpenCodeGoConfig = Readonly<{
  workspaceId: string
  workspaceToken: string
}>

const WORKSPACE_ID = /^wrk_[A-Za-z0-9]+$/

export function normalizeOpenCodeGoConfig(value: unknown): OpenCodeGoConfig | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  const input = value as OpenCodeGoOptions
  const workspaceId = typeof input.workspaceId === "string" ? input.workspaceId.trim() : ""
  const workspaceToken = typeof input.workspaceToken === "string" ? input.workspaceToken.trim() : ""
  if (!WORKSPACE_ID.test(workspaceId) || !workspaceToken || /[\r\n]/u.test(workspaceToken)) return null
  return Object.freeze({ workspaceId, workspaceToken })
}
