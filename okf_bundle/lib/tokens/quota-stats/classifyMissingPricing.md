---
okf_version: "0.2"
type: Function
title: classifyMissingPricing
resource: lib/tokens/quota-stats.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-01T14:05:27Z"
concept_id: lib/tokens/quota-stats/classifyMissingPricing
language: typescript
---

# classifyMissingPricing

## Signature

```typescript
function classifyMissingPricing(params: {
  mappedProvider: string;
  mappedModel: string;
}): { kind: "unpriced"; reason: string } | { kind: "unknown" }
```

## Source
Lines 420–433 in `lib/tokens/quota-stats.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [quota-stats](/lib/tokens/quota-stats.md) |
| calls | [hasProvider](/lib/tokens/modelsdev-pricing/hasProvider.md) |
| calls | [hasModel](/lib/tokens/modelsdev-pricing/hasModel.md) |
| called_by | [aggregateUsage](/lib/tokens/quota-stats/aggregateUsage.md) |
