---
okf_version: "0.2"
type: Function
title: truncateText
resource: tui/presentation/format.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:presentation"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-20T08:46:32Z"
concept_id: tui/presentation/format/truncateText
language: typescript
---

# truncateText

## Signature

```typescript
function truncateText(text: string, width: number, marker = "…"): string
```

## Source
Lines 99–104 in `tui/presentation/format.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [format](/tui/presentation/format.md) |
| called_by | [normalizeItem](/tui/presentation/renderer/normalizeItem.md) |
| called_by | [normalizePanelModel](/tui/presentation/renderer/normalizePanelModel.md) |
| called_by | [renderCell](/tui/presentation/renderer/renderCell.md) |
