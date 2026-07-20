---
okf_version: "0.2"
type: Function
title: openCodeGoTimer
resource: tui/providers/opencode-go.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:providers"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-16T13:37:47Z"
concept_id: tui/providers/opencode-go/openCodeGoTimer
language: typescript
---

# openCodeGoTimer

## Signature

```typescript
function openCodeGoTimer(window: OpenCodeGoWindow, now: number): "idle" | "countdown" | "expired"
```

## Source
Lines 495–498 in `tui/providers/opencode-go.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [opencode-go](/tui/providers/opencode-go.md) |
| called_by | [openCodeGoWindowItems](/tui/providers/opencode-go/openCodeGoWindowItems.md) |
