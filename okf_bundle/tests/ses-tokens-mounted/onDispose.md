---
okf_version: "0.2"
type: Function
title: onDispose
resource: tests/ses-tokens-mounted.fixture.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tests"
  - "domain:ses-tokens-mounted.fixture.ts"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-20T09:11:20Z"
concept_id: tests/ses-tokens-mounted/onDispose
language: typescript
---

# onDispose

## Signature

```typescript
onDispose(cleanup: () => void | Promise<void>)
```

## Source
Lines 169–172 in `tests/ses-tokens-mounted.fixture.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [ses-tokens-mounted.fixture](/tests/ses-tokens-mounted.fixture.md) |
| calls | [filter](/tui/quota/filter.md) |
