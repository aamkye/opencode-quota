---
okf_version: "0.2"
type: Function
title: abort
resource: tui/services/session-tree-snapshot.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:services"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-19T13:51:24Z"
concept_id: tui/services/session-tree-snapshot/abort
language: typescript
---

# abort

## Signature

```typescript
abort()
```

## Source
Lines 93–95 in `tui/services/session-tree-snapshot.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [session-tree-snapshot](/tui/services/session-tree-snapshot.md) |
| calls | [abortReason](/tui/services/session-tree-snapshot/abortReason.md) |
| called_by | [abortFromParent](/tui/services/session-tree-snapshot/abortFromParent.md) |
| called_by | [createMessageRequestLimiter](/tui/services/session-tree-snapshot/createMessageRequestLimiter.md) |
| called_by | [drain](/tui/services/session-tree-snapshot/drain.md) |
| called_by | [loadSessionTreeSnapshotWithLimiter](/tui/services/session-tree-snapshot/loadSessionTreeSnapshotWithLimiter.md) |
| called_by | [worker](/tui/services/session-tree-snapshot/worker.md) |
