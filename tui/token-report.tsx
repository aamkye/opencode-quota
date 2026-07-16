import type { TuiCommand, TuiPluginApi, TuiPluginModule } from "@opencode-ai/plugin/tui"

import {
  computeTokenReport,
  renderTokenReport,
  TOKEN_REPORT_COMMANDS,
  type TokenReportCommandId,
} from "../shared/opencode-tools-shared.js"

const RANGE_MODE = "aamkye.token-report-range"

function sourceSessionID(api: TuiPluginApi): string | undefined {
  const route = api.route.current
  const sessionID = route.name === "session" ? route.params?.sessionID : undefined
  return typeof sessionID === "string" ? sessionID : undefined
}

async function persistReport(
  api: TuiPluginApi,
  sessionID: string,
  command: TokenReportCommandId,
  argumentsValue?: string,
): Promise<void> {
  let text: string
  try {
    text = renderTokenReport(await computeTokenReport({
      command,
      arguments: argumentsValue,
      sessionID,
    }))
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    text = `Token report failed: ${message}`
  }
  await api.client.session.prompt({
    path: { id: sessionID },
    body: { noReply: true, parts: [{ type: "text", text }] },
  })
}

export function tokenReportCommands(
  api: TuiPluginApi,
  setRangeDialogClose: (close: () => void) => void = () => {},
): TuiCommand[] {
  return TOKEN_REPORT_COMMANDS.map((spec) => ({
    name: `aamkye.${spec.id}`,
    title: spec.kind === "between" ? "Tokens used (Date Range)" : spec.title,
    namespace: "palette",
    slashName: spec.id,
    async run() {
      const sessionID = sourceSessionID(api)
      if (!sessionID) {
        api.ui.toast.show({ title: "Open a session to view token usage" })
        return
      }
      if (spec.id !== "tokens_between") {
        await persistReport(api, sessionID, spec.id)
        return
      }

      const popMode = api.mode.push(RANGE_MODE)
      let closed = false
      const close = () => {
        if (closed) return
        closed = true
        popMode()
        api.ui.dialog.clear()
      }
      setRangeDialogClose(close)
      api.ui.dialog.replace(
        () => api.ui.DialogPrompt({
          title: "Token report date range",
          placeholder: "YYYY-MM-DD YYYY-MM-DD",
          async onSubmit(value) {
            close()
            await persistReport(api, sessionID, spec.id, value)
          },
        }),
        close,
      )
    },
  }))
}

export function registerTokenReportTui(api: TuiPluginApi): void {
  let closeRangeDialog: (() => void) | undefined
  api.keymap.registerLayer({
    commands: tokenReportCommands(api, (close) => { closeRangeDialog = close }),
  })
  api.keymap.registerLayer({
    mode: RANGE_MODE,
    bindings: [{
      key: "escape",
      cmd: () => closeRangeDialog?.(),
      desc: "Cancel token report date range",
    }],
  })
}

const plugin: TuiPluginModule & { id: string } = {
  id: "aamkye/opencode-tools-token-report",
  async tui(api) {
    registerTokenReportTui(api)
  },
}

export default plugin
