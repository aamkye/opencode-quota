---
okf_version: "0.2"
type: Function
title: renderCell
resource: tui/presentation/renderer.tsx
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:presentation"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-17T13:34:37Z"
concept_id: tui/presentation/renderer/renderCell
language: typescript
---

# renderCell

## Signature

```typescript
function renderCell(text: string, width: number, align: PanelAlignment, status?: PanelStatus): RenderedCell
```

## Source
Lines 245–248 in `tui/presentation/renderer.tsx`

## Relationships

| Type | Target |
|------|--------|
| related | [renderer](/tui/presentation/renderer.md) |
| calls | [alignText](/tui/presentation/format/alignText.md) |
| calls | [truncateText](/tui/presentation/format/truncateText.md) |
| called_by | [renderItemLayout](/tui/presentation/renderer/renderItemLayout.md) |
| called_by | [renderPanelLayout](/tui/presentation/renderer/renderPanelLayout.md) |
| called_by | [renderRow](/tui/presentation/renderer/renderRow.md) |
| called_by | [renderSegmentCells](/tui/presentation/renderer/renderSegmentCells.md) |
