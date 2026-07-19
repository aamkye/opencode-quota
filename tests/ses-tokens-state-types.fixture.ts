import type { Message, Session } from "@opencode-ai/sdk/v2"
import type { TuiPluginApi } from "@opencode-ai/plugin/tui"

type Equal<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends
  (<Value>() => Value extends Right ? 1 : 2) ? true : false
type Expect<Value extends true> = Value
type IsAny<Value> = 0 extends (1 & Value) ? true : false

type SidebarCallback = Parameters<TuiPluginApi["slots"]["register"]>[0]["slots"][string]
type SidebarProps = Parameters<SidebarCallback>[1]

export type SidebarPropsAreNotAny = Expect<Equal<IsAny<SidebarProps>, false>>
export type SidebarPropsAreExactlyOptionalSessionID = Expect<Equal<
  SidebarProps,
  { session_id?: string }
>>

export async function inspectSesTokensApi(api: TuiPluginApi, sessionID: string) {
  const directory: string = api.state.path.directory
  const sessions = await api.client.session.list({ directory })
  const messages = await api.client.session.messages({ sessionID, directory })
  const sessionsDataIsExact: Expect<Equal<
    typeof sessions.data,
    readonly Session[] | undefined
  >> = true
  const messagesDataIsExact: Expect<Equal<
    typeof messages.data,
    readonly { info: Message }[] | undefined
  >> = true
  void sessionsDataIsExact
  void messagesDataIsExact
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
      sidebar_content(_ctx, props) {
        return props.session_id ? null : null
      },
    },
  })
  return {
    directory,
    sessions: sessions.data,
    messages: messages.data,
    unregister,
  }
}
