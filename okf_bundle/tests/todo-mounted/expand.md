---
okf_version: "0.2"
type: Function
title: expand
resource: tests/todo-mounted.fixture.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tests"
  - "domain:todo-mounted.fixture.ts"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-20T11:36:58Z"
concept_id: tests/todo-mounted/expand
language: typescript
---

# expand

## Signature

```typescript
function expand(value: unknown, parent?: MountedNode): MountedNode[]
```

## Source
Lines 39–58 in `tests/todo-mounted.fixture.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [todo-mounted.fixture](/tests/todo-mounted.fixture.md) |
| calls | [isElement](/tests/todo-mounted/isElement.md) |
| called_by | [mountTodoPanel](/tests/todo-mounted/mountTodoPanel.md) |
| called_by | [view](/tests/todo-mounted/view.md) |
