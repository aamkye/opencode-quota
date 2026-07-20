---
okf_version: "0.2"
type: Function
title: mapOpenAiPanelState
resource: tui/providers/openai.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:providers"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-16T13:37:47Z"
concept_id: tui/providers/openai/mapOpenAiPanelState
language: typescript
---

# mapOpenAiPanelState

## Signature

```typescript
function mapOpenAiPanelState(state: OpenAiPanelState): PanelModel
```

## Source
Lines 258–287 in `tui/providers/openai.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [openai](/tui/providers/openai.md) |
| calls | [header](/tui/providers/openai/header.md) |
| calls | [quotaItems](/tui/providers/openai/quotaItems.md) |
| calls | [openAiRemainingPct](/tui/providers/openai/openAiRemainingPct.md) |
| called_by | [createOpenAiProvider](/tui/providers/openai/createOpenAiProvider.md) |
