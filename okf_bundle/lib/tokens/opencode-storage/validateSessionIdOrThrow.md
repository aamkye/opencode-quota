---
okf_version: "0.2"
type: Function
title: validateSessionIdOrThrow
resource: lib/tokens/opencode-storage.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-01T14:05:26Z"
concept_id: lib/tokens/opencode-storage/validateSessionIdOrThrow
language: typescript
---

# validateSessionIdOrThrow

## Signature

```typescript
function validateSessionIdOrThrow(sessionID: string): void
```

## Source
Lines 144–148 in `lib/tokens/opencode-storage.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [opencode-storage](/lib/tokens/opencode-storage.md) |
| called_by | [iterAssistantMessagesForSession](/lib/tokens/opencode-storage/iterAssistantMessagesForSession.md) |
| called_by | [normalizeSessionIdsOrThrow](/lib/tokens/opencode-storage/normalizeSessionIdsOrThrow.md) |
