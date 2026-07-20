---
okf_version: "0.2"
type: Function
title: loadSessionTreeSnapshotWithLimiter
resource: tui/services/session-tree-snapshot.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:services"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-19T13:51:24Z"
concept_id: tui/services/session-tree-snapshot/loadSessionTreeSnapshotWithLimiter
language: typescript
---

# loadSessionTreeSnapshotWithLimiter

## Signature

```typescript
function loadSessionTreeSnapshotWithLimiter(
  options: LoadSessionTreeSnapshotOptions,
  limitMessageRequest: MessageRequestLimiter,
): Promise<SessionTreeSnapshot>
```

## Source
Lines 150–199 in `tui/services/session-tree-snapshot.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [session-tree-snapshot](/tui/services/session-tree-snapshot.md) |
| calls | [throwIfAborted](/tui/services/session-tree-snapshot/throwIfAborted.md) |
| calls | [collectSessionTreeIDs](/tui/services/session-tree-snapshot/collectSessionTreeIDs.md) |
| calls | [indexSessionsByParent](/tui/services/session-tree-snapshot/indexSessionsByParent.md) |
| calls | [onSessionIDs](/tui/services/ses-tokens-source/onSessionIDs.md) |
| calls | [abort](/tui/services/session-tree-snapshot/abort.md) |
| calls | [abortReason](/tui/services/session-tree-snapshot/abortReason.md) |
| calls | [normalizedConcurrency](/tui/services/session-tree-snapshot/normalizedConcurrency.md) |
| calls | [worker](/tui/services/session-tree-snapshot/worker.md) |
| called_by | [createSessionTreeSnapshotLoader](/tui/services/session-tree-snapshot/createSessionTreeSnapshotLoader.md) |
| called_by | [loadSessionTreeSnapshot](/tui/services/session-tree-snapshot/loadSessionTreeSnapshot.md) |
