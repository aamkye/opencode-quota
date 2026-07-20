---
okf_version: "0.2"
type: Function
title: rowLayout
resource: tests/subagent-mounted.fixture.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tests"
  - "domain:subagent-mounted.fixture.ts"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-20T01:15:53Z"
concept_id: tests/subagent-mounted/rowLayout
language: typescript
---

# rowLayout

## Signature

```typescript
function rowLayout(row: HostNode, width: number)
```

## Source
Lines 174–252 in `tests/subagent-mounted.fixture.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [subagent-mounted.fixture](/tests/subagent-mounted.fixture.md) |
| calls | [resolvedWidth](/tests/subagent-mounted/resolvedWidth.md) |
| calls | [filter](/tui/quota/filter.md) |
| calls | [cellWidth](/tests/subagent-mounted/cellWidth.md) |
| calls | [textOf](/tests/subagent-mounted/textOf.md) |
| calls | [truncateCells](/tests/subagent-mounted/truncateCells.md) |
| calls | [takeCells](/tests/subagent-mounted/takeCells.md) |
| calls | [wrappingText](/tests/subagent-mounted/wrappingText.md) |
| calls | [wrapTextBuffer](/tests/subagent-mounted/wrapTextBuffer.md) |
| called_by | [mountSubagentPanel](/tests/subagent-mounted/mountSubagentPanel.md) |
| called_by | [view](/tests/subagent-mounted/view.md) |
