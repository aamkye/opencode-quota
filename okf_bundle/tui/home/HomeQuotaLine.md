---
okf_version: "0.2"
type: Function
title: HomeQuotaLine
resource: tui/home.tsx
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:home.tsx"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-17T13:34:37Z"
concept_id: tui/home/HomeQuotaLine
language: typescript
---

# HomeQuotaLine

## Signature

```typescript
function HomeQuotaLine(props: { summary: HomeQuotaSummary; theme: () => { error: string; warning: string; success: string; textMuted: string } })
```

## Source
Lines 37–50 in `tui/home.tsx`

## Relationships

| Type | Target |
|------|--------|
| related | [home](/tui/home.md) |
| calls | [homeQuotaPercentParts](/tui/features/home/homeQuotaPercentParts.md) |
| calls | [theme](/tui/quota/theme.md) |
| calls | [homeQuotaStatusRole](/tui/features/home/homeQuotaStatusRole.md) |
| calls | [primary](/tui/home/primary.md) |
| calls | [secondary](/tui/home/secondary.md) |
