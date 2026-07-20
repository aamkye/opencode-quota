---
okf_version: "0.2"
type: Function
title: createMessageRequestLimiter
resource: tui/services/subagent-snapshot.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:services"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-20T01:15:53Z"
concept_id: tui/services/subagent-snapshot/createMessageRequestLimiter
language: typescript
---

# createMessageRequestLimiter

## Signature

```typescript
function createMessageRequestLimiter(concurrency: number): MessageRequestLimiter
```

## Source
Lines 60–108 in `tui/services/subagent-snapshot.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [subagent-snapshot](/tui/services/subagent-snapshot.md) |
| calls | [abort](/tui/services/subagent-snapshot/abort.md) |
| calls | [start](/tui/services/subagent-snapshot/start.md) |
| calls | [drain](/tui/services/subagent-snapshot/drain.md) |
| calls | [abortReason](/tui/services/subagent-snapshot/abortReason.md) |
| calls | [resolve](/tests/plugin-build/resolve.md) |
| called_by | [createSubagentSnapshotLoader](/tui/services/subagent-snapshot/createSubagentSnapshotLoader.md) |
