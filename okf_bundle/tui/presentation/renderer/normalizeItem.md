---
okf_version: "0.2"
type: Function
title: normalizeItem
resource: tui/presentation/renderer.tsx
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:presentation"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-17T13:34:37Z"
concept_id: tui/presentation/renderer/normalizeItem
language: typescript
---

# normalizeItem

## Signature

```typescript
function normalizeItem(item: PanelItem, availableCells: number, now: number): NormalizedItem
```

## Source
Lines 127–198 in `tui/presentation/renderer.tsx`

## Relationships

| Type | Target |
|------|--------|
| related | [renderer](/tui/presentation/renderer.md) |
| calls | [truncateText](/tui/presentation/format/truncateText.md) |
| calls | [formatPercent](/tui/presentation/format/formatPercent.md) |
| calls | [allocateProgressRow](/tui/presentation/layout/allocateProgressRow.md) |
| calls | [formatTimer](/tui/presentation/format/formatTimer.md) |
| calls | [formatItemQuantity](/tui/presentation/renderer/formatItemQuantity.md) |
| calls | [sortByOrderThenId](/tui/presentation/types/sortByOrderThenId.md) |
| calls | [allocateCompactTable](/tui/presentation/layout/allocateCompactTable.md) |
| calls | [formatDisplayCell](/tui/presentation/renderer/formatDisplayCell.md) |
| called_by | [normalizeGroup](/tui/presentation/renderer/normalizeGroup.md) |
