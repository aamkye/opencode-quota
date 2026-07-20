---
okf_version: "0.2"
type: Function
title: invalidate
resource: tui/services/subagent-source.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:services"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-20T01:15:53Z"
concept_id: tui/services/subagent-source/invalidate
language: typescript
---

# invalidate

## Signature

```typescript
function invalidate(): number
```

## Source
Lines 217–223 in `tui/services/subagent-source.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [subagent-source](/tui/services/subagent-source.md) |
| calls | [clearRetryTimers](/tui/services/subagent-source/clearRetryTimers.md) |
| called_by | [createSubagentSource](/tui/services/subagent-source/createSubagentSource.md) |
| called_by | [invalidateAndSchedule](/tui/services/subagent-source/invalidateAndSchedule.md) |
| called_by | [recordFailure](/tui/services/subagent-source/recordFailure.md) |
