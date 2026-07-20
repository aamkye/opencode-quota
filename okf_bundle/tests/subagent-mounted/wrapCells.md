---
okf_version: "0.2"
type: Function
title: wrapCells
resource: tests/subagent-mounted.fixture.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tests"
  - "domain:subagent-mounted.fixture.ts"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-20T01:15:53Z"
concept_id: tests/subagent-mounted/wrapCells
language: typescript
---

# wrapCells

## Signature

```typescript
function wrapCells(text: string, width: number): string[]
```

## Source
Lines 138–149 in `tests/subagent-mounted.fixture.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [subagent-mounted.fixture](/tests/subagent-mounted.fixture.md) |
| calls | [takeCells](/tests/subagent-mounted/takeCells.md) |
| called_by | [wrapTextBuffer](/tests/subagent-mounted/wrapTextBuffer.md) |
