---
okf_version: "0.2"
type: Function
title: persistFailures
resource: tui/services/subagent-source.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:services"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-20T01:15:53Z"
concept_id: tui/services/subagent-source/persistFailures
language: typescript
---

# persistFailures

## Signature

```typescript
function persistFailures(): void
```

## Source
Lines 137–139 in `tui/services/subagent-source.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [subagent-source](/tui/services/subagent-source.md) |
| calls | [saveFailures](/tests/subagent-source/saveFailures.md) |
| calls | [copyFailures](/tui/services/subagent-source/copyFailures.md) |
| called_by | [createSubagentSource](/tui/services/subagent-source/createSubagentSource.md) |
| called_by | [pruneFailures](/tui/services/subagent-source/pruneFailures.md) |
| called_by | [recordFailure](/tui/services/subagent-source/recordFailure.md) |
