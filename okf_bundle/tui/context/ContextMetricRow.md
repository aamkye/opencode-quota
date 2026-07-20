---
okf_version: "0.2"
type: Function
title: ContextMetricRow
resource: tui/context.tsx
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:context.tsx"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-18T18:47:16Z"
concept_id: tui/context/ContextMetricRow
language: typescript
---

# ContextMetricRow

## Signature

```typescript
function ContextMetricRow(props: {
  label: string
  value: string
  status?: PanelStatus
  theme: () => PanelTheme
})
```

## Source
Lines 15–29 in `tui/context.tsx`

## Relationships

| Type | Target |
|------|--------|
| related | [context](/tui/context.md) |
| calls | [theme](/tui/quota/theme.md) |
