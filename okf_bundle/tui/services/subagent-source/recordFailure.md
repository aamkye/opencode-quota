---
okf_version: "0.2"
type: Function
title: recordFailure
resource: tui/services/subagent-source.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:services"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-20T01:15:53Z"
concept_id: tui/services/subagent-source/recordFailure
language: typescript
---

# recordFailure

## Signature

```typescript
function recordFailure(childID: string): void
```

## Source
Lines 254–271 in `tui/services/subagent-source.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [subagent-source](/tui/services/subagent-source.md) |
| calls | [invalidate](/tui/services/subagent-source/invalidate.md) |
| calls | [isCurrentGeneration](/tui/services/subagent-source/isCurrentGeneration.md) |
| calls | [persistFailures](/tui/services/subagent-source/persistFailures.md) |
| calls | [publishFailureTimes](/tui/services/subagent-source/publishFailureTimes.md) |
| calls | [scheduleRefresh](/tui/services/subagent-source/scheduleRefresh.md) |
| called_by | [createSubagentSource](/tui/services/subagent-source/createSubagentSource.md) |
