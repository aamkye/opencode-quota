---
okf_version: "0.2"
type: Function
title: descendantsOf
resource: tests/context-mounted.fixture.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tests"
  - "domain:context-mounted.fixture.ts"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-18T18:47:16Z"
concept_id: tests/context-mounted/descendantsOf
language: typescript
---

# descendantsOf

## Signature

```typescript
function descendantsOf(nodes: readonly MountedNode[], parent: MountedNode): MountedNode[]
```

## Source
Lines 58–67 in `tests/context-mounted.fixture.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [context-mounted.fixture](/tests/context-mounted.fixture.md) |
| calls | [filter](/tui/quota/filter.md) |
| called_by | [mountContextPanel](/tests/context-mounted/mountContextPanel.md) |
| called_by | [view](/tests/context-mounted/view.md) |
