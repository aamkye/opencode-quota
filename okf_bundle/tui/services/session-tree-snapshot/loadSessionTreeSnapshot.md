---
okf_version: "0.2"
type: Function
title: loadSessionTreeSnapshot
resource: tui/services/session-tree-snapshot.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:services"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-19T13:51:24Z"
concept_id: tui/services/session-tree-snapshot/loadSessionTreeSnapshot
language: typescript
---

# loadSessionTreeSnapshot

## Signature

```typescript
function loadSessionTreeSnapshot(
  options: LoadSessionTreeSnapshotOptions,
): Promise<SessionTreeSnapshot>
```

## Source
Lines 141–148 in `tui/services/session-tree-snapshot.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [session-tree-snapshot](/tui/services/session-tree-snapshot.md) |
| calls | [loadSessionTreeSnapshotWithLimiter](/tui/services/session-tree-snapshot/loadSessionTreeSnapshotWithLimiter.md) |
| calls | [createMessageRequestLimiter](/tui/services/session-tree-snapshot/createMessageRequestLimiter.md) |
| calls | [normalizedConcurrency](/tui/services/session-tree-snapshot/normalizedConcurrency.md) |
