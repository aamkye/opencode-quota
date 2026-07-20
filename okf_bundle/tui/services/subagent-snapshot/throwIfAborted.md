---
okf_version: "0.2"
type: Function
title: throwIfAborted
resource: tui/services/subagent-snapshot.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:services"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-20T01:15:53Z"
concept_id: tui/services/subagent-snapshot/throwIfAborted
language: typescript
---

# throwIfAborted

## Signature

```typescript
function throwIfAborted(signal: AbortSignal): void
```

## Source
Lines 56–58 in `tui/services/subagent-snapshot.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [subagent-snapshot](/tui/services/subagent-snapshot.md) |
| calls | [abortReason](/tui/services/subagent-snapshot/abortReason.md) |
| called_by | [createSubagentSnapshotLoader](/tui/services/subagent-snapshot/createSubagentSnapshotLoader.md) |
