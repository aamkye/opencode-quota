---
okf_version: "0.2"
type: Function
title: decodeJwtAccountId
resource: tui/providers/openai.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:providers"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-16T13:37:47Z"
concept_id: tui/providers/openai/decodeJwtAccountId
language: typescript
---

# decodeJwtAccountId

## Signature

```typescript
function decodeJwtAccountId(token: string): string | null
```

## Source
Lines 136–147 in `tui/providers/openai.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [openai](/tui/providers/openai.md) |
| called_by | [fetchOpenAiQuota](/tui/providers/openai/fetchOpenAiQuota.md) |
