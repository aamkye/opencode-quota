---
okf_version: "0.2"
type: Function
title: findOpenAiAuthFromFiles
resource: tui/providers/openai.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:providers"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-16T13:37:47Z"
concept_id: tui/providers/openai/findOpenAiAuthFromFiles
language: typescript
---

# findOpenAiAuthFromFiles

## Signature

```typescript
function findOpenAiAuthFromFiles(): OpenAiAuthEntry | null
```

## Source
Lines 112–126 in `tui/providers/openai.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [openai](/tui/providers/openai.md) |
| calls | [error](/tests/subagent-source/error.md) |
| called_by | [createOpenAiProvider](/tui/providers/openai/createOpenAiProvider.md) |
