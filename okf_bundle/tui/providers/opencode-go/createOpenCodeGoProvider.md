---
okf_version: "0.2"
type: Function
title: createOpenCodeGoProvider
resource: tui/providers/opencode-go.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:providers"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-16T13:37:47Z"
concept_id: tui/providers/opencode-go/createOpenCodeGoProvider
language: typescript
---

# createOpenCodeGoProvider

## Signature

```typescript
function createOpenCodeGoProvider(
  api: TuiPluginApi,
  options: OpenCodeGoProviderOptions,
): QuotaProviderAdapter
```

## Source
Lines 545–708 in `tui/providers/opencode-go.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [opencode-go](/tui/providers/opencode-go.md) |
| calls | [clearBoundary](/tui/providers/opencode-go/clearBoundary.md) |
| calls | [filter](/tui/quota/filter.md) |
| calls | [refresh](/tui/providers/opencode-go/refresh.md) |
| calls | [unref](/tui/providers/opencode-go/unref.md) |
| calls | [scheduleBoundary](/tui/providers/opencode-go/scheduleBoundary.md) |
| calls | [resolve](/tests/plugin-build/resolve.md) |
| calls | [fetchOpenCodeGoQuota](/tui/providers/opencode-go/fetchOpenCodeGoQuota.md) |
| calls | [applyResult](/tui/providers/opencode-go/applyResult.md) |
| calls | [setInterval](/tests/subagent-mounted/setInterval.md) |
| calls | [clearInterval](/tests/subagent-mounted/clearInterval.md) |
| calls | [setNow](/tests/subagent-mounted/setNow.md) |
| calls | [mapOpenCodeGoPanelState](/tui/providers/opencode-go/mapOpenCodeGoPanelState.md) |
| calls | [openCodeGoHomeQuotaSummary](/tui/providers/opencode-go/openCodeGoHomeQuotaSummary.md) |
