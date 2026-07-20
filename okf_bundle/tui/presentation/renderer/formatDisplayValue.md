---
okf_version: "0.2"
type: Function
title: formatDisplayValue
resource: tui/presentation/renderer.tsx
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:presentation"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-17T13:34:37Z"
concept_id: tui/presentation/renderer/formatDisplayValue
language: typescript
---

# formatDisplayValue

## Signature

```typescript
function formatDisplayValue(value: DisplayValue): string
```

## Source
Lines 99–112 in `tui/presentation/renderer.tsx`

## Relationships

| Type | Target |
|------|--------|
| related | [renderer](/tui/presentation/renderer.md) |
| calls | [formatCount](/tui/presentation/format/formatCount.md) |
| calls | [formatBytes](/tui/presentation/format/formatBytes.md) |
| calls | [formatDuration](/tui/presentation/format/formatDuration.md) |
| calls | [formatCurrency](/tui/presentation/format/formatCurrency.md) |
| called_by | [formatDisplayCell](/tui/presentation/renderer/formatDisplayCell.md) |
| called_by | [formatItemQuantity](/tui/presentation/renderer/formatItemQuantity.md) |
| called_by | [normalizePanelModel](/tui/presentation/renderer/normalizePanelModel.md) |
