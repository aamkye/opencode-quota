---
okf_version: "0.2"
type: Function
title: iterAssistantMessagesForSessions
resource: lib/tokens/opencode-storage.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-01T14:05:26Z"
concept_id: lib/tokens/opencode-storage/iterAssistantMessagesForSessions
language: typescript
---

# iterAssistantMessagesForSessions

## Signature

```typescript
function iterAssistantMessagesForSessions(params: {
  sessionIDs: string[];
  sinceMs?: number;
  untilMs?: number;
}): Promise<OpenCodeMessage[]>
```

## Source
Lines 278–313 in `lib/tokens/opencode-storage.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [opencode-storage](/lib/tokens/opencode-storage.md) |
| calls | [normalizeSessionIdsOrThrow](/lib/tokens/opencode-storage/normalizeSessionIdsOrThrow.md) |
| calls | [openDbOrNull](/lib/tokens/opencode-storage/openDbOrNull.md) |
| calls | [getOpenCodeDbPath](/lib/tokens/opencode-storage/getOpenCodeDbPath.md) |
| calls | [chunkArray](/lib/tokens/opencode-storage/chunkArray.md) |
| calls | [buildMessageQuery](/lib/tokens/opencode-storage/buildMessageQuery.md) |
| calls | [all](/lib/tokens/opencode-sqlite/all.md) |
| calls | [mapAssistantMessages](/lib/tokens/opencode-storage/mapAssistantMessages.md) |
| calls | [close](/lib/tokens/opencode-sqlite/close.md) |
| called_by | [aggregateUsage](/lib/tokens/quota-stats/aggregateUsage.md) |
