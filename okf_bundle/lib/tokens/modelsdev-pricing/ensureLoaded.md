---
okf_version: "0.2"
type: Function
title: ensureLoaded
resource: lib/tokens/modelsdev-pricing.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-15T13:08:32Z"
concept_id: lib/tokens/modelsdev-pricing/ensureLoaded
language: typescript
---

# ensureLoaded

## Signature

```typescript
function ensureLoaded(): PricingSnapshot
```

## Source
Lines 290–294 in `lib/tokens/modelsdev-pricing.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [modelsdev-pricing](/lib/tokens/modelsdev-pricing.md) |
| calls | [applySnapshotSelection](/lib/tokens/modelsdev-pricing/applySnapshotSelection.md) |
| called_by | [ensureModelIndex](/lib/tokens/modelsdev-pricing/ensureModelIndex.md) |
| called_by | [getPricingSnapshotMeta](/lib/tokens/modelsdev-pricing/getPricingSnapshotMeta.md) |
| called_by | [getPricingSnapshotSource](/lib/tokens/modelsdev-pricing/getPricingSnapshotSource.md) |
| called_by | [getProviderModelCount](/lib/tokens/modelsdev-pricing/getProviderModelCount.md) |
| called_by | [hasModel](/lib/tokens/modelsdev-pricing/hasModel.md) |
| called_by | [hasProvider](/lib/tokens/modelsdev-pricing/hasProvider.md) |
| called_by | [listModelsForProvider](/lib/tokens/modelsdev-pricing/listModelsForProvider.md) |
| called_by | [listProviders](/lib/tokens/modelsdev-pricing/listProviders.md) |
| called_by | [lookupCost](/lib/tokens/modelsdev-pricing/lookupCost.md) |
| called_by | [maybeRefreshPricingSnapshot](/lib/tokens/modelsdev-pricing/maybeRefreshPricingSnapshot.md) |
