import type { Hooks, PluginInput } from "@opencode-ai/plugin"
import { createSessionRenameHooks } from "./lib/session-rename"

async function server(input: PluginInput): Promise<Hooks> {
  return createSessionRenameHooks(input.client)
}

export default {
  id: "aamkye/session-rename",
  server,
}
