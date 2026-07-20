---
okf_version: "0.2"
type: Function
title: all
resource: lib/tokens/opencode-sqlite.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-01T14:04:09Z"
concept_id: lib/tokens/opencode-sqlite/all
language: typescript
---

# all

## Signature

```typescript
all(sql: string, params?: unknown[]): T[]
```

## Type Parameters

- `T = unknown`

## Source
Lines 64–66 in `lib/tokens/opencode-sqlite.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [opencode-sqlite](/lib/tokens/opencode-sqlite.md) |
| calls | [toParams](/lib/tokens/opencode-sqlite/toParams.md) |
| called_by | [deployPlugins](/deploy-plugins/deployPlugins.md) |
| called_by | [createPreparedSqliteConn](/lib/tokens/opencode-sqlite/createPreparedSqliteConn.md) |
| called_by | [openWithBunSqlite](/lib/tokens/opencode-sqlite/openWithBunSqlite.md) |
| called_by | [iterAssistantMessages](/lib/tokens/opencode-storage/iterAssistantMessages.md) |
| called_by | [iterAssistantMessagesForSession](/lib/tokens/opencode-storage/iterAssistantMessagesForSession.md) |
| called_by | [iterAssistantMessagesForSessions](/lib/tokens/opencode-storage/iterAssistantMessagesForSessions.md) |
| called_by | [readAllSessionsIndex](/lib/tokens/opencode-storage/readAllSessionsIndex.md) |
| called_by | [managedArtifactPaths](/tests/plugin-deploy/managedArtifactPaths.md) |
| called_by | [projectFallbackSnapshot](/tests/plugin-deploy/projectFallbackSnapshot.md) |
| called_by | [snapshot](/tests/plugin-deploy/snapshot.md) |
