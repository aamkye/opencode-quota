import {
  aggregateUsage,
  resolveSessionTree,
  SessionNotFoundError,
  type SessionTreeNode,
} from "./quota-stats";
import { formatQuotaStatsReport } from "./quota-stats-format";
import { renderCommandHeading } from "./format-utils";
import {
  parseQuotaBetweenArgs,
  startOfLocalDayMs,
  startOfNextLocalDayMs,
  formatYmd,
  type Ymd,
} from "./command-parsing";

export type TokenReportCommandId =
  | "tokens_today"
  | "tokens_daily"
  | "tokens_weekly"
  | "tokens_monthly"
  | "tokens_all"
  | "tokens_session"
  | "tokens_session_all"
  | "tokens_between";

type TokenReportCommandSpec =
  | {
      id: Exclude<TokenReportCommandId, "tokens_between">;
      template: `/${string}`;
      title: string;
      kind: "rolling" | "today" | "all" | "session" | "session_tree";
      windowMs?: number;
      topModels?: number;
      topSessions?: number;
    }
  | {
      id: "tokens_between";
      template: "/tokens_between";
      titleForRange: (startYmd: Ymd, endYmd: Ymd) => string;
      kind: "between";
    };

const TUI_TOKEN_REPORT_MODEL_MAX_WIDTH = 25;

export const TOKEN_REPORT_COMMANDS: readonly TokenReportCommandSpec[] = [
  { id: "tokens_today", template: "/tokens_today", title: "Tokens used (Today)", kind: "today" },
  { id: "tokens_daily", template: "/tokens_daily", title: "Tokens used (Last 24 Hours)", kind: "rolling", windowMs: 24 * 60 * 60 * 1000 },
  { id: "tokens_weekly", template: "/tokens_weekly", title: "Tokens used (Last 7 Days)", kind: "rolling", windowMs: 7 * 24 * 60 * 60 * 1000 },
  { id: "tokens_monthly", template: "/tokens_monthly", title: "Tokens used (Last 30 Days)", kind: "rolling", windowMs: 30 * 24 * 60 * 60 * 1000 },
  { id: "tokens_all", template: "/tokens_all", title: "Tokens used (All Time)", kind: "all", topModels: 12, topSessions: 12 },
  { id: "tokens_session", template: "/tokens_session", title: "Tokens used (Current Session)", kind: "session" },
  { id: "tokens_session_all", template: "/tokens_session_all", title: "Tokens used (Current Session Tree)", kind: "session_tree" },
  { id: "tokens_between", template: "/tokens_between", titleForRange: (s, e) => `Tokens used (${formatYmd(s)} .. ${formatYmd(e)})`, kind: "between" },
];

const TOKEN_REPORT_COMMANDS_BY_ID = new Map(TOKEN_REPORT_COMMANDS.map((s) => [s.id, s]));

export function isTokenReportCommand(cmd: string): cmd is TokenReportCommandId {
  return TOKEN_REPORT_COMMANDS_BY_ID.has(cmd as TokenReportCommandId);
}

export function getCommandTitle(id: TokenReportCommandId): string {
  const spec = TOKEN_REPORT_COMMANDS_BY_ID.get(id);
  if (!spec) return `/${id}`;
  if (spec.kind === "between") return "Tokens used (Date Range)";
  return spec.title;
}

function buildTokenReportUnavailableOutput(params: {
  command: string;
  generatedAtMs: number;
  error: SessionNotFoundError;
}): string {
  return [
    renderCommandHeading({ title: `Token report unavailable (${params.command})`, generatedAtMs: params.generatedAtMs }),
    "",
    "session_lookup_error:",
    `- session_id: ${params.error.sessionID}`,
    `- error: ${params.error.message}`,
    `- checked_path: ${params.error.checkedPath}`,
  ].join("\n");
}

async function buildQuotaReport(params: {
  title: string;
  sinceMs?: number;
  untilMs?: number;
  sessionID: string;
  topModels?: number;
  topSessions?: number;
  filterSessionID?: string;
  filterSessionIDs?: string[];
  sessionOnly?: boolean;
  reportKind?: "standard" | "session" | "session_tree";
  sessionTree?: { rootSessionID: string; nodes: SessionTreeNode[] };
  generatedAtMs: number;
}): Promise<string> {
  const result = await aggregateUsage({
    sinceMs: params.sinceMs,
    untilMs: params.untilMs,
    sessionID: params.filterSessionID,
    sessionIDs: params.filterSessionIDs,
  });
  return formatQuotaStatsReport({
    title: params.title,
    result,
    topModels: params.topModels,
    topSessions: params.topSessions,
    focusSessionID: params.sessionID,
    sessionOnly: params.sessionOnly,
    reportKind: params.reportKind,
    sessionTree: params.sessionTree,
    generatedAtMs: params.generatedAtMs,
    tableOptions: { compactHeaders: true, modelNameMaxWidth: TUI_TOKEN_REPORT_MODEL_MAX_WIDTH },
  });
}

export async function buildTokenReport(params: {
  command: TokenReportCommandId;
  arguments?: string;
  sessionID?: string;
  generatedAtMs?: number;
}): Promise<string> {
  const spec = TOKEN_REPORT_COMMANDS_BY_ID.get(params.command);
  if (!spec) return `Unknown command: ${params.command}`;
  const sessionID = params.sessionID;
  const untilMs = params.generatedAtMs ?? Date.now();

  if (!sessionID && (spec.kind === "session" || spec.kind === "session_tree")) {
    return buildTokenReportUnavailableOutput({
      command: spec.template,
      generatedAtMs: untilMs,
      error: new SessionNotFoundError("(none)", "(none)"),
    });
  }

  try {
    if (spec.kind === "between") {
      const parsed = parseQuotaBetweenArgs(params.arguments);
      if (!parsed.ok) {
        return `Invalid arguments for /${spec.id}\n\n${parsed.error}\n\nExpected: /${spec.id} YYYY-MM-DD YYYY-MM-DD\nExample: /${spec.id} 2026-01-01 2026-01-15`;
      }
      return await buildQuotaReport({
        title: spec.titleForRange(parsed.startYmd, parsed.endYmd),
        sinceMs: startOfLocalDayMs(parsed.startYmd),
        untilMs: startOfNextLocalDayMs(parsed.endYmd),
        sessionID: sessionID ?? "",
        generatedAtMs: untilMs,
      });
    }

    let sinceMs: number | undefined;
    let filterSessionID: string | undefined;
    let filterSessionIDs: string[] | undefined;
    let sessionOnly: boolean | undefined;
    let topModels: number | undefined;
    let topSessions: number | undefined;
    let reportKind: "standard" | "session" | "session_tree" | undefined;
    let sessionTree: { rootSessionID: string; nodes: SessionTreeNode[] } | undefined;

    switch (spec.kind) {
      case "rolling":
        sinceMs = untilMs - spec.windowMs!;
        break;
      case "today": {
        const now = new Date(untilMs);
        sinceMs = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        break;
      }
      case "session":
        filterSessionID = sessionID;
        sessionOnly = true;
        reportKind = "session";
        break;
      case "session_tree": {
        const nodes = await resolveSessionTree(sessionID!);
        filterSessionIDs = nodes.map((n) => n.sessionID);
        reportKind = "session_tree";
        sessionTree = { rootSessionID: sessionID!, nodes };
        break;
      }
      case "all":
        topModels = spec.topModels;
        topSessions = spec.topSessions;
        break;
    }

    return await buildQuotaReport({
      title: spec.title,
      sinceMs,
      untilMs: spec.kind === "rolling" || spec.kind === "today" ? untilMs : undefined,
      sessionID: sessionID ?? "",
      filterSessionID,
      filterSessionIDs,
      sessionOnly,
      reportKind,
      sessionTree,
      topModels,
      topSessions,
      generatedAtMs: untilMs,
    });
  } catch (err) {
    if (err instanceof SessionNotFoundError) {
      return buildTokenReportUnavailableOutput({ command: spec.template, generatedAtMs: untilMs, error: err });
    }
    throw err;
  }
}
