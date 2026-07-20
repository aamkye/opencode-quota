---
okf_version: "0.2"
type: Function
title: applyResult
resource: tui/providers/opencode-go.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:providers"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-16T13:37:47Z"
concept_id: tui/providers/opencode-go/applyResult
language: typescript
---

# applyResult

## Signature

```typescript
const applyResult = (result: OpenCodeGoFetchResult) =>: void
```

## Source
Lines 597–619 in `tui/providers/opencode-go.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [opencode-go](/tui/providers/opencode-go.md) |
| calls | [scheduleBoundary](/tui/providers/opencode-go/scheduleBoundary.md) |
| calls | [clearBoundary](/tui/providers/opencode-go/clearBoundary.md) |
| called_by | [createOpenCodeGoProvider](/tui/providers/opencode-go/createOpenCodeGoProvider.md) |
| called_by | [refresh](/tui/providers/opencode-go/refresh.md) |
