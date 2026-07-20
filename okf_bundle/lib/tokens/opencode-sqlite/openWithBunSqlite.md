---
okf_version: "0.2"
type: Function
title: openWithBunSqlite
resource: lib/tokens/opencode-sqlite.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-01T14:04:09Z"
concept_id: lib/tokens/opencode-sqlite/openWithBunSqlite
language: typescript
---

# openWithBunSqlite

## Signature

```typescript
function openWithBunSqlite(dbPath: string): Promise<SqliteConn>
```

## Source
Lines 58–75 in `lib/tokens/opencode-sqlite.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [opencode-sqlite](/lib/tokens/opencode-sqlite.md) |
| calls | [all](/lib/tokens/opencode-sqlite/all.md) |
| calls | [toParams](/lib/tokens/opencode-sqlite/toParams.md) |
| calls | [get](/lib/tokens/opencode-sqlite/get.md) |
| calls | [close](/lib/tokens/opencode-sqlite/close.md) |
| called_by | [openOpenCodeSqliteReadOnly](/lib/tokens/opencode-sqlite/openOpenCodeSqliteReadOnly.md) |
