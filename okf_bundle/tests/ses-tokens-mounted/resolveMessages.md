---
okf_version: "0.2"
type: Function
title: resolveMessages
resource: tests/ses-tokens-mounted.fixture.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tests"
  - "domain:ses-tokens-mounted.fixture.ts"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-20T09:11:20Z"
concept_id: tests/ses-tokens-mounted/resolveMessages
language: typescript
---

# resolveMessages

## Signature

```typescript
resolveMessages(
      sessionID: string,
      result: ClientResult<readonly { info: unknown }[]> = { data: readyMessages.map((info) => ({ info })) },
    )
```

## Source
Lines 385–394 in `tests/ses-tokens-mounted.fixture.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [ses-tokens-mounted.fixture](/tests/ses-tokens-mounted.fixture.md) |
| calls | [resolve](/tests/plugin-build/resolve.md) |
| calls | [flushHost](/tests/ses-tokens-mounted/flushHost.md) |
