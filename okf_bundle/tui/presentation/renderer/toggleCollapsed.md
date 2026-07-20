---
okf_version: "0.2"
type: Function
title: toggleCollapsed
resource: tui/presentation/renderer.tsx
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:presentation"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-17T13:34:37Z"
concept_id: tui/presentation/renderer/toggleCollapsed
language: typescript
---

# toggleCollapsed

## Signature

```typescript
function toggleCollapsed(collapsed: ReadonlySet<string>, id: string): Set<string>
```

## Source
Lines 328–333 in `tui/presentation/renderer.tsx`

## Relationships

| Type | Target |
|------|--------|
| related | [renderer](/tui/presentation/renderer.md) |
| called_by | [PanelRenderer](/tui/presentation/renderer/PanelRenderer.md) |
| called_by | [toggle](/tui/presentation/renderer/toggle.md) |
