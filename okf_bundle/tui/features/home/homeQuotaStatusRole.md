---
okf_version: "0.2"
type: Function
title: homeQuotaStatusRole
resource: tui/features/home.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:features"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-17T13:34:37Z"
concept_id: tui/features/home/homeQuotaStatusRole
language: typescript
---

# homeQuotaStatusRole

## Signature

```typescript
function homeQuotaStatusRole(remainingPct: number): "error" | "warning" | "success"
```

## Source
Lines 16–18 in `tui/features/home.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [home](/tui/features/home.md) |
| called_by | [HomeQuotaLine](/tui/home/HomeQuotaLine.md) |
