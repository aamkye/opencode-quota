---
okf_version: "0.2"
type: Function
title: openWithNodeRuntimeSqlite
resource: lib/tokens/opencode-sqlite.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-01T14:04:09Z"
concept_id: lib/tokens/opencode-sqlite/openWithNodeRuntimeSqlite
language: typescript
---

# openWithNodeRuntimeSqlite

## Signature

```typescript
function openWithNodeRuntimeSqlite(dbPath: string): Promise<SqliteConn>
```

## Source
Lines 77–97 in `lib/tokens/opencode-sqlite.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [opencode-sqlite](/lib/tokens/opencode-sqlite.md) |
| calls | [createPreparedSqliteConn](/lib/tokens/opencode-sqlite/createPreparedSqliteConn.md) |
| called_by | [openOpenCodeSqliteReadOnly](/lib/tokens/opencode-sqlite/openOpenCodeSqliteReadOnly.md) |
