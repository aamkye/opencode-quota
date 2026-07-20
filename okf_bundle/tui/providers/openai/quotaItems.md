---
okf_version: "0.2"
type: Function
title: quotaItems
resource: tui/providers/openai.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:providers"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-16T13:37:47Z"
concept_id: tui/providers/openai/quotaItems
language: typescript
---

# quotaItems

## Signature

```typescript
function quotaItems(role: "primary" | "secondary", order: number, window: RateLimitWindow, now: number): PanelItem[]
```

## Source
Lines 240–256 in `tui/providers/openai.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [openai](/tui/providers/openai.md) |
| calls | [openAiRemainingPct](/tui/providers/openai/openAiRemainingPct.md) |
| calls | [resetEpochMs](/tui/providers/openai/resetEpochMs.md) |
| calls | [formatWindowDuration](/tui/providers/openai/formatWindowDuration.md) |
| calls | [timerState](/tui/providers/openai/timerState.md) |
| called_by | [mapOpenAiPanelState](/tui/providers/openai/mapOpenAiPanelState.md) |
