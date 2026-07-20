---
okf_version: "0.2"
type: Function
title: renderSegmentCells
resource: tui/presentation/renderer.tsx
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:presentation"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-17T13:34:37Z"
concept_id: tui/presentation/renderer/renderSegmentCells
language: typescript
---

# renderSegmentCells

## Signature

```typescript
function renderSegmentCells(segments: readonly PanelTextSegment[], width: number): RenderedCell[]
```

## Source
Lines 250–260 in `tui/presentation/renderer.tsx`

## Relationships

| Type | Target |
|------|--------|
| related | [renderer](/tui/presentation/renderer.md) |
| calls | [renderCell](/tui/presentation/renderer/renderCell.md) |
| called_by | [renderPanelLayout](/tui/presentation/renderer/renderPanelLayout.md) |
