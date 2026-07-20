---
okf_version: "0.2"
type: Function
title: iterAssistantMessagesForSession
resource: lib/tokens/opencode-storage.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-01T14:05:26Z"
concept_id: lib/tokens/opencode-storage/iterAssistantMessagesForSession
language: typescript
---

# iterAssistantMessagesForSession

## Signature

```typescript
function iterAssistantMessagesForSession(params: {
  sessionID: string;
  sinceMs?: number;
  untilMs?: number;
}): Promise<OpenCodeMessage[]>
```

## Source
Lines 250–276 in `lib/tokens/opencode-storage.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [opencode-storage](/lib/tokens/opencode-storage.md) |
| calls | [validateSessionIdOrThrow](/lib/tokens/opencode-storage/validateSessionIdOrThrow.md) |
| calls | [openDbOrNull](/lib/tokens/opencode-storage/openDbOrNull.md) |
| calls | [getOpenCodeDbPath](/lib/tokens/opencode-storage/getOpenCodeDbPath.md) |
| calls | [get](/lib/tokens/opencode-sqlite/get.md) |
| calls | [buildMessageQuery](/lib/tokens/opencode-storage/buildMessageQuery.md) |
| calls | [all](/lib/tokens/opencode-sqlite/all.md) |
| calls | [mapAssistantMessages](/lib/tokens/opencode-storage/mapAssistantMessages.md) |
| calls | [close](/lib/tokens/opencode-sqlite/close.md) |
| called_by | [aggregateUsage](/lib/tokens/quota-stats/aggregateUsage.md) |
| called_by | [getSessionTokenSummary](/lib/tokens/quota-stats/getSessionTokenSummary.md) |
