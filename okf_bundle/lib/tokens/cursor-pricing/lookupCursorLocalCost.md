---
okf_version: "0.2"
type: Function
title: lookupCursorLocalCost
resource: lib/tokens/cursor-pricing.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-01T14:06:27Z"
concept_id: lib/tokens/cursor-pricing/lookupCursorLocalCost
language: typescript
---

# lookupCursorLocalCost

## Signature

```typescript
function lookupCursorLocalCost(model: string): CostBuckets | null
```

## Source
Lines 147–149 in `lib/tokens/cursor-pricing.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [cursor-pricing](/lib/tokens/cursor-pricing.md) |
| called_by | [calculateCostUsd](/lib/tokens/quota-stats/calculateCostUsd.md) |
