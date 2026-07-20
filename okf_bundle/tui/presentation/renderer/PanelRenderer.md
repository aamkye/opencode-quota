---
okf_version: "0.2"
type: Function
title: PanelRenderer
resource: tui/presentation/renderer.tsx
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:presentation"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-17T13:34:37Z"
concept_id: tui/presentation/renderer/PanelRenderer
language: typescript
---

# PanelRenderer

## Signature

```typescript
function PanelRenderer(props: { model: Accessor<PanelModel>; theme: Accessor<PanelTheme>; initiallyCollapsed?: boolean })
```

## Source
Lines 487–535 in `tui/presentation/renderer.tsx`

## Relationships

| Type | Target |
|------|--------|
| related | [renderer](/tui/presentation/renderer.md) |
| calls | [setInterval](/tests/subagent-mounted/setInterval.md) |
| calls | [setNow](/tests/subagent-mounted/setNow.md) |
| calls | [clearInterval](/tests/subagent-mounted/clearInterval.md) |
| calls | [toggleCollapsed](/tui/presentation/renderer/toggleCollapsed.md) |
| calls | [normalizePanelModel](/tui/presentation/renderer/normalizePanelModel.md) |
| calls | [panelCollapsed](/tui/presentation/renderer/panelCollapsed.md) |
| calls | [normalized](/tui/presentation/renderer/normalized.md) |
| calls | [toggle](/tui/presentation/renderer/toggle.md) |
| calls | [theme](/tui/quota/theme.md) |
| calls | [groupCollapsed](/tui/presentation/renderer/groupCollapsed.md) |
| calls | [isLastGroup](/tui/presentation/renderer/isLastGroup.md) |
| called_by | [mountPanel](/tests/presentation-mounted/mountPanel.md) |
