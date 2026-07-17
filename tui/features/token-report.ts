import type { TuiPluginApi } from "@opencode-ai/plugin/tui";

import { computeTokenReport } from "../../lib/tokens/token-report-data.js";
import { renderTokenReport } from "../../lib/tokens/token-report-presenter.js";
import type { TokenReportCommandId } from "../../lib/tokens/token-commands.js";

export function activeSessionID(api: TuiPluginApi): string | undefined {
  const route = api.route.current;
  const sessionID = route.name === "session" ? route.params?.sessionID : undefined;
  return typeof sessionID === "string" ? sessionID : undefined;
}

export async function persistTokenReport(
  api: TuiPluginApi,
  sessionID: string,
  command: TokenReportCommandId,
  argumentsValue?: string,
): Promise<void> {
  let text: string;
  try {
    text = renderTokenReport(await computeTokenReport({
      command,
      arguments: argumentsValue,
      sessionID,
    }));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    text = `Token report failed: ${message}`;
  }
  try {
    await api.client.session.prompt({
      path: { id: sessionID },
      body: { noReply: true, parts: [{ type: "text", text }] },
    });
  } catch {
    api.ui.toast({ message: "Unable to save token report" });
  }
}
