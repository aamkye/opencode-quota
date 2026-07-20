---
okf_version: "0.2"
type: Function
title: resolveLatestUserModel
resource: lib/session-rename.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:session-rename.ts"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-20T13:52:04Z"
concept_id: lib/session-rename/resolveLatestUserModel
language: typescript
---

# resolveLatestUserModel

## Signature

```typescript
function resolveLatestUserModel(messages: readonly SessionMessage[]): { model: SessionRenameModel; variant?: string } | undefined
```

## Source
Lines 57–68 in `lib/session-rename.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [session-rename](/lib/session-rename.md) |
| called_by | ["command.execute.before"](/lib/session-rename/command_execute_before.md) |
| called_by | [createSessionRenameHooks](/lib/session-rename/createSessionRenameHooks.md) |
