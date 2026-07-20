---
okf_version: "0.2"
type: Function
title: normalizeSessionIdsOrThrow
resource: lib/tokens/opencode-storage.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-01T14:05:26Z"
concept_id: lib/tokens/opencode-storage/normalizeSessionIdsOrThrow
language: typescript
---

# normalizeSessionIdsOrThrow

## Signature

```typescript
function normalizeSessionIdsOrThrow(sessionIDs: readonly string[]): string[]
```

## Source
Lines 150–162 in `lib/tokens/opencode-storage.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [opencode-storage](/lib/tokens/opencode-storage.md) |
| calls | [validateSessionIdOrThrow](/lib/tokens/opencode-storage/validateSessionIdOrThrow.md) |
| called_by | [iterAssistantMessagesForSessions](/lib/tokens/opencode-storage/iterAssistantMessagesForSessions.md) |
