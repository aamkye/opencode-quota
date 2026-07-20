---
okf_version: "0.2"
type: Function
title: unref
resource: tui/providers/opencode-go.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:providers"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-16T13:37:47Z"
concept_id: tui/providers/opencode-go/unref
language: typescript
---

# unref

## Signature

```typescript
function unref(timer: ReturnType<typeof setTimeout> | ReturnType<typeof setInterval>): void
```

## Source
Lines 541–543 in `tui/providers/opencode-go.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [opencode-go](/tui/providers/opencode-go.md) |
| called_by | [createOpenCodeGoProvider](/tui/providers/opencode-go/createOpenCodeGoProvider.md) |
| called_by | [refresh](/tui/providers/opencode-go/refresh.md) |
| called_by | [scheduleBoundary](/tui/providers/opencode-go/scheduleBoundary.md) |
