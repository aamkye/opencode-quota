---
okf_version: "0.2"
type: Function
title: assistantMessage
resource: tests/ses-tokens-mounted.fixture.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tests"
  - "domain:ses-tokens-mounted.fixture.ts"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-20T09:11:20Z"
concept_id: tests/ses-tokens-mounted/assistantMessage
language: typescript
---

# assistantMessage

## Signature

```typescript
function assistantMessage(sessionID: string, index: number, tokens: {
  input: number
  output: number
  reasoning: number
  cache: { read: number; write: number }
})
```

## Source
Lines 30–51 in `tests/ses-tokens-mounted.fixture.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [ses-tokens-mounted.fixture](/tests/ses-tokens-mounted.fixture.md) |
| called_by | [oneMessage](/tests/ses-tokens-mounted/oneMessage.md) |
