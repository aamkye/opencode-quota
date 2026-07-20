---
okf_version: "0.2"
type: Function
title: renderRow
resource: tui/presentation/renderer.tsx
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:presentation"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-17T13:34:37Z"
concept_id: tui/presentation/renderer/renderRow
language: typescript
---

# renderRow

## Signature

```typescript
const renderRow = (cells: { text: string; status?: PanelStatus }[]) =>
```

## Source
Lines 298–311 in `tui/presentation/renderer.tsx`

## Relationships

| Type | Target |
|------|--------|
| related | [renderer](/tui/presentation/renderer.md) |
| calls | [renderCell](/tui/presentation/renderer/renderCell.md) |
| called_by | [renderItemLayout](/tui/presentation/renderer/renderItemLayout.md) |
