---
okf_version: "0.2"
type: Function
title: resetEpochMs
resource: tui/providers/openai.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:providers"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-16T13:37:47Z"
concept_id: tui/providers/openai/resetEpochMs
language: typescript
---

# resetEpochMs

## Signature

```typescript
function resetEpochMs(window: RateLimitWindow, now: number): number
```

## Source
Lines 93–97 in `tui/providers/openai.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [openai](/tui/providers/openai.md) |
| calls | [safeNumber](/tui/providers/openai/safeNumber.md) |
| called_by | [createOpenAiProvider](/tui/providers/openai/createOpenAiProvider.md) |
| called_by | [quotaItems](/tui/providers/openai/quotaItems.md) |
