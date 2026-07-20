---
okf_version: "0.2"
type: Function
title: openDbOrNull
resource: lib/tokens/opencode-storage.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-01T14:05:26Z"
concept_id: lib/tokens/opencode-storage/openDbOrNull
language: typescript
---

# openDbOrNull

## Signature

```typescript
function openDbOrNull(): { dbPath: string; open: () => Promise<SqliteConn> } | null
```

## Source
Lines 134–142 in `lib/tokens/opencode-storage.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [opencode-storage](/lib/tokens/opencode-storage.md) |
| calls | [getOpenCodeDbPath](/lib/tokens/opencode-storage/getOpenCodeDbPath.md) |
| calls | [openOpenCodeSqliteReadOnly](/lib/tokens/opencode-sqlite/openOpenCodeSqliteReadOnly.md) |
| called_by | [iterAssistantMessages](/lib/tokens/opencode-storage/iterAssistantMessages.md) |
| called_by | [iterAssistantMessagesForSession](/lib/tokens/opencode-storage/iterAssistantMessagesForSession.md) |
| called_by | [iterAssistantMessagesForSessions](/lib/tokens/opencode-storage/iterAssistantMessagesForSessions.md) |
| called_by | [readAllSessionsIndex](/lib/tokens/opencode-storage/readAllSessionsIndex.md) |
