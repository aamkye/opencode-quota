import type { Message, Provider } from "@opencode-ai/sdk/v2"
import type { TuiPluginApi } from "@opencode-ai/plugin/tui"

type Equal<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends
  (<Value>() => Value extends Right ? 1 : 2) ? true : false
type Expect<Value extends true> = Value

export type ContextMessagesAreReadonlySdkMessages = Expect<Equal<
  ReturnType<TuiPluginApi["state"]["session"]["messages"]>,
  readonly Message[]
>>
export type ContextMessagesRequireSessionID = Expect<Equal<
  Parameters<TuiPluginApi["state"]["session"]["messages"]>,
  [sessionID: string]
>>
export type ContextProvidersAreReadonlySdkProviders = Expect<Equal<
  TuiPluginApi["state"]["provider"],
  readonly Provider[]
>>

export function inspectContextState(api: TuiPluginApi, sessionID: string) {
  return { messages: api.state.session.messages(sessionID), providers: api.state.provider }
}
