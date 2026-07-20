---
okf_version: "0.2"
type: Function
title: appendFeedback
resource: lib/session-rename.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:session-rename.ts"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-20T10:29:40Z"
concept_id: lib/session-rename/appendFeedback
language: typescript
---

# appendFeedback

## Signature

```typescript
function appendFeedback(sessionID: string, text: string): Promise<void>
```

## Source
Lines 71–79 in `lib/session-rename.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [session-rename](/lib/session-rename.md) |
| called_by | ["command.execute.before"](/lib/session-rename/command_execute_before.md) |
| called_by | [createSessionRenameHooks](/lib/session-rename/createSessionRenameHooks.md) |
