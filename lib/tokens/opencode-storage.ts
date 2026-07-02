import { join } from "path";
import { existsSync } from "fs";

import { getOpencodeRuntimeDirCandidates } from "./opencode-runtime-paths";
import { pickFirstExistingPath } from "./path-pick";
import { openOpenCodeSqliteReadOnly, type SqliteConn } from "./opencode-sqlite";

export class SessionNotFoundError extends Error {
  constructor(
    public readonly sessionID: string,
    public readonly checkedPath: string,
  ) {
    super(`Session not found: ${sessionID}`);
    this.name = "SessionNotFoundError";
  }
}

export interface OpenCodeTokenCache {
  read: number;
  write: number;
}

export interface OpenCodeTokens {
  input: number;
  output: number;
  reasoning?: number;
  cache: OpenCodeTokenCache;
}

export interface OpenCodeMessage {
  id: string;
  sessionID: string;
  role: "user" | "assistant" | string;
  providerID?: string;
  modelID?: string;
  tokens?: OpenCodeTokens;
  cost?: number;
  time?: {
    created?: number;
    completed?: number;
  };
  agent?: string;
  mode?: string;
}

export interface OpenCodeSessionInfo {
  id: string;
  title?: string;
  parentID?: string;
  time?: {
    created?: number;
    updated?: number;
  };
}

export function getOpenCodeDataDirCandidates(): string[] {
  return getOpencodeRuntimeDirCandidates().dataDirs;
}

export function getOpenCodeDataDir(): string {
  return pickFirstExistingPath(getOpenCodeDataDirCandidates());
}

export function getOpenCodeDbPathCandidates(): string[] {
  return getOpenCodeDataDirCandidates().map((d) => join(d, "opencode.db"));
}

export function getOpenCodeDbPath(): string {
  return pickFirstExistingPath(getOpenCodeDbPathCandidates());
}

type MessageRow = {
  id: string;
  session_id: string;
  time_created: number;
  time_updated?: number;
  data: string;
};

type SessionRow = {
  id: string;
  title: string | null;
  parent_id: string | null;
  time_created: number;
  time_updated: number;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function safeJsonParse(raw: string): unknown | null {
  try { return JSON.parse(raw) as unknown; } catch { return null; }
}

const SQLITE_MAX_MESSAGE_QUERY_ARGS = 900;

function normalizeNumber(n: unknown): number | undefined {
  return typeof n === "number" && Number.isFinite(n) ? n : undefined;
}

function normalizeString(s: unknown): string | undefined {
  return typeof s === "string" ? s : undefined;
}

function mapRowToOpenCodeMessage(row: MessageRow): OpenCodeMessage | null {
  if (!row || typeof row !== "object") return null;
  if (typeof row.id !== "string" || typeof row.session_id !== "string") return null;
  if (typeof row.time_created !== "number") return null;

  const payload = asRecord(safeJsonParse(row.data));
  if (!payload) return null;

  const payloadTime = asRecord(payload.time);
  const role = normalizeString(payload.role) ?? "unknown";

  return {
    id: row.id,
    sessionID: row.session_id,
    role,
    providerID: normalizeString(payload.providerID),
    modelID: normalizeString(payload.modelID),
    tokens: payload.tokens as OpenCodeTokens | undefined,
    cost: normalizeNumber(payload.cost),
    time: {
      created: row.time_created,
      completed: normalizeNumber(payloadTime?.completed),
    },
    agent: normalizeString(payload.agent),
    mode: normalizeString(payload.mode),
  };
}

function openDbOrNull(): { dbPath: string; open: () => Promise<SqliteConn> } | null {
  const dbPath = getOpenCodeDbPath();
  if (!dbPath) return null;
  if (!existsSync(dbPath)) return null;
  return {
    dbPath,
    open: () => openOpenCodeSqliteReadOnly(dbPath),
  };
}

function validateSessionIdOrThrow(sessionID: string): void {
  if (!sessionID.startsWith("ses_")) {
    throw new SessionNotFoundError(sessionID, "(invalid session ID format)");
  }
}

function normalizeSessionIdsOrThrow(sessionIDs: readonly string[]): string[] {
  const unique: string[] = [];
  const seen = new Set<string>();

  for (const sessionID of sessionIDs) {
    validateSessionIdOrThrow(sessionID);
    if (seen.has(sessionID)) continue;
    seen.add(sessionID);
    unique.push(sessionID);
  }

  return unique;
}

function chunkArray<T>(items: readonly T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  return chunks;
}

function buildMessageQuery(params: {
  sessionID?: string;
  sessionIDs?: string[];
  sinceMs?: number;
  untilMs?: number;
}): { sql: string; args: unknown[] } {
  if (params.sessionID && params.sessionIDs?.length) {
    throw new Error("buildMessageQuery received both sessionID and sessionIDs");
  }

  const where: string[] = [];
  const args: unknown[] = [];

  if (params.sessionID) {
    where.push(`session_id = ?`);
    args.push(params.sessionID);
  } else if (params.sessionIDs) {
    if (params.sessionIDs.length === 0) {
      where.push(`1 = 0`);
    } else {
      where.push(`session_id IN (${params.sessionIDs.map(() => "?").join(", ")})`);
      args.push(...params.sessionIDs);
    }
  }

  if (typeof params.sinceMs === "number") {
    where.push(`time_created >= ?`);
    args.push(params.sinceMs);
  }

  if (typeof params.untilMs === "number") {
    where.push(`time_created <= ?`);
    args.push(params.untilMs);
  }

  const sql =
    `SELECT id, session_id, time_created, time_updated, data FROM "message"` +
    (where.length ? ` WHERE ${where.join(" AND ")}` : "") +
    ` ORDER BY time_created ASC, id ASC`;

  return { sql, args };
}

function mapAssistantMessages(rows: MessageRow[]): OpenCodeMessage[] {
  const out: OpenCodeMessage[] = [];
  for (const row of rows) {
    const msg = mapRowToOpenCodeMessage(row);
    if (!msg) continue;
    if (String(msg.role).toLowerCase() !== "assistant") continue;
    out.push(msg);
  }
  return out;
}

function compareMessageOrder(a: OpenCodeMessage, b: OpenCodeMessage): number {
  const aCreated = typeof a.time?.created === "number" ? a.time.created : Number.MAX_SAFE_INTEGER;
  const bCreated = typeof b.time?.created === "number" ? b.time.created : Number.MAX_SAFE_INTEGER;
  if (aCreated !== bCreated) return aCreated - bCreated;
  return a.id.localeCompare(b.id);
}

export async function iterAssistantMessages(params: {
  sinceMs?: number;
  untilMs?: number;
}): Promise<OpenCodeMessage[]> {
  const db = openDbOrNull();
  if (!db) return [];

  const conn = await db.open();
  try {
    const q = buildMessageQuery({ sinceMs: params.sinceMs, untilMs: params.untilMs });
    const rows = conn.all<MessageRow>(q.sql, q.args);
    return mapAssistantMessages(rows);
  } finally {
    conn.close();
  }
}

export async function iterAssistantMessagesForSession(params: {
  sessionID: string;
  sinceMs?: number;
  untilMs?: number;
}): Promise<OpenCodeMessage[]> {
  const { sessionID, sinceMs, untilMs } = params;
  validateSessionIdOrThrow(sessionID);

  const db = openDbOrNull();
  if (!db) {
    throw new SessionNotFoundError(sessionID, getOpenCodeDbPath());
  }

  const conn = await db.open();
  try {
    const exists = conn.get<{ ok: number }>(`SELECT 1 as ok FROM "session" WHERE id = ? LIMIT 1`, [sessionID]);
    if (!exists) {
      throw new SessionNotFoundError(sessionID, db.dbPath);
    }

    const q = buildMessageQuery({ sessionID, sinceMs, untilMs });
    const rows = conn.all<MessageRow>(q.sql, q.args);
    return mapAssistantMessages(rows);
  } finally {
    conn.close();
  }
}

export async function iterAssistantMessagesForSessions(params: {
  sessionIDs: string[];
  sinceMs?: number;
  untilMs?: number;
}): Promise<OpenCodeMessage[]> {
  const sessionIDs = normalizeSessionIdsOrThrow(params.sessionIDs);
  if (sessionIDs.length === 0) return [];

  const db = openDbOrNull();
  if (!db) {
    throw new SessionNotFoundError(sessionIDs[0]!, getOpenCodeDbPath());
  }

  const conn = await db.open();
  try {
    const reservedArgs =
      (typeof params.sinceMs === "number" ? 1 : 0) + (typeof params.untilMs === "number" ? 1 : 0);
    const maxSessionIdsPerQuery = Math.max(1, SQLITE_MAX_MESSAGE_QUERY_ARGS - reservedArgs);
    const messages: OpenCodeMessage[] = [];

    for (const sessionIdChunk of chunkArray(sessionIDs, maxSessionIdsPerQuery)) {
      const q = buildMessageQuery({
        sessionIDs: sessionIdChunk,
        sinceMs: params.sinceMs,
        untilMs: params.untilMs,
      });
      const rows = conn.all<MessageRow>(q.sql, q.args);
      messages.push(...mapAssistantMessages(rows));
    }

    messages.sort(compareMessageOrder);
    return messages;
  } finally {
    conn.close();
  }
}

export async function readAllSessionsIndex(): Promise<Record<string, OpenCodeSessionInfo>> {
  const db = openDbOrNull();
  const idx: Record<string, OpenCodeSessionInfo> = {};
  if (!db) return idx;

  const conn = await db.open();
  try {
    const rows = conn.all<SessionRow>(
      `SELECT id, title, parent_id, time_created, time_updated FROM "session" ORDER BY time_created ASC, id ASC`,
    );

    for (const row of rows) {
      if (!row || typeof row.id !== "string" || !row.id.startsWith("ses_")) continue;
      idx[row.id] = {
        id: row.id,
        title: typeof row.title === "string" && row.title.trim() ? row.title : undefined,
        parentID: typeof row.parent_id === "string" ? row.parent_id : undefined,
        time: {
          created: typeof row.time_created === "number" ? row.time_created : undefined,
          updated: typeof row.time_updated === "number" ? row.time_updated : undefined,
        },
      };
    }

    return idx;
  } finally {
    conn.close();
  }
}
