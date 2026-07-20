---
okf_version: "0.2"
type: Function
title: isCurrent
resource: tui/services/subagent-source.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:services"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-20T01:15:53Z"
concept_id: tui/services/subagent-source/isCurrent
language: typescript
---

# isCurrent

## Signature

```typescript
function isCurrent(
    capturedParentID: string,
    capturedGeneration: number,
    controller: AbortController,
  ): boolean
```

## Source
Lines 115–125 in `tui/services/subagent-source.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [subagent-source](/tui/services/subagent-source.md) |
| called_by | [attemptLoad](/tui/services/subagent-source/attemptLoad.md) |
| called_by | [createSubagentSource](/tui/services/subagent-source/createSubagentSource.md) |
| called_by | [onChildIDs](/tui/services/subagent-source/onChildIDs.md) |
