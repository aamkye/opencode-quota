---
okf_version: "0.2"
type: Function
title: setParentID
resource: tui/services/subagent-source.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:services"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-20T01:15:53Z"
concept_id: tui/services/subagent-source/setParentID
language: typescript
---

# setParentID

## Signature

```typescript
function setParentID(nextParentID: string): void
```

## Source
Lines 342–360 in `tui/services/subagent-source.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [subagent-source](/tui/services/subagent-source.md) |
| calls | [clearTimers](/tui/services/subagent-source/clearTimers.md) |
| calls | [notify](/tui/services/subagent-source/notify.md) |
| calls | [startRefresh](/tui/services/subagent-source/startRefresh.md) |
| called_by | [createSubagentSource](/tui/services/subagent-source/createSubagentSource.md) |
