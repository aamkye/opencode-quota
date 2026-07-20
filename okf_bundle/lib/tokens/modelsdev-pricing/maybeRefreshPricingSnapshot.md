---
okf_version: "0.2"
type: Function
title: maybeRefreshPricingSnapshot
resource: lib/tokens/modelsdev-pricing.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-15T13:08:32Z"
concept_id: lib/tokens/modelsdev-pricing/maybeRefreshPricingSnapshot
language: typescript
---

# maybeRefreshPricingSnapshot

## Signature

```typescript
function maybeRefreshPricingSnapshot(
  opts: PricingRefreshOptions = {},
): Promise<PricingRefreshResult>
```

## Source
Lines 464–673 in `lib/tokens/modelsdev-pricing.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [modelsdev-pricing](/lib/tokens/modelsdev-pricing.md) |
| calls | [getPricingRefreshPolicy](/lib/tokens/modelsdev-pricing/getPricingRefreshPolicy.md) |
| calls | [getRuntimePricingSnapshotPath](/lib/tokens/modelsdev-pricing/getRuntimePricingSnapshotPath.md) |
| calls | [getRuntimePricingRefreshStatePath](/lib/tokens/modelsdev-pricing/getRuntimePricingRefreshStatePath.md) |
| calls | [readRefreshState](/lib/tokens/modelsdev-pricing/readRefreshState.md) |
| calls | [makeDefaultRefreshState](/lib/tokens/modelsdev-pricing/makeDefaultRefreshState.md) |
| calls | [loadRuntimeSnapshotSync](/lib/tokens/modelsdev-pricing/loadRuntimeSnapshotSync.md) |
| calls | [applySnapshotSelection](/lib/tokens/modelsdev-pricing/applySnapshotSelection.md) |
| calls | [getPricingSnapshotHealth](/lib/tokens/modelsdev-pricing/getPricingSnapshotHealth.md) |
| calls | [fetchModelsDevSnapshot](/lib/tokens/modelsdev-pricing/fetchModelsDevSnapshot.md) |
| calls | [ensureLoaded](/lib/tokens/modelsdev-pricing/ensureLoaded.md) |
| calls | [writeJsonAtomic](/lib/tokens/atomic-json/writeJsonAtomic.md) |
| calls | [get](/lib/tokens/opencode-sqlite/get.md) |
| calls | [buildSnapshotFromApi](/lib/tokens/modelsdev-pricing/buildSnapshotFromApi.md) |
| calls | [countPricedModels](/lib/tokens/modelsdev-pricing/countPricedModels.md) |
| calls | [getErrorMessage](/lib/tokens/modelsdev-pricing/getErrorMessage.md) |
