---
okf_version: "0.2"
type: Function
title: close
resource: lib/tokens/opencode-sqlite.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-01T14:04:09Z"
concept_id: lib/tokens/opencode-sqlite/close
language: typescript
---

# close

## Signature

```typescript
close(): void
```

## Source
Lines 71–73 in `lib/tokens/opencode-sqlite.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [opencode-sqlite](/lib/tokens/opencode-sqlite.md) |
| called_by | [createPreparedSqliteConn](/lib/tokens/opencode-sqlite/createPreparedSqliteConn.md) |
| called_by | [openWithBunSqlite](/lib/tokens/opencode-sqlite/openWithBunSqlite.md) |
| called_by | [iterAssistantMessages](/lib/tokens/opencode-storage/iterAssistantMessages.md) |
| called_by | [iterAssistantMessagesForSession](/lib/tokens/opencode-storage/iterAssistantMessagesForSession.md) |
| called_by | [iterAssistantMessagesForSessions](/lib/tokens/opencode-storage/iterAssistantMessagesForSessions.md) |
| called_by | [readAllSessionsIndex](/lib/tokens/opencode-storage/readAllSessionsIndex.md) |
