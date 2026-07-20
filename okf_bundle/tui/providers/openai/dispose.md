---
okf_version: "0.2"
type: Function
title: dispose
resource: tui/providers/openai.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:providers"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-16T13:37:47Z"
concept_id: tui/providers/openai/dispose
language: typescript
---

# dispose

## Signature

```typescript
dispose(): void
```

## Source
Lines 489–496 in `tui/providers/openai.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [openai](/tui/providers/openai.md) |
| calls | [clearBoundarySchedule](/tui/providers/openai/clearBoundarySchedule.md) |
| calls | [cancelActiveRequest](/tui/providers/openai/cancelActiveRequest.md) |
| called_by | [createOpenAiProvider](/tui/providers/openai/createOpenAiProvider.md) |
