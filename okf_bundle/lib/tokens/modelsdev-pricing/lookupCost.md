---
okf_version: "0.2"
type: Function
title: lookupCost
resource: lib/tokens/modelsdev-pricing.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-15T13:08:32Z"
concept_id: lib/tokens/modelsdev-pricing/lookupCost
language: typescript
---

# lookupCost

## Signature

```typescript
function lookupCost(providerId: string, modelId: string): CostBuckets | null
```

## Source
Lines 748–754 in `lib/tokens/modelsdev-pricing.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [modelsdev-pricing](/lib/tokens/modelsdev-pricing.md) |
| calls | [ensureLoaded](/lib/tokens/modelsdev-pricing/ensureLoaded.md) |
| called_by | [hasCost](/lib/tokens/modelsdev-pricing/hasCost.md) |
| called_by | [calculateCostUsd](/lib/tokens/quota-stats/calculateCostUsd.md) |
