---
okf_version: "0.2"
type: Function
title: takeCells
resource: tests/subagent-mounted.fixture.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tests"
  - "domain:subagent-mounted.fixture.ts"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-20T01:15:53Z"
concept_id: tests/subagent-mounted/takeCells
language: typescript
---

# takeCells

## Signature

```typescript
function takeCells(text: string, width: number): string
```

## Source
Lines 117–127 in `tests/subagent-mounted.fixture.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [subagent-mounted.fixture](/tests/subagent-mounted.fixture.md) |
| calls | [cellWidth](/tests/subagent-mounted/cellWidth.md) |
| called_by | [rowLayout](/tests/subagent-mounted/rowLayout.md) |
| called_by | [truncateCells](/tests/subagent-mounted/truncateCells.md) |
| called_by | [wrapCells](/tests/subagent-mounted/wrapCells.md) |
