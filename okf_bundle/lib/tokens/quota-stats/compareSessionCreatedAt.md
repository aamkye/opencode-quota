---
okf_version: "0.2"
type: Function
title: compareSessionCreatedAt
resource: lib/tokens/quota-stats.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-01T14:05:27Z"
concept_id: lib/tokens/quota-stats/compareSessionCreatedAt
language: typescript
---

# compareSessionCreatedAt

## Signature

```typescript
function compareSessionCreatedAt(
  a: Awaited<ReturnType<typeof readAllSessionsIndex>>[string],
  b: Awaited<ReturnType<typeof readAllSessionsIndex>>[string],
): number
```

## Source
Lines 435–443 in `lib/tokens/quota-stats.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [quota-stats](/lib/tokens/quota-stats.md) |
