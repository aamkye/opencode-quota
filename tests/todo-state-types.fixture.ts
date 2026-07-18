import type { Todo } from "@opencode-ai/sdk/v2"
import type { TuiPluginApi } from "@opencode-ai/plugin/tui"

type TuiSidebarTodoItem = Pick<Todo, "content" | "status">

type Equal<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends
  (<Value>() => Value extends Right ? 1 : 2) ? true : false
type Expect<Value extends true> = Value

export type TodoStateIsReadonlySdkTodoProjection = Expect<Equal<
  ReturnType<TuiPluginApi["state"]["session"]["todo"]>,
  readonly TuiSidebarTodoItem[]
>>

export type TodoStateRequiresSessionID = Expect<Equal<
  Parameters<TuiPluginApi["state"]["session"]["todo"]>,
  [sessionID: string]
>>

export function inspectTodoState(api: TuiPluginApi, sessionID: string): readonly TuiSidebarTodoItem[] {
  return api.state.session.todo(sessionID)
}
