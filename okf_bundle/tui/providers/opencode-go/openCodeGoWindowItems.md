---
okf_version: "0.2"
type: Function
title: openCodeGoWindowItems
resource: tui/providers/opencode-go.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:providers"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-16T13:37:47Z"
concept_id: tui/providers/opencode-go/openCodeGoWindowItems
language: typescript
---

# openCodeGoWindowItems

## Signature

```typescript
function openCodeGoWindowItems(
  id: "5h" | "7d" | "1m",
  label: "5H" | "7D" | "1M",
  order: 20 | 40 | 60,
  window: OpenCodeGoWindow,
  now: number,
): PanelItem[]
```

## Source
Lines 500–511 in `tui/providers/opencode-go.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [opencode-go](/tui/providers/opencode-go.md) |
| calls | [openCodeGoTimer](/tui/providers/opencode-go/openCodeGoTimer.md) |
| called_by | [mapOpenCodeGoPanelState](/tui/providers/opencode-go/mapOpenCodeGoPanelState.md) |
