---
okf_version: "0.2"
type: Function
title: indexSessionsByParent
resource: tui/services/session-tree-snapshot.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:services"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-19T13:51:24Z"
concept_id: tui/services/session-tree-snapshot/indexSessionsByParent
language: typescript
---

# indexSessionsByParent

## Signature

```typescript
function indexSessionsByParent(
  sessions: readonly SessionTreeRecord[],
): ReadonlyMap<string, readonly SessionTreeRecord[]>
```

## Source
Lines 112–123 in `tui/services/session-tree-snapshot.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [session-tree-snapshot](/tui/services/session-tree-snapshot.md) |
| called_by | [loadSessionTreeSnapshotWithLimiter](/tui/services/session-tree-snapshot/loadSessionTreeSnapshotWithLimiter.md) |
| called_by | [createSubagentSnapshotLoader](/tui/services/subagent-snapshot/createSubagentSnapshotLoader.md) |
