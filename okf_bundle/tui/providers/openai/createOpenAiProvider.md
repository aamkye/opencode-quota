---
okf_version: "0.2"
type: Function
title: createOpenAiProvider
resource: tui/providers/openai.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:providers"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-16T13:37:47Z"
concept_id: tui/providers/openai/createOpenAiProvider
language: typescript
---

# createOpenAiProvider

## Signature

```typescript
function createOpenAiProvider(api: TuiPluginApi, options: QuotaProviderOptions = {}): QuotaProviderAdapter
```

## Source
Lines 297–499 in `tui/providers/openai.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [openai](/tui/providers/openai.md) |
| calls | [providerRefreshInterval](/tui/providers/openai/providerRefreshInterval.md) |
| calls | [resolve](/tests/plugin-build/resolve.md) |
| calls | [fetchOpenAiQuota](/tui/providers/openai/fetchOpenAiQuota.md) |
| calls | [quotaData](/tui/providers/openai/quotaData.md) |
| calls | [refresh](/tui/providers/openai/refresh.md) |
| calls | [findOpenAiAuthFromProviders](/tui/providers/openai/findOpenAiAuthFromProviders.md) |
| calls | [findOpenAiAuthFromFiles](/tui/providers/openai/findOpenAiAuthFromFiles.md) |
| calls | [clearBoundarySchedule](/tui/providers/openai/clearBoundarySchedule.md) |
| calls | [cancelActiveRequest](/tui/providers/openai/cancelActiveRequest.md) |
| calls | [openAiRemainingPct](/tui/providers/openai/openAiRemainingPct.md) |
| calls | [setInterval](/tests/subagent-mounted/setInterval.md) |
| calls | [unref](/tui/providers/openai/unref.md) |
| calls | [clearInterval](/tests/subagent-mounted/clearInterval.md) |
| calls | [setNow](/tests/subagent-mounted/setNow.md) |
| calls | [resetEpochMs](/tui/providers/openai/resetEpochMs.md) |
| calls | [mapOpenAiPanelState](/tui/providers/openai/mapOpenAiPanelState.md) |
| calls | [openAiHomeQuotaSummary](/tui/providers/openai/openAiHomeQuotaSummary.md) |
| calls | [freshnessFor](/tui/providers/openai/freshnessFor.md) |
| calls | [dispose](/tui/providers/openai/dispose.md) |
