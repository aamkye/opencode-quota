import type {
  TuiLspEntry,
  TuiLspKnownStatus,
  TuiPluginApi,
} from "@opencode-ai/plugin/tui"

type Equal<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends
  (<Value>() => Value extends Right ? 1 : 2) ? true : false
type Expect<Value extends true> = Value

export type LspStateIsReadonly = Expect<Equal<
  ReturnType<TuiPluginApi["state"]["lsp"]>,
  readonly TuiLspEntry[]
>>

export const knownStatuses: readonly TuiLspKnownStatus[] = ["connected", "error"]
export const futureStatus: TuiLspEntry["status"] = "future_status"

export function inspectLsp(api: TuiPluginApi) {
  return api.state.lsp().map((entry) => ({
    id: entry.id,
    name: entry.name,
    root: entry.root,
    status: entry.status,
  }))
}
