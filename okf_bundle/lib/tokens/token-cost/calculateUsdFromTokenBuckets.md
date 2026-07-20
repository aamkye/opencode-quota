---
okf_version: "0.2"
type: Function
title: calculateUsdFromTokenBuckets
resource: lib/tokens/token-cost.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-01T14:06:27Z"
concept_id: lib/tokens/token-cost/calculateUsdFromTokenBuckets
language: typescript
---

# calculateUsdFromTokenBuckets

## Signature

```typescript
function calculateUsdFromTokenBuckets(
  rates: CostBuckets,
  tokens: TokenBucketLike,
): number
```

## Source
Lines 15–32 in `lib/tokens/token-cost.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [token-cost](/lib/tokens/token-cost.md) |
| calls | [perToken](/lib/tokens/token-cost/perToken.md) |
| called_by | [calculateCostUsd](/lib/tokens/quota-stats/calculateCostUsd.md) |
