---
okf_version: "0.2"
type: Function
title: renderPanelLayout
resource: tui/presentation/renderer.tsx
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:presentation"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-17T13:34:37Z"
concept_id: tui/presentation/renderer/renderPanelLayout
language: typescript
---

# renderPanelLayout

## Signature

```typescript
function renderPanelLayout(model: PanelModel, options: RendererLayoutOptions = {}): RenderedPanelLayout
```

## Source
Lines 335–370 in `tui/presentation/renderer.tsx`

## Relationships

| Type | Target |
|------|--------|
| related | [renderer](/tui/presentation/renderer.md) |
| calls | [normalizePanelModel](/tui/presentation/renderer/normalizePanelModel.md) |
| calls | [allocateHeader](/tui/presentation/layout/allocateHeader.md) |
| calls | [renderCell](/tui/presentation/renderer/renderCell.md) |
| calls | [renderSegmentCells](/tui/presentation/renderer/renderSegmentCells.md) |
