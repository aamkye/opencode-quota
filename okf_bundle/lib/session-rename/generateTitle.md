---
okf_version: "0.2"
type: Function
title: generateTitle
resource: lib/session-rename.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:session-rename.ts"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-20T13:52:04Z"
concept_id: lib/session-rename/generateTitle
language: typescript
---

# generateTitle

## Signature

```typescript
function generateTitle(
    parentID: string,
    model: SessionRenameModel | undefined,
    variant: string | undefined,
    request: string,
  ): Promise<string | undefined>
```

## Source
Lines 82–129 in `lib/session-rename.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [session-rename](/lib/session-rename.md) |
| calls | [find](/tui/quota/find.md) |
| calls | [normalizeTitle](/lib/session-rename/normalizeTitle.md) |
| called_by | ["command.execute.before"](/lib/session-rename/command_execute_before.md) |
| called_by | [createSessionRenameHooks](/lib/session-rename/createSessionRenameHooks.md) |
