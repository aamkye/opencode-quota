---
okf_version: "0.2"
type: Function
title: allocateSubagentEntryRow
resource: tui/features/subagent.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:features"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-20T01:15:53Z"
concept_id: tui/features/subagent/allocateSubagentEntryRow
language: typescript
---

# allocateSubagentEntryRow

## Signature

```typescript
function allocateSubagentEntryRow(
  availableCells: number,
  durationCells: number,
): SubagentEntryRowAllocation
```

## Source
Lines 74–87 in `tui/features/subagent.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [subagent](/tui/features/subagent.md) |
| calls | [normalizedCells](/tui/features/subagent/normalizedCells.md) |
| called_by | [SubagentRow](/tui/subagent/SubagentRow.md) |
| called_by | [allocation](/tui/subagent/allocation.md) |
