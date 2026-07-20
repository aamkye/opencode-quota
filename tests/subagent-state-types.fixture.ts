import type { Message, Session, SessionStatus } from "@opencode-ai/sdk/v2"
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

export async function inspectSubagentApi(api: TuiPluginApi, sessionID: string) {
  const directory: string = api.state.path.directory
  const status: SessionStatus | undefined = api.state.session.status(sessionID)
  const sessions: readonly Session[] | undefined = (
    await api.client.session.list({ directory })
  ).data
  const messages: readonly { info: Message }[] | undefined = (
    await api.client.session.messages({ sessionID, directory })
  ).data
  api.route.navigate("session", { sessionID })
  api.kv.set("subagent-test", api.kv.get<Record<string, number>>("subagent-test", {}))
  api.lifecycle.onDispose(() => undefined)

  const unregister = [
    api.event.on("session.created", (event) => event.properties.info.parentID),
    api.event.on("session.updated", (event) => event.properties.info.id),
    api.event.on("session.deleted", (event) => event.properties.sessionID),
    api.event.on("session.status", (event) => {
      const eventSessionID: string = event.properties.sessionID
      const eventStatus: SessionStatus = event.properties.status
      void eventSessionID
      void eventStatus
    }),
    api.event.on("session.idle", (event) => event.properties.sessionID),
    api.event.on("session.error", (event) => {
      const eventSessionID: string | undefined = event.properties.sessionID
      void eventSessionID
    }),
    api.event.on("message.updated", (event) => event.properties.info.id),
    api.event.on("message.removed", (event) => event.properties.sessionID),
    api.event.on("tui.session.select", (event) => event.properties.sessionID),
  ]

  api.slots.register({
    slots: {
      sidebar_content(_ctx, props) {
        return props.session_id ? null : null
      },
    },
  })

  return { directory, status, sessions, messages, unregister }
}
