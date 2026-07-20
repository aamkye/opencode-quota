---
okf_version: "0.2"
type: Function
title: calculateCostUsd
resource: lib/tokens/quota-stats.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-01T14:05:27Z"
concept_id: lib/tokens/quota-stats/calculateCostUsd
language: typescript
---

# calculateCostUsd

## Signature

```typescript
function calculateCostUsd(params: {
  provider: string;
  model: string;
  tokens: TokenBuckets;
}): { ok: true; costUsd: number } | { ok: false }
```

## Source
Lines 407–418 in `lib/tokens/quota-stats.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [quota-stats](/lib/tokens/quota-stats.md) |
| calls | [lookupCursorLocalCost](/lib/tokens/cursor-pricing/lookupCursorLocalCost.md) |
| calls | [lookupCost](/lib/tokens/modelsdev-pricing/lookupCost.md) |
| calls | [calculateUsdFromTokenBuckets](/lib/tokens/token-cost/calculateUsdFromTokenBuckets.md) |
| called_by | [aggregateUsage](/lib/tokens/quota-stats/aggregateUsage.md) |
