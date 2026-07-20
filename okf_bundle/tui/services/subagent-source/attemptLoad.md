---
okf_version: "0.2"
type: Function
title: attemptLoad
resource: tui/services/subagent-source.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:services"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-20T01:15:53Z"
concept_id: tui/services/subagent-source/attemptLoad
language: typescript
---

# attemptLoad

## Signature

```typescript
function attemptLoad(
    capturedParentID: string,
    capturedGeneration: number,
    attempt: number,
    controller: AbortController,
  ): Promise<void>
```

## Source
Lines 156–209 in `tui/services/subagent-source.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [subagent-source](/tui/services/subagent-source.md) |
| calls | [isCurrent](/tui/services/subagent-source/isCurrent.md) |
| calls | [replaceKnownChildIDs](/tui/services/subagent-source/replaceKnownChildIDs.md) |
| calls | [pruneFailures](/tui/services/subagent-source/pruneFailures.md) |
| calls | [failureTimesFor](/tui/services/subagent-source/failureTimesFor.md) |
| calls | [notify](/tui/services/subagent-source/notify.md) |
| called_by | [createSubagentSource](/tui/services/subagent-source/createSubagentSource.md) |
| called_by | [startRefresh](/tui/services/subagent-source/startRefresh.md) |
