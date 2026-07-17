import type { TuiMcpEntry, TuiMcpKnownStatus, TuiPluginApi } from "@opencode-ai/plugin/tui"

const known: TuiMcpKnownStatus[] = ["connected", "disabled", "failed", "needs_auth", "needs_client_registration"]
export const readMcp = (api: TuiPluginApi): readonly TuiMcpEntry[] => api.state.mcp()
export const statuses: readonly string[] = known
