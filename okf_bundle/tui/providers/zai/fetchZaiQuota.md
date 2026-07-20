---
okf_version: "0.2"
type: Function
title: fetchZaiQuota
resource: tui/providers/zai.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:providers"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-16T13:37:47Z"
concept_id: tui/providers/zai/fetchZaiQuota
language: typescript
---

# fetchZaiQuota

## Signature

```typescript
function fetchZaiQuota(apiKey: string, signal?: AbortSignal): Promise<ZaiQuotaData | null>
```

## Source
Lines 201–266 in `tui/providers/zai.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [zai](/tui/providers/zai.md) |
| calls | [filter](/tui/quota/filter.md) |
| calls | [find](/tui/quota/find.md) |
| calls | [safeNumber](/tui/providers/zai/safeNumber.md) |
| calls | [clampPct](/tui/providers/zai/clampPct.md) |
| calls | [absolute](/tui/providers/zai/absolute.md) |
| calls | [error](/tests/subagent-source/error.md) |
| called_by | [createZaiProvider](/tui/providers/zai/createZaiProvider.md) |
| called_by | [refresh](/tui/providers/zai/refresh.md) |
