---
okf_version: "0.2"
type: Function
title: wrapTextBuffer
resource: tests/subagent-mounted.fixture.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tests"
  - "domain:subagent-mounted.fixture.ts"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-20T01:15:53Z"
concept_id: tests/subagent-mounted/wrapTextBuffer
language: typescript
---

# wrapTextBuffer

## Signature

```typescript
function wrapTextBuffer(text: string, width: number, hasExplicitWidth: boolean): string[]
```

## Source
Lines 156–164 in `tests/subagent-mounted.fixture.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [subagent-mounted.fixture](/tests/subagent-mounted.fixture.md) |
| calls | [wrapCells](/tests/subagent-mounted/wrapCells.md) |
| called_by | [rowLayout](/tests/subagent-mounted/rowLayout.md) |
