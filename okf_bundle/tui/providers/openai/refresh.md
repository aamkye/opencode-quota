---
okf_version: "0.2"
type: Function
title: refresh
resource: tui/providers/openai.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:providers"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-16T13:37:47Z"
concept_id: tui/providers/openai/refresh
language: typescript
---

# refresh

## Signature

```typescript
const refresh = () =>: Promise<void>
```

## Source
Lines 347–392 in `tui/providers/openai.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [openai](/tui/providers/openai.md) |
| calls | [resolve](/tests/plugin-build/resolve.md) |
| calls | [fetchOpenAiQuota](/tui/providers/openai/fetchOpenAiQuota.md) |
| calls | [quotaData](/tui/providers/openai/quotaData.md) |
| called_by | [createOpenAiProvider](/tui/providers/openai/createOpenAiProvider.md) |
| called_by | [settled](/tui/providers/openai/settled.md) |
