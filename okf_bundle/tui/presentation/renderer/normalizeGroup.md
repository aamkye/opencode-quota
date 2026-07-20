---
okf_version: "0.2"
type: Function
title: normalizeGroup
resource: tui/presentation/renderer.tsx
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:presentation"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-17T13:34:37Z"
concept_id: tui/presentation/renderer/normalizeGroup
language: typescript
---

# normalizeGroup

## Signature

```typescript
function normalizeGroup(group: PanelGroup, availableCells: number, now: number): NormalizedGroup
```

## Source
Lines 200–212 in `tui/presentation/renderer.tsx`

## Relationships

| Type | Target |
|------|--------|
| related | [renderer](/tui/presentation/renderer.md) |
| calls | [sortByOrderThenId](/tui/presentation/types/sortByOrderThenId.md) |
| calls | [normalizeItem](/tui/presentation/renderer/normalizeItem.md) |
| called_by | [normalizePanelModel](/tui/presentation/renderer/normalizePanelModel.md) |
