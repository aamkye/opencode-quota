---
okf_version: "0.2"
type: Function
title: truncateCells
resource: tests/subagent-mounted.fixture.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tests"
  - "domain:subagent-mounted.fixture.ts"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-20T01:15:53Z"
concept_id: tests/subagent-mounted/truncateCells
language: typescript
---

# truncateCells

## Signature

```typescript
function truncateCells(text: string, width: number): string
```

## Source
Lines 129–136 in `tests/subagent-mounted.fixture.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [subagent-mounted.fixture](/tests/subagent-mounted.fixture.md) |
| calls | [cellWidth](/tests/subagent-mounted/cellWidth.md) |
| calls | [takeCells](/tests/subagent-mounted/takeCells.md) |
| called_by | [rowLayout](/tests/subagent-mounted/rowLayout.md) |
