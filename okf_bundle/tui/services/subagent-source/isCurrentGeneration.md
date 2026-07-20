---
okf_version: "0.2"
type: Function
title: isCurrentGeneration
resource: tui/services/subagent-source.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:services"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-20T01:15:53Z"
concept_id: tui/services/subagent-source/isCurrentGeneration
language: typescript
---

# isCurrentGeneration

## Signature

```typescript
function isCurrentGeneration(capturedParentID: string, capturedGeneration: number): boolean
```

## Source
Lines 127–129 in `tui/services/subagent-source.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [subagent-source](/tui/services/subagent-source.md) |
| called_by | [createSubagentSource](/tui/services/subagent-source/createSubagentSource.md) |
| called_by | [recordFailure](/tui/services/subagent-source/recordFailure.md) |
| called_by | [scheduleRefresh](/tui/services/subagent-source/scheduleRefresh.md) |
| called_by | [startRefresh](/tui/services/subagent-source/startRefresh.md) |
