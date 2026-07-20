---
okf_version: "0.2"
type: Function
title: abort
resource: tui/services/subagent-snapshot.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:services"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-20T01:15:53Z"
concept_id: tui/services/subagent-snapshot/abort
language: typescript
---

# abort

## Signature

```typescript
abort()
```

## Source
Lines 93–95 in `tui/services/subagent-snapshot.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [subagent-snapshot](/tui/services/subagent-snapshot.md) |
| calls | [abortReason](/tui/services/subagent-snapshot/abortReason.md) |
| called_by | [abortFromParent](/tui/services/subagent-snapshot/abortFromParent.md) |
| called_by | [createMessageRequestLimiter](/tui/services/subagent-snapshot/createMessageRequestLimiter.md) |
| called_by | [createSubagentSnapshotLoader](/tui/services/subagent-snapshot/createSubagentSnapshotLoader.md) |
| called_by | [drain](/tui/services/subagent-snapshot/drain.md) |
| called_by | [onAbort](/tui/services/subagent-snapshot/onAbort.md) |
| called_by | [worker](/tui/services/subagent-snapshot/worker.md) |
