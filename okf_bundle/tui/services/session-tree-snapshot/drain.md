---
okf_version: "0.2"
type: Function
title: drain
resource: tui/services/session-tree-snapshot.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:services"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-19T13:51:24Z"
concept_id: tui/services/session-tree-snapshot/drain
language: typescript
---

# drain

## Signature

```typescript
function drain(): void
```

## Source
Lines 64–79 in `tui/services/session-tree-snapshot.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [session-tree-snapshot](/tui/services/session-tree-snapshot.md) |
| calls | [abort](/tui/services/session-tree-snapshot/abort.md) |
| calls | [start](/tui/services/session-tree-snapshot/start.md) |
| called_by | [createMessageRequestLimiter](/tui/services/session-tree-snapshot/createMessageRequestLimiter.md) |
