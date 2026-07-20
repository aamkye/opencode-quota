---
okf_version: "0.2"
type: Function
title: absolute
resource: tui/providers/zai.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:providers"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-16T13:37:47Z"
concept_id: tui/providers/zai/absolute
language: typescript
---

# absolute

## Signature

```typescript
const absolute = (limit: TokenLimit, usedPct: number) =>: AbsoluteQuota | null
```

## Source
Lines 222–232 in `tui/providers/zai.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [zai](/tui/providers/zai.md) |
| calls | [safeNumber](/tui/providers/zai/safeNumber.md) |
| calls | [clampPct](/tui/providers/zai/clampPct.md) |
| called_by | [fetchZaiQuota](/tui/providers/zai/fetchZaiQuota.md) |
