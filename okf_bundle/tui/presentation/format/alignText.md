---
okf_version: "0.2"
type: Function
title: alignText
resource: tui/presentation/format.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:presentation"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-20T08:46:32Z"
concept_id: tui/presentation/format/alignText
language: typescript
---

# alignText

## Signature

```typescript
function alignText(text: string, width: number, alignment: TextAlignment = "left"): string
```

## Source
Lines 87–97 in `tui/presentation/format.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [format](/tui/presentation/format.md) |
| called_by | [renderCell](/tui/presentation/renderer/renderCell.md) |
