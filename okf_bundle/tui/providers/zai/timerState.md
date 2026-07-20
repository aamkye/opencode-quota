---
okf_version: "0.2"
type: Function
title: timerState
resource: tui/providers/zai.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:providers"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-16T13:37:47Z"
concept_id: tui/providers/zai/timerState
language: typescript
---

# timerState

## Signature

```typescript
function timerState(remainingPct: number, epoch: number, now: number): "unavailable" | "idle" | "countdown" | "expired"
```

## Source
Lines 156–160 in `tui/providers/zai.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [zai](/tui/providers/zai.md) |
| called_by | [mapZaiPanelState](/tui/providers/zai/mapZaiPanelState.md) |
| called_by | [quotaItems](/tui/providers/zai/quotaItems.md) |
