---
okf_version: "0.2"
type: Function
title: openOpenCodeSqliteReadOnly
resource: lib/tokens/opencode-sqlite.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-01T14:04:09Z"
concept_id: lib/tokens/opencode-sqlite/openOpenCodeSqliteReadOnly
language: typescript
---

# openOpenCodeSqliteReadOnly

## Signature

```typescript
function openOpenCodeSqliteReadOnly(dbPath: string): Promise<SqliteConn>
```

## Source
Lines 99–104 in `lib/tokens/opencode-sqlite.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [opencode-sqlite](/lib/tokens/opencode-sqlite.md) |
| calls | [openWithBunSqlite](/lib/tokens/opencode-sqlite/openWithBunSqlite.md) |
| calls | [openWithNodeRuntimeSqlite](/lib/tokens/opencode-sqlite/openWithNodeRuntimeSqlite.md) |
| called_by | [openDbOrNull](/lib/tokens/opencode-storage/openDbOrNull.md) |
