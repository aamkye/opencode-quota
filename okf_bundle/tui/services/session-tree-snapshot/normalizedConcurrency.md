---
okf_version: "0.2"
type: Function
title: normalizedConcurrency
resource: tui/services/session-tree-snapshot.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:services"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-19T13:51:24Z"
concept_id: tui/services/session-tree-snapshot/normalizedConcurrency
language: typescript
---

# normalizedConcurrency

## Signature

```typescript
function normalizedConcurrency(requestedConcurrency = 4): number
```

## Source
Lines 46–50 in `tui/services/session-tree-snapshot.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [session-tree-snapshot](/tui/services/session-tree-snapshot.md) |
| called_by | [createSessionTreeSnapshotLoader](/tui/services/session-tree-snapshot/createSessionTreeSnapshotLoader.md) |
| called_by | [loadSessionTreeSnapshot](/tui/services/session-tree-snapshot/loadSessionTreeSnapshot.md) |
| called_by | [loadSessionTreeSnapshotWithLimiter](/tui/services/session-tree-snapshot/loadSessionTreeSnapshotWithLimiter.md) |
