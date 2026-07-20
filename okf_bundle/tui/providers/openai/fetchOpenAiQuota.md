---
okf_version: "0.2"
type: Function
title: fetchOpenAiQuota
resource: tui/providers/openai.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:providers"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-16T13:37:47Z"
concept_id: tui/providers/openai/fetchOpenAiQuota
language: typescript
---

# fetchOpenAiQuota

## Signature

```typescript
function fetchOpenAiQuota(auth: OpenAiAuthEntry, signal?: AbortSignal): Promise<OpenAiQuotaData | null>
```

## Source
Lines 149–196 in `tui/providers/openai.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [openai](/tui/providers/openai.md) |
| calls | [error](/tests/subagent-source/error.md) |
| calls | [decodeJwtAccountId](/tui/providers/openai/decodeJwtAccountId.md) |
| calls | [derivePlanLabel](/tui/providers/openai/derivePlanLabel.md) |
| called_by | [createOpenAiProvider](/tui/providers/openai/createOpenAiProvider.md) |
| called_by | [refresh](/tui/providers/openai/refresh.md) |
