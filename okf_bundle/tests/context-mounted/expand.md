---
okf_version: "0.2"
type: Function
title: expand
resource: tests/context-mounted.fixture.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tests"
  - "domain:context-mounted.fixture.ts"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-18T18:47:16Z"
concept_id: tests/context-mounted/expand
language: typescript
---

# expand

## Signature

```typescript
function expand(value: unknown, parent?: MountedNode): MountedNode[]
```

## Source
Lines 43–57 in `tests/context-mounted.fixture.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [context-mounted.fixture](/tests/context-mounted.fixture.md) |
| calls | [isElement](/tests/context-mounted/isElement.md) |
| called_by | [mountContextPanel](/tests/context-mounted/mountContextPanel.md) |
| called_by | [view](/tests/context-mounted/view.md) |
