---
okf_version: "0.2"
type: Function
title: safeNumber
resource: tui/providers/openai.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:providers"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-16T13:37:47Z"
concept_id: tui/providers/openai/safeNumber
language: typescript
---

# safeNumber

## Signature

```typescript
function safeNumber(value: unknown, fallback: number): number
```

## Source
Lines 88–91 in `tui/providers/openai.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [openai](/tui/providers/openai.md) |
| called_by | [openAiRemainingPct](/tui/providers/openai/openAiRemainingPct.md) |
| called_by | [resetEpochMs](/tui/providers/openai/resetEpochMs.md) |
