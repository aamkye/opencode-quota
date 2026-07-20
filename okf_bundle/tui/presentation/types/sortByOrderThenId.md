---
okf_version: "0.2"
type: Function
title: sortByOrderThenId
resource: tui/presentation/types.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:presentation"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-16T09:08:41Z"
concept_id: tui/presentation/types/sortByOrderThenId
language: typescript
---

# sortByOrderThenId

## Signature

```typescript
function sortByOrderThenId(items: readonly T[]): T[]
```

## Type Parameters

- `T extends { id: string; order: number }`

## Source
Lines 113–115 in `tui/presentation/types.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [types](/tui/presentation/types.md) |
| called_by | [composeQuotaPanel](/tui/features/quota/composeQuotaPanel.md) |
| called_by | [providerItemGroups](/tui/features/quota/providerItemGroups.md) |
| called_by | [providerItems](/tui/features/quota/providerItems.md) |
| called_by | [normalizeGroup](/tui/presentation/renderer/normalizeGroup.md) |
| called_by | [normalizeItem](/tui/presentation/renderer/normalizeItem.md) |
| called_by | [normalizePanelModel](/tui/presentation/renderer/normalizePanelModel.md) |
