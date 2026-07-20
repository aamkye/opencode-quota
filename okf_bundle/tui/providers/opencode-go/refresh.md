---
okf_version: "0.2"
type: Function
title: refresh
resource: tui/providers/opencode-go.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:providers"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-16T13:37:47Z"
concept_id: tui/providers/opencode-go/refresh
language: typescript
---

# refresh

## Signature

```typescript
const refresh = () =>: Promise<void>
```

## Source
Lines 621–655 in `tui/providers/opencode-go.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [opencode-go](/tui/providers/opencode-go.md) |
| calls | [resolve](/tests/plugin-build/resolve.md) |
| calls | [unref](/tui/providers/opencode-go/unref.md) |
| calls | [fetchOpenCodeGoQuota](/tui/providers/opencode-go/fetchOpenCodeGoQuota.md) |
| calls | [applyResult](/tui/providers/opencode-go/applyResult.md) |
| called_by | [createOpenCodeGoProvider](/tui/providers/opencode-go/createOpenCodeGoProvider.md) |
| called_by | [scheduleBoundary](/tui/providers/opencode-go/scheduleBoundary.md) |
| called_by | [settled](/tui/providers/opencode-go/settled.md) |
