---
okf_version: "0.2"
type: Function
title: allocateCompactTable
resource: tui/presentation/layout.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:presentation"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-17T13:34:37Z"
concept_id: tui/presentation/layout/allocateCompactTable
language: typescript
---

# allocateCompactTable

## Signature

```typescript
function allocateCompactTable(
  availableCells: number,
  columns: { identity?: number; key: number; value: number },
): CompactTableAllocation
```

## Source
Lines 72–92 in `tui/presentation/layout.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [layout](/tui/presentation/layout.md) |
| called_by | [normalizeItem](/tui/presentation/renderer/normalizeItem.md) |
