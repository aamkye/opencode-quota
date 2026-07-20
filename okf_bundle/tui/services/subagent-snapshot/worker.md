---
okf_version: "0.2"
type: Function
title: worker
resource: tui/services/subagent-snapshot.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:services"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-20T01:15:53Z"
concept_id: tui/services/subagent-snapshot/worker
language: typescript
---

# worker

## Signature

```typescript
function worker(): Promise<void>
```

## Source
Lines 137–157 in `tui/services/subagent-snapshot.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [subagent-snapshot](/tui/services/subagent-snapshot.md) |
| calls | [sessionStatus](/tests/subagent-snapshot/sessionStatus.md) |
| calls | [abort](/tui/services/subagent-snapshot/abort.md) |
| called_by | [createSubagentSnapshotLoader](/tui/services/subagent-snapshot/createSubagentSnapshotLoader.md) |
