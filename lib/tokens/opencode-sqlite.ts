export interface SqliteConn {
  all<T = unknown>(sql: string, params?: unknown[]): T[];
  get<T = unknown>(sql: string, params?: unknown[]): T | null;
  close(): void;
}

interface SqliteStatement {
  all(...params: unknown[]): unknown[];
  get(...params: unknown[]): unknown;
  run(...params: unknown[]): unknown;
}

interface BunSqliteDatabase {
  query(sql: string): SqliteStatement;
  close(): void;
}

interface BunSqliteModule {
  Database: new (path: string, options: { readonly: boolean }) => BunSqliteDatabase;
}

interface PreparedSqliteDatabase {
  prepare(sql: string): SqliteStatement;
  close(): void;
}

interface NodeSqliteDatabase extends PreparedSqliteDatabase {
  exec(sql: string): unknown;
}

interface NodeSqliteModule {
  DatabaseSync: new (path: string, options?: { readOnly?: boolean; open?: boolean }) => NodeSqliteDatabase;
}

interface BetterSqlite3Module {
  default: new (path: string, options?: { readonly?: boolean }) => PreparedSqliteDatabase;
}

function toParams(params?: unknown[]): unknown[] {
  return Array.isArray(params) ? params : [];
}

function createPreparedSqliteConn(db: PreparedSqliteDatabase): SqliteConn {
  return {
    all<T = unknown>(sql: string, params?: unknown[]): T[] {
      return db.prepare(sql).all(...toParams(params)) as T[];
    },
    get<T = unknown>(sql: string, params?: unknown[]): T | null {
      const row = db.prepare(sql).get(...toParams(params)) as T | undefined;
      return row ?? null;
    },
    close(): void {
      try { db.close(); } catch {}
    },
  };
}

async function openWithBunSqlite(dbPath: string): Promise<SqliteConn> {
  const mod = (await import("bun:sqlite")) as unknown as BunSqliteModule;
  const db = new mod.Database(dbPath, { readonly: true });
  try { db.query("PRAGMA query_only = ON;").run(); } catch {}
  try { db.query("PRAGMA busy_timeout = 5000;").run(); } catch {}
  return {
    all<T = unknown>(sql: string, params?: unknown[]): T[] {
      return db.query(sql).all(...toParams(params)) as T[];
    },
    get<T = unknown>(sql: string, params?: unknown[]): T | null {
      const row = db.query(sql).get(...toParams(params)) as T | undefined;
      return row ?? null;
    },
    close(): void {
      try { db.close(); } catch {}
    },
  };
}

async function openWithNodeRuntimeSqlite(dbPath: string): Promise<SqliteConn> {
  try {
    const nodeSqlite = await import("node:sqlite").then(m => m as unknown as NodeSqliteModule).catch(() => null);
    if (nodeSqlite) {
      const db = new nodeSqlite.DatabaseSync(dbPath, { readOnly: true, open: true });
      try { db.exec("PRAGMA query_only = ON;"); } catch {}
      try { db.exec("PRAGMA busy_timeout = 5000;"); } catch {}
      return createPreparedSqliteConn(db);
    }
  } catch {}

  try {
    const mod = (await import("better-sqlite3")) as unknown as BetterSqlite3Module;
    const db = new mod.default(dbPath, { readonly: true });
    try { db.prepare("PRAGMA query_only = ON;").run(); } catch {}
    try { db.prepare("PRAGMA busy_timeout = 5000;").run(); } catch {}
    return createPreparedSqliteConn(db);
  } catch {
    throw new Error("OpenCode SQLite backend unavailable");
  }
}

export async function openOpenCodeSqliteReadOnly(dbPath: string): Promise<SqliteConn> {
  if (typeof globalThis === "object" && "Bun" in globalThis) {
    return openWithBunSqlite(dbPath);
  }
  return openWithNodeRuntimeSqlite(dbPath);
}
