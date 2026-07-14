import { formatYmd, type Ymd } from "./command-parsing";

export type TokenReportCommandId =
  | "tokens_today"
  | "tokens_daily"
  | "tokens_weekly"
  | "tokens_monthly"
  | "tokens_all"
  | "tokens_session"
  | "tokens_session_all"
  | "tokens_between";

export type TokenReportCommandSpec =
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

export function getTokenReportCommandSpec(id: TokenReportCommandId): TokenReportCommandSpec | undefined {
  return TOKEN_REPORT_COMMANDS_BY_ID.get(id);
}

export function isTokenReportCommand(cmd: string): cmd is TokenReportCommandId {
  return TOKEN_REPORT_COMMANDS_BY_ID.has(cmd as TokenReportCommandId);
}

export function getCommandTitle(id: TokenReportCommandId): string {
  const spec = TOKEN_REPORT_COMMANDS_BY_ID.get(id);
  if (!spec) return `/${id}`;
  if (spec.kind === "between") return "Tokens used (Date Range)";
  return spec.title;
}
