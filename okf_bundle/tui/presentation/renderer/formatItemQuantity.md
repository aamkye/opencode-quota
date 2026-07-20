---
okf_version: "0.2"
type: Function
title: formatItemQuantity
resource: tui/presentation/renderer.tsx
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:presentation"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-17T13:34:37Z"
concept_id: tui/presentation/renderer/formatItemQuantity
language: typescript
---

# formatItemQuantity

## Signature

```typescript
function formatItemQuantity(item: Extract<PanelItem, { kind: "quantity" }>): string
```

## Source
Lines 118–125 in `tui/presentation/renderer.tsx`

## Relationships

| Type | Target |
|------|--------|
| related | [renderer](/tui/presentation/renderer.md) |
| calls | [formatDisplayValue](/tui/presentation/renderer/formatDisplayValue.md) |
| called_by | [normalizeItem](/tui/presentation/renderer/normalizeItem.md) |
