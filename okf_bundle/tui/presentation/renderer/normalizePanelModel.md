---
okf_version: "0.2"
type: Function
title: normalizePanelModel
resource: tui/presentation/renderer.tsx
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:presentation"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-17T13:34:37Z"
concept_id: tui/presentation/renderer/normalizePanelModel
language: typescript
---

# normalizePanelModel

## Signature

```typescript
function normalizePanelModel(model: PanelModel, options: RendererNormalizationOptions = {}): NormalizedPanel
```

## Source
Lines 214–243 in `tui/presentation/renderer.tsx`

## Relationships

| Type | Target |
|------|--------|
| related | [renderer](/tui/presentation/renderer.md) |
| calls | [formatDisplayValue](/tui/presentation/renderer/formatDisplayValue.md) |
| calls | [truncateText](/tui/presentation/format/truncateText.md) |
| calls | [allocateHeader](/tui/presentation/layout/allocateHeader.md) |
| calls | [sortByOrderThenId](/tui/presentation/types/sortByOrderThenId.md) |
| calls | [normalizeGroup](/tui/presentation/renderer/normalizeGroup.md) |
| called_by | [PanelRenderer](/tui/presentation/renderer/PanelRenderer.md) |
| called_by | [normalized](/tui/presentation/renderer/normalized.md) |
| called_by | [renderPanelLayout](/tui/presentation/renderer/renderPanelLayout.md) |
