---
okf_version: "0.2"
type: Function
title: normalizeTitle
resource: lib/session-rename.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:session-rename.ts"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-20T13:52:04Z"
concept_id: lib/session-rename/normalizeTitle
language: typescript
---

# normalizeTitle

## Signature

```typescript
function normalizeTitle(value: string): string | undefined
```

## Source
Lines 21–24 in `lib/session-rename.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [session-rename](/lib/session-rename.md) |
| called_by | ["command.execute.before"](/lib/session-rename/command_execute_before.md) |
| called_by | [createSessionRenameHooks](/lib/session-rename/createSessionRenameHooks.md) |
| called_by | [generateTitle](/lib/session-rename/generateTitle.md) |
