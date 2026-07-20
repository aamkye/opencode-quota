---
okf_version: "0.2"
type: Function
title: homeQuotaPercentParts
resource: tui/features/home.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:features"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-17T13:34:37Z"
concept_id: tui/features/home/homeQuotaPercentParts
language: typescript
---

# homeQuotaPercentParts

## Signature

```typescript
function homeQuotaPercentParts(summary: HomeQuotaSummary): { text: string; pct: number }[]
```

## Source
Lines 8–14 in `tui/features/home.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [home](/tui/features/home.md) |
| called_by | [HomeQuotaLine](/tui/home/HomeQuotaLine.md) |
| called_by | [primary](/tui/home/primary.md) |
| called_by | [secondary](/tui/home/secondary.md) |
