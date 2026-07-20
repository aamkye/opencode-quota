---
okf_version: "0.2"
type: Function
title: refresh
resource: tui/providers/zai.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:providers"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-16T13:37:47Z"
concept_id: tui/providers/zai/refresh
language: typescript
---

# refresh

## Signature

```typescript
const refresh = () =>: Promise<void>
```

## Source
Lines 459–504 in `tui/providers/zai.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [zai](/tui/providers/zai.md) |
| calls | [resolve](/tests/plugin-build/resolve.md) |
| calls | [fetchZaiQuota](/tui/providers/zai/fetchZaiQuota.md) |
| calls | [quotaData](/tui/providers/zai/quotaData.md) |
| called_by | [createZaiProvider](/tui/providers/zai/createZaiProvider.md) |
| called_by | [settled](/tui/providers/zai/settled.md) |
