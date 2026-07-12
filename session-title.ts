import type { Hooks, PluginInput } from "@opencode-ai/plugin"
import { createSessionTitleHooks } from "./lib/session-title"

async function server(input: PluginInput): Promise<Hooks> {
  return createSessionTitleHooks(input.client)
}

export default {
  id: "aamkye/session-title",
  server,
}
