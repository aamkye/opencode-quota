---
okf_version: "0.2"
type: Function
title: createMessageRequestLimiter
resource: tui/services/session-tree-snapshot.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:services"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-19T13:51:24Z"
concept_id: tui/services/session-tree-snapshot/createMessageRequestLimiter
language: typescript
---

# createMessageRequestLimiter

## Signature

```typescript
function createMessageRequestLimiter(concurrency: number): MessageRequestLimiter
```

## Source
Lines 60–110 in `tui/services/session-tree-snapshot.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [session-tree-snapshot](/tui/services/session-tree-snapshot.md) |
| calls | [abort](/tui/services/session-tree-snapshot/abort.md) |
| calls | [start](/tui/services/session-tree-snapshot/start.md) |
| calls | [drain](/tui/services/session-tree-snapshot/drain.md) |
| calls | [abortReason](/tui/services/session-tree-snapshot/abortReason.md) |
| calls | [resolve](/tests/plugin-build/resolve.md) |
| called_by | [createSessionTreeSnapshotLoader](/tui/services/session-tree-snapshot/createSessionTreeSnapshotLoader.md) |
| called_by | [loadSessionTreeSnapshot](/tui/services/session-tree-snapshot/loadSessionTreeSnapshot.md) |
