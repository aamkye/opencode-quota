---
okf_version: "0.2"
type: Function
title: scheduleBoundary
resource: tui/providers/opencode-go.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:providers"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-16T13:37:47Z"
concept_id: tui/providers/opencode-go/scheduleBoundary
language: typescript
---

# scheduleBoundary

## Signature

```typescript
const scheduleBoundary = (snapshot: OpenCodeGoQuotaData) =>: void
```

## Source
Lines 576–595 in `tui/providers/opencode-go.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [opencode-go](/tui/providers/opencode-go.md) |
| calls | [clearBoundary](/tui/providers/opencode-go/clearBoundary.md) |
| calls | [filter](/tui/quota/filter.md) |
| calls | [refresh](/tui/providers/opencode-go/refresh.md) |
| calls | [unref](/tui/providers/opencode-go/unref.md) |
| called_by | [applyResult](/tui/providers/opencode-go/applyResult.md) |
| called_by | [createOpenCodeGoProvider](/tui/providers/opencode-go/createOpenCodeGoProvider.md) |
