---
okf_version: "0.2"
type: Function
title: formatCurrency
resource: tui/presentation/format.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:presentation"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-20T08:46:32Z"
concept_id: tui/presentation/format/formatCurrency
language: typescript
---

# formatCurrency

## Signature

```typescript
function formatCurrency(value: number, precision = 2): string
```

## Source
Lines 59–62 in `tui/presentation/format.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [format](/tui/presentation/format.md) |
| called_by | [createContextPanelModel](/tui/features/context/createContextPanelModel.md) |
| called_by | [formatDisplayValue](/tui/presentation/renderer/formatDisplayValue.md) |
