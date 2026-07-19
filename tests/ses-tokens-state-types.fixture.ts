import type { Message, Session } from "@opencode-ai/sdk/v2"
import type { TuiPluginApi } from "@opencode-ai/plugin/tui"

export async function inspectSesTokensApi(api: TuiPluginApi, sessionID: string) {
  const directory: string = api.state.path.directory
  const sessions = await api.client.session.list({ directory })
  const messages = await api.client.session.messages({ sessionID, directory })
  const unregister = [
    api.event.on("message.updated", (event) => event.properties.info.role),
    api.event.on("message.removed", (event) => event.properties.sessionID),
    api.event.on("session.created", (event) => event.properties.info.parentID),
    api.event.on("session.updated", (event) => event.properties.info.id),
    api.event.on("session.deleted", (event) => event.properties.sessionID),
    api.event.on("tui.session.select", (event) => event.properties.sessionID),
  ]
  api.slots.register({
    slots: {
      sidebar_content(_ctx, props: { session_id?: string }) {
        return props.session_id ? null : null
      },
    },
  })
  return {
    directory,
    sessions: sessions.data as readonly Session[] | undefined,
    messages: messages.data as readonly { info: Message }[] | undefined,
    unregister,
  }
}
