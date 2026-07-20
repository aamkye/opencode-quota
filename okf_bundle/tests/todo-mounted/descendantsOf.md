---
okf_version: "0.2"
type: Function
title: descendantsOf
resource: tests/todo-mounted.fixture.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tests"
  - "domain:todo-mounted.fixture.ts"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-20T11:36:58Z"
concept_id: tests/todo-mounted/descendantsOf
language: typescript
---

# descendantsOf

## Signature

```typescript
function descendantsOf(nodes: readonly MountedNode[], parent: MountedNode): MountedNode[]
```

## Source
Lines 60–69 in `tests/todo-mounted.fixture.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [todo-mounted.fixture](/tests/todo-mounted.fixture.md) |
| calls | [filter](/tui/quota/filter.md) |
| called_by | [mountTodoPanel](/tests/todo-mounted/mountTodoPanel.md) |
| called_by | [view](/tests/todo-mounted/view.md) |
