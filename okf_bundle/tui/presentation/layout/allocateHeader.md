---
okf_version: "0.2"
type: Function
title: allocateHeader
resource: tui/presentation/layout.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:presentation"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-17T13:34:37Z"
concept_id: tui/presentation/layout/allocateHeader
language: typescript
---

# allocateHeader

## Signature

```typescript
function allocateHeader(availableCells: number, _label: string, summary?: string): HeaderAllocation
```

## Source
Lines 32–46 in `tui/presentation/layout.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [layout](/tui/presentation/layout.md) |
| called_by | [normalizePanelModel](/tui/presentation/renderer/normalizePanelModel.md) |
| called_by | [renderPanelLayout](/tui/presentation/renderer/renderPanelLayout.md) |
