---
okf_version: "0.2"
type: Function
title: throwIfAborted
resource: tui/services/session-tree-snapshot.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:services"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-19T13:51:24Z"
concept_id: tui/services/session-tree-snapshot/throwIfAborted
language: typescript
---

# throwIfAborted

## Signature

```typescript
function throwIfAborted(signal: AbortSignal | undefined): void
```

## Source
Lines 56–58 in `tui/services/session-tree-snapshot.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [session-tree-snapshot](/tui/services/session-tree-snapshot.md) |
| calls | [abortReason](/tui/services/session-tree-snapshot/abortReason.md) |
| called_by | [loadSessionTreeSnapshotWithLimiter](/tui/services/session-tree-snapshot/loadSessionTreeSnapshotWithLimiter.md) |
