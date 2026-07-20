---
okf_version: "0.2"
type: Function
title: visit
resource: lib/tokens/quota-stats.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-01T14:05:27Z"
concept_id: lib/tokens/quota-stats/visit
language: typescript
---

# visit

## Signature

```typescript
const visit = (session: (typeof sessionsIdx)[string], depth: number) =>: void
```

## Source
Lines 469–475 in `lib/tokens/quota-stats.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [quota-stats](/lib/tokens/quota-stats.md) |
| calls | [get](/lib/tokens/opencode-sqlite/get.md) |
| called_by | [resolveSessionTree](/lib/tokens/quota-stats/resolveSessionTree.md) |
