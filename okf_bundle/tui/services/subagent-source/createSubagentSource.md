---
okf_version: "0.2"
type: Function
title: createSubagentSource
resource: tui/services/subagent-source.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:services"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-20T01:15:53Z"
concept_id: tui/services/subagent-source/createSubagentSource
language: typescript
---

# createSubagentSource

## Signature

```typescript
function createSubagentSource({
  loadSnapshot,
  onEvent,
  loadFailures,
  saveFailures,
  now,
  setTimer,
  clearTimer,
}: SubagentSourceDependencies): SubagentSource
```

## Source
Lines 67–389 in `tui/services/subagent-source.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [subagent-source](/tui/services/subagent-source.md) |
| calls | [copyFailures](/tui/services/subagent-source/copyFailures.md) |
| calls | [loadFailures](/tests/subagent-source/loadFailures.md) |
| calls | [clearRetryTimers](/tui/services/subagent-source/clearRetryTimers.md) |
| calls | [saveFailures](/tests/subagent-source/saveFailures.md) |
| calls | [filter](/tui/quota/filter.md) |
| calls | [persistFailures](/tui/services/subagent-source/persistFailures.md) |
| calls | [isCurrent](/tui/services/subagent-source/isCurrent.md) |
| calls | [replaceKnownChildIDs](/tui/services/subagent-source/replaceKnownChildIDs.md) |
| calls | [pruneFailures](/tui/services/subagent-source/pruneFailures.md) |
| calls | [failureTimesFor](/tui/services/subagent-source/failureTimesFor.md) |
| calls | [notify](/tui/services/subagent-source/notify.md) |
| calls | [attemptLoad](/tui/services/subagent-source/attemptLoad.md) |
| calls | [isCurrentGeneration](/tui/services/subagent-source/isCurrentGeneration.md) |
| calls | [startRefresh](/tui/services/subagent-source/startRefresh.md) |
| calls | [invalidate](/tui/services/subagent-source/invalidate.md) |
| calls | [scheduleRefresh](/tui/services/subagent-source/scheduleRefresh.md) |
| calls | [publishFailureTimes](/tui/services/subagent-source/publishFailureTimes.md) |
| calls | [recoverUnknownTopology](/tui/services/subagent-source/recoverUnknownTopology.md) |
| calls | [invalidateAndSchedule](/tui/services/subagent-source/invalidateAndSchedule.md) |
| calls | [known](/tui/services/subagent-source/known.md) |
| calls | [recordFailure](/tui/services/subagent-source/recordFailure.md) |
| calls | [setParentID](/tui/services/subagent-source/setParentID.md) |
| calls | [clearTimers](/tui/services/subagent-source/clearTimers.md) |
| called_by | [createSource](/tests/subagent-mounted/createSource.md) |
| called_by | [mountSubagentPanel](/tests/subagent-mounted/mountSubagentPanel.md) |
| called_by | [createHarness](/tests/subagent-source/createHarness.md) |
| called_by | [runtime](/tui/subagent/runtime.md) |
