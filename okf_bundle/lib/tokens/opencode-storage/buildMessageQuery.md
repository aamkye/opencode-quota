---
okf_version: "0.2"
type: Function
title: buildMessageQuery
resource: lib/tokens/opencode-storage.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-01T14:05:26Z"
concept_id: lib/tokens/opencode-storage/buildMessageQuery
language: typescript
---

# buildMessageQuery

## Signature

```typescript
function buildMessageQuery(params: {
  sessionID?: string;
  sessionIDs?: string[];
  sinceMs?: number;
  untilMs?: number;
}): { sql: string; args: unknown[] }
```

## Source
Lines 172–213 in `lib/tokens/opencode-storage.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [opencode-storage](/lib/tokens/opencode-storage.md) |
| called_by | [iterAssistantMessages](/lib/tokens/opencode-storage/iterAssistantMessages.md) |
| called_by | [iterAssistantMessagesForSession](/lib/tokens/opencode-storage/iterAssistantMessagesForSession.md) |
| called_by | [iterAssistantMessagesForSessions](/lib/tokens/opencode-storage/iterAssistantMessagesForSessions.md) |
