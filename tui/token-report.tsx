import type { TuiCommand, TuiPluginApi, TuiPluginModule, TuiRoute } from "@opencode-ai/plugin/tui"
import { createSignal, onCleanup } from "solid-js"

import {
  computeTokenReport,
  TOKEN_REPORT_COMMANDS,
  type TokenReportCommandId,
} from "../shared/opencode-tools-shared.js"
import { renderTokenReport } from "../lib/tokens/token-report-presenter.js"

export type TokenReportRouteParams = {
  command: TokenReportCommandId
  arguments?: string
  sessionID?: string
}

const ROUTE_NAME = "aamkye.token-report"
const REPORT_MODE = "aamkye.token-report"

function sourceSessionID(api: TuiPluginApi): string | undefined {
  const route = api.route.current
  const sessionID = route.name === "session" ? route.params?.sessionID : undefined
  return typeof sessionID === "string" ? sessionID : undefined
}

function navigateToReport(api: TuiPluginApi, command: TokenReportCommandId, argumentsValue?: string): void {
  const sessionID = sourceSessionID(api)
  const params: TokenReportRouteParams = { command }
  if (argumentsValue) params.arguments = argumentsValue
  if (sessionID) params.sessionID = sessionID
  api.route.navigate(ROUTE_NAME, params)
}

function TokenReportText(props: { text: () => string }) {
  return <text>{props.text()}</text>
}

export function tokenReportCommands(api: TuiPluginApi): TuiCommand[] {
  return TOKEN_REPORT_COMMANDS.map((spec) => ({
    name: `aamkye.${spec.id}`,
    title: spec.kind === "between" ? "Tokens used (Date Range)" : spec.title,
    namespace: "palette",
    slashName: spec.id,
    run() {
      if (spec.id !== "tokens_between") {
        navigateToReport(api, spec.id)
        return
      }

      api.ui.dialog.replace(
        () => api.ui.DialogPrompt({
          title: "Token report date range",
          placeholder: "YYYY-MM-DD YYYY-MM-DD",
          onSubmit(value) {
            api.ui.dialog.clear()
            navigateToReport(api, spec.id, value)
          },
        }),
        () => api.ui.dialog.clear(),
      )
    },
  }))
}

function TokenReportRoute(props: { api: TuiPluginApi }) {
  const popMode = props.api.mode.push(REPORT_MODE)
  onCleanup(popMode)
  const [text, setText] = createSignal("Loading token report...")
  const params = props.api.route.current.params as TokenReportRouteParams | undefined

  void computeTokenReport({
    command: params?.command ?? "tokens_today",
    arguments: params?.arguments,
    sessionID: params?.sessionID,
  }).then((data) => setText(renderTokenReport(data))).catch((error) => {
    const message = error instanceof Error ? error.message : String(error)
    setText(`Token report failed: ${message}`)
  })

  return (
    <box width="100%" flexDirection="column" overflow="hidden">
      <TokenReportText text={text} />
    </box>
  )
}

function tokenReportRoute(api: TuiPluginApi): TuiRoute {
  return {
    name: ROUTE_NAME,
    render: () => <TokenReportRoute api={api} />,
  }
}

export function registerTokenReportTui(api: TuiPluginApi): void {
  api.keymap.registerLayer({ commands: tokenReportCommands(api) })
  api.keymap.registerLayer({
    mode: REPORT_MODE,
    bindings: [{
      key: "escape",
      cmd: () => {
        const sessionID = api.route.current.params?.sessionID
        api.route.navigate(typeof sessionID === "string" ? "session" : "home", typeof sessionID === "string" ? { sessionID } : undefined)
      },
      desc: "Close token report",
    }],
  })
  api.route.register([tokenReportRoute(api)])
}

const plugin: TuiPluginModule & { id: string } = {
  id: "aamkye/opencode-tools-token-report",
  async tui(api) {
    registerTokenReportTui(api)
  },
}

export default plugin
