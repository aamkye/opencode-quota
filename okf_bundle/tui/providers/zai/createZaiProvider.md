---
okf_version: "0.2"
type: Function
title: createZaiProvider
resource: tui/providers/zai.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:providers"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-16T13:37:47Z"
concept_id: tui/providers/zai/createZaiProvider
language: typescript
---

# createZaiProvider

## Signature

```typescript
function createZaiProvider(api: TuiPluginApi, options: QuotaProviderOptions = {}): QuotaProviderAdapter
```

## Source
Lines 405–652 in `tui/providers/zai.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [zai](/tui/providers/zai.md) |
| calls | [providerRefreshInterval](/tui/providers/zai/providerRefreshInterval.md) |
| calls | [resolve](/tests/plugin-build/resolve.md) |
| calls | [fetchZaiQuota](/tui/providers/zai/fetchZaiQuota.md) |
| calls | [quotaData](/tui/providers/zai/quotaData.md) |
| calls | [refresh](/tui/providers/zai/refresh.md) |
| calls | [findZaiKeyFromProviders](/tui/providers/zai/findZaiKeyFromProviders.md) |
| calls | [findZaiKeyFromFiles](/tui/providers/zai/findZaiKeyFromFiles.md) |
| calls | [clearBoundarySchedule](/tui/providers/zai/clearBoundarySchedule.md) |
| calls | [cancelActiveRequest](/tui/providers/zai/cancelActiveRequest.md) |
| calls | [setInterval](/tests/subagent-mounted/setInterval.md) |
| calls | [unref](/tui/providers/zai/unref.md) |
| calls | [clearInterval](/tests/subagent-mounted/clearInterval.md) |
| calls | [sessionID](/tui/ses-tokens/sessionID.md) |
| calls | [scanMessageParts](/tui/providers/zai/scanMessageParts.md) |
| calls | [setNow](/tests/subagent-mounted/setNow.md) |
| calls | [mapZaiPanelState](/tui/providers/zai/mapZaiPanelState.md) |
| calls | [zaiHomeQuotaSummary](/tui/providers/zai/zaiHomeQuotaSummary.md) |
| calls | [freshnessFor](/tui/providers/zai/freshnessFor.md) |
| calls | [setSessionID](/tui/providers/zai/setSessionID.md) |
| calls | [dispose](/tui/providers/zai/dispose.md) |
