---
okf_version: "0.2"
type: Function
title: getOpenCodeDbPath
resource: lib/tokens/opencode-storage.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-01T14:05:26Z"
concept_id: lib/tokens/opencode-storage/getOpenCodeDbPath
language: typescript
---

# getOpenCodeDbPath

## Signature

```typescript
function getOpenCodeDbPath(): string
```

## Source
Lines 68–70 in `lib/tokens/opencode-storage.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [opencode-storage](/lib/tokens/opencode-storage.md) |
| calls | [pickFirstExistingPath](/lib/tokens/path-pick/pickFirstExistingPath.md) |
| calls | [getOpenCodeDbPathCandidates](/lib/tokens/opencode-storage/getOpenCodeDbPathCandidates.md) |
| called_by | [iterAssistantMessagesForSession](/lib/tokens/opencode-storage/iterAssistantMessagesForSession.md) |
| called_by | [iterAssistantMessagesForSessions](/lib/tokens/opencode-storage/iterAssistantMessagesForSessions.md) |
| called_by | [openDbOrNull](/lib/tokens/opencode-storage/openDbOrNull.md) |
| called_by | [resolveSessionTree](/lib/tokens/quota-stats/resolveSessionTree.md) |
