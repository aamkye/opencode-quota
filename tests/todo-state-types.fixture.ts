import type { Todo } from "@opencode-ai/sdk/v2"
import type { TuiPluginApi } from "@opencode-ai/plugin/tui"

type Equal<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends
  (<Value>() => Value extends Right ? 1 : 2) ? true : false
type Expect<Value extends true> = Value

export type TodoStateIsReadonlySdkTodo = Expect<Equal<
  ReturnType<TuiPluginApi["state"]["session"]["todo"]>,
  readonly Todo[]
>>

export type TodoStateRequiresSessionID = Expect<Equal<
  Parameters<TuiPluginApi["state"]["session"]["todo"]>,
  [sessionID: string]
>>

export function inspectTodoState(api: TuiPluginApi, sessionID: string): readonly Todo[] {
  return api.state.session.todo(sessionID)
}
