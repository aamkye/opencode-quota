---
okf_version: "0.2"
type: Function
title: getPricingSnapshotHealth
resource: lib/tokens/modelsdev-pricing.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-15T13:08:32Z"
concept_id: lib/tokens/modelsdev-pricing/getPricingSnapshotHealth
language: typescript
---

# getPricingSnapshotHealth

## Signature

```typescript
function getPricingSnapshotHealth(opts?: {
  nowMs?: number;
  maxAgeMs?: number;
}): PricingSnapshotHealth
```

## Source
Lines 695–709 in `lib/tokens/modelsdev-pricing.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [modelsdev-pricing](/lib/tokens/modelsdev-pricing.md) |
| calls | [getPricingSnapshotMeta](/lib/tokens/modelsdev-pricing/getPricingSnapshotMeta.md) |
| called_by | [maybeRefreshPricingSnapshot](/lib/tokens/modelsdev-pricing/maybeRefreshPricingSnapshot.md) |
