---
okf_version: "0.2"
type: Function
title: startRefresh
resource: tui/services/subagent-source.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:services"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-20T01:15:53Z"
concept_id: tui/services/subagent-source/startRefresh
language: typescript
---

# startRefresh

## Signature

```typescript
function startRefresh(capturedParentID: string, capturedGeneration: number): void
```

## Source
Lines 211–215 in `tui/services/subagent-source.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [subagent-source](/tui/services/subagent-source.md) |
| calls | [isCurrentGeneration](/tui/services/subagent-source/isCurrentGeneration.md) |
| calls | [attemptLoad](/tui/services/subagent-source/attemptLoad.md) |
| called_by | [createSubagentSource](/tui/services/subagent-source/createSubagentSource.md) |
| called_by | [scheduleRefresh](/tui/services/subagent-source/scheduleRefresh.md) |
| called_by | [setParentID](/tui/services/subagent-source/setParentID.md) |
