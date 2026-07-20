---
okf_version: "0.2"
type: Function
title: publishFailureTimes
resource: tui/services/subagent-source.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:services"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-20T01:15:53Z"
concept_id: tui/services/subagent-source/publishFailureTimes
language: typescript
---

# publishFailureTimes

## Signature

```typescript
function publishFailureTimes(): void
```

## Source
Lines 225–234 in `tui/services/subagent-source.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [subagent-source](/tui/services/subagent-source.md) |
| calls | [failureTimesFor](/tui/services/subagent-source/failureTimesFor.md) |
| calls | [notify](/tui/services/subagent-source/notify.md) |
| called_by | [createSubagentSource](/tui/services/subagent-source/createSubagentSource.md) |
| called_by | [recordFailure](/tui/services/subagent-source/recordFailure.md) |
