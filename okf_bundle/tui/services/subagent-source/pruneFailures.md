---
okf_version: "0.2"
type: Function
title: pruneFailures
resource: tui/services/subagent-source.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:services"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-20T01:15:53Z"
concept_id: tui/services/subagent-source/pruneFailures
language: typescript
---

# pruneFailures

## Signature

```typescript
function pruneFailures(capturedParentID: string, childIDs: readonly string[]): void
```

## Source
Lines 141–154 in `tui/services/subagent-source.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [subagent-source](/tui/services/subagent-source.md) |
| calls | [filter](/tui/quota/filter.md) |
| calls | [persistFailures](/tui/services/subagent-source/persistFailures.md) |
| called_by | [attemptLoad](/tui/services/subagent-source/attemptLoad.md) |
| called_by | [createSubagentSource](/tui/services/subagent-source/createSubagentSource.md) |
