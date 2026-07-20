---
okf_version: "0.2"
type: Function
title: failureTimesFor
resource: tui/services/subagent-source.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:services"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-20T01:15:53Z"
concept_id: tui/services/subagent-source/failureTimesFor
language: typescript
---

# failureTimesFor

## Signature

```typescript
function failureTimesFor(capturedParentID: string): Readonly<Record<string, number>>
```

## Source
Lines 98–100 in `tui/services/subagent-source.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [subagent-source](/tui/services/subagent-source.md) |
| called_by | [attemptLoad](/tui/services/subagent-source/attemptLoad.md) |
| called_by | [createSubagentSource](/tui/services/subagent-source/createSubagentSource.md) |
| called_by | [publishFailureTimes](/tui/services/subagent-source/publishFailureTimes.md) |
