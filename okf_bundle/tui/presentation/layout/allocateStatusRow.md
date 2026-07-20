---
okf_version: "0.2"
type: Function
title: allocateStatusRow
resource: tui/presentation/layout.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:presentation"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-17T13:34:37Z"
concept_id: tui/presentation/layout/allocateStatusRow
language: typescript
---

# allocateStatusRow

## Signature

```typescript
function allocateStatusRow(availableCells: number, labelLength: number): StatusRowAllocation
```

## Source
Lines 59–70 in `tui/presentation/layout.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [layout](/tui/presentation/layout.md) |
| called_by | [CompactStatusRow](/tui/presentation/compact-panel/CompactStatusRow.md) |
| called_by | [allocation](/tui/presentation/compact-panel/allocation.md) |
