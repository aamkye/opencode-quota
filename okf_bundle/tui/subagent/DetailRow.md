---
okf_version: "0.2"
type: Function
title: DetailRow
resource: tui/subagent.tsx
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:subagent.tsx"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-20T01:15:53Z"
concept_id: tui/subagent/DetailRow
language: typescript
---

# DetailRow

## Signature

```typescript
function DetailRow(props: {
  label: string
  value: string
  status?: PanelStatus
  theme: () => PanelTheme
})
```

## Source
Lines 111–140 in `tui/subagent.tsx`

## Relationships

| Type | Target |
|------|--------|
| related | [subagent](/tui/subagent.md) |
| calls | [theme](/tui/quota/theme.md) |
