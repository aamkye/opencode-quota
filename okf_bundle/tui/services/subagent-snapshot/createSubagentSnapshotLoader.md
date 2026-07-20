---
okf_version: "0.2"
type: Function
title: createSubagentSnapshotLoader
resource: tui/services/subagent-snapshot.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:services"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-20T01:15:53Z"
concept_id: tui/services/subagent-snapshot/createSubagentSnapshotLoader
language: typescript
---

# createSubagentSnapshotLoader

## Signature

```typescript
function createSubagentSnapshotLoader(
  options: CreateSubagentSnapshotLoaderOptions,
): SubagentSnapshotLoader
```

## Source
Lines 110–169 in `tui/services/subagent-snapshot.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [subagent-snapshot](/tui/services/subagent-snapshot.md) |
| calls | [normalizedConcurrency](/tui/services/subagent-snapshot/normalizedConcurrency.md) |
| calls | [createMessageRequestLimiter](/tui/services/subagent-snapshot/createMessageRequestLimiter.md) |
| calls | [throwIfAborted](/tui/services/subagent-snapshot/throwIfAborted.md) |
| calls | [indexSessionsByParent](/tui/services/session-tree-snapshot/indexSessionsByParent.md) |
| calls | [onChildIDs](/tui/services/subagent-source/onChildIDs.md) |
| calls | [abort](/tui/services/subagent-snapshot/abort.md) |
| calls | [abortReason](/tui/services/subagent-snapshot/abortReason.md) |
| calls | [sessionStatus](/tests/subagent-snapshot/sessionStatus.md) |
| calls | [worker](/tui/services/subagent-snapshot/worker.md) |
