---
okf_version: "0.2"
type: Function
title: timerState
resource: tui/providers/openai.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:providers"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-16T13:37:47Z"
concept_id: tui/providers/openai/timerState
language: typescript
---

# timerState

## Signature

```typescript
function timerState(remainingPct: number, epoch: number, now: number): "unavailable" | "idle" | "countdown" | "expired"
```

## Source
Lines 207–211 in `tui/providers/openai.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [openai](/tui/providers/openai.md) |
| called_by | [quotaItems](/tui/providers/openai/quotaItems.md) |
