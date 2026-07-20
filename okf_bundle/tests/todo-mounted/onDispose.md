---
okf_version: "0.2"
type: Function
title: onDispose
resource: tests/todo-mounted.fixture.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tests"
  - "domain:todo-mounted.fixture.ts"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-20T11:36:58Z"
concept_id: tests/todo-mounted/onDispose
language: typescript
---

# onDispose

## Signature

```typescript
onDispose(cleanup: () => void | Promise<void>)
```

## Source
Lines 116–119 in `tests/todo-mounted.fixture.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [todo-mounted.fixture](/tests/todo-mounted.fixture.md) |
| calls | [filter](/tui/quota/filter.md) |
