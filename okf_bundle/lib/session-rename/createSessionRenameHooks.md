---
okf_version: "0.2"
type: Function
title: createSessionRenameHooks
resource: lib/session-rename.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:session-rename.ts"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-20T10:29:40Z"
concept_id: lib/session-rename/createSessionRenameHooks
language: typescript
---

# createSessionRenameHooks

## Signature

```typescript
function createSessionRenameHooks(client: Client, warn: Warn = logWarning): Hooks
```

## Source
Lines 70–200 in `lib/session-rename.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [session-rename](/lib/session-rename.md) |
| calls | [find](/tui/quota/find.md) |
| calls | [normalizeTitle](/lib/session-rename/normalizeTitle.md) |
| calls | [collectRecentUserText](/lib/session-rename/collectRecentUserText.md) |
| calls | [resolveLatestUserModel](/lib/session-rename/resolveLatestUserModel.md) |
| calls | [generateTitle](/lib/session-rename/generateTitle.md) |
| calls | [appendFeedback](/lib/session-rename/appendFeedback.md) |
| called_by | [server](/session-rename/server.md) |
