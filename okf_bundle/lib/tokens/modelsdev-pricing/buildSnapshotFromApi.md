---
okf_version: "0.2"
type: Function
title: buildSnapshotFromApi
resource: lib/tokens/modelsdev-pricing.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-15T13:08:32Z"
concept_id: lib/tokens/modelsdev-pricing/buildSnapshotFromApi
language: typescript
---

# buildSnapshotFromApi

## Signature

```typescript
function buildSnapshotFromApi(
  apiRaw: unknown,
  providerIDs: string[],
  generatedAt: number,
): PricingSnapshot
```

## Source
Lines 386–424 in `lib/tokens/modelsdev-pricing.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [modelsdev-pricing](/lib/tokens/modelsdev-pricing.md) |
| calls | [asRecord](/lib/tokens/modelsdev-pricing/asRecord.md) |
| calls | [pickCostBuckets](/lib/tokens/modelsdev-pricing/pickCostBuckets.md) |
| calls | [sortRecordByKeys](/lib/tokens/modelsdev-pricing/sortRecordByKeys.md) |
| called_by | [maybeRefreshPricingSnapshot](/lib/tokens/modelsdev-pricing/maybeRefreshPricingSnapshot.md) |
