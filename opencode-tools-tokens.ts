import type { PluginInput, Hooks } from "@opencode-ai/plugin";
import {
  isTokenReportCommand,
  buildTokenReport,
  getCommandTitle,
  TOKEN_REPORT_COMMANDS,
} from "./lib/tokens/token-commands";

const HANDLED = Symbol.for("opencode-tools-tokens/command-handled");

async function server({ client }: PluginInput): Promise<Hooks> {
  const typedClient = client as any;

  return {
    config: async (cfg: any) => {
      cfg.command ??= {};
      for (const spec of TOKEN_REPORT_COMMANDS) {
        cfg.command[spec.id] ??= {
          template: `/${spec.id}`,
          description: getCommandTitle(spec.id),
        };
      }
    },

    async "command.execute.before"(input, _output) {
      const command = input.command.replace(/^\//, "");
      if (!isTokenReportCommand(command)) return;

      try {
        const report = await buildTokenReport({
          command,
          arguments: input.arguments,
          sessionID: input.sessionID,
        });

        await typedClient.session.prompt({
          path: { id: input.sessionID },
          body: {
            noReply: true,
            parts: [{ type: "text", text: report, ignored: true }],
          },
        });
      } catch (err) {
        if (err && typeof err === "object" && (err as any)[HANDLED]) throw err;

        const message = err instanceof Error ? err.message : String(err);
        try {
          await typedClient.session.prompt({
            path: { id: input.sessionID },
            body: {
              noReply: true,
              parts: [{ type: "text", text: `${getCommandTitle(command)} failed: ${message}`, ignored: true }],
            },
          });
        } catch {}
      }

      const abort = Object.create(Error.prototype);
      Object.defineProperties(abort, {
        [HANDLED]: { value: true },
        message: { value: "" },
        name: { value: "" },
        stack: { value: "" },
      });
      throw abort;
    },
  };
}

const plugin = {
  id: "aamkye/opencode-tools-tokens",
  server,
};

export default plugin;
