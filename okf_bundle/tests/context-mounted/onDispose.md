---
okf_version: "0.2"
type: Function
title: onDispose
resource: tests/context-mounted.fixture.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tests"
  - "domain:context-mounted.fixture.ts"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-18T18:47:16Z"
concept_id: tests/context-mounted/onDispose
language: typescript
---

# onDispose

## Signature

```typescript
onDispose(cleanup: () => void | Promise<void>)
```

## Source
Lines 89–92 in `tests/context-mounted.fixture.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [context-mounted.fixture](/tests/context-mounted.fixture.md) |
| calls | [filter](/tui/quota/filter.md) |
