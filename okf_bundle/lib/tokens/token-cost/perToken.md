---
okf_version: "0.2"
type: Function
title: perToken
resource: lib/tokens/token-cost.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-01T14:06:27Z"
concept_id: lib/tokens/token-cost/perToken
language: typescript
---

# perToken

## Signature

```typescript
function perToken(usdPer1M?: number): number
```

## Source
Lines 11–13 in `lib/tokens/token-cost.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [token-cost](/lib/tokens/token-cost.md) |
| called_by | [calculateUsdFromTokenBuckets](/lib/tokens/token-cost/calculateUsdFromTokenBuckets.md) |
