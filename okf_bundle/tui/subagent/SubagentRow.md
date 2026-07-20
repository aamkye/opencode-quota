---
okf_version: "0.2"
type: Function
title: SubagentRow
resource: tui/subagent.tsx
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:subagent.tsx"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-20T01:15:53Z"
concept_id: tui/subagent/SubagentRow
language: typescript
---

# SubagentRow

## Signature

```typescript
function SubagentRow(props: {
  entry: SubagentEntry
  expanded: boolean
  onToggle(): void
  onOpenSession(): void
  theme: () => PanelTheme
})
```

## Source
Lines 142–187 in `tui/subagent.tsx`

## Relationships

| Type | Target |
|------|--------|
| related | [subagent](/tui/subagent.md) |
| calls | [statusRole](/tui/subagent/statusRole.md) |
| calls | [allocateSubagentEntryRow](/tui/features/subagent/allocateSubagentEntryRow.md) |
| calls | [allocation](/tui/subagent/allocation.md) |
| calls | [theme](/tui/quota/theme.md) |
| calls | [role](/tui/subagent/role.md) |
