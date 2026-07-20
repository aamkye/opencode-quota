---
okf_version: "0.2"
type: Function
title: HomeQuotaLines
resource: tui/home.tsx
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:home.tsx"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-17T13:34:37Z"
concept_id: tui/home/HomeQuotaLines
language: typescript
---

# HomeQuotaLines

## Signature

```typescript
function HomeQuotaLines(props: {
  providers: () => readonly QuotaProviderAdapter[]
  theme: () => { error: string; warning: string; success: string; textMuted: string }
})
```

## Source
Lines 52–63 in `tui/home.tsx`

## Relationships

| Type | Target |
|------|--------|
| related | [home](/tui/home.md) |
| calls | [providers](/tui/home/providers.md) |
