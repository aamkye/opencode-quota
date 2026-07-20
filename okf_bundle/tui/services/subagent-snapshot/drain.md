---
okf_version: "0.2"
type: Function
title: drain
resource: tui/services/subagent-snapshot.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:services"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-20T01:15:53Z"
concept_id: tui/services/subagent-snapshot/drain
language: typescript
---

# drain

## Signature

```typescript
function drain(): void
```

## Source
Lines 64–79 in `tui/services/subagent-snapshot.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [subagent-snapshot](/tui/services/subagent-snapshot.md) |
| calls | [abort](/tui/services/subagent-snapshot/abort.md) |
| calls | [start](/tui/services/subagent-snapshot/start.md) |
| called_by | [createMessageRequestLimiter](/tui/services/subagent-snapshot/createMessageRequestLimiter.md) |
