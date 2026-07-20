---
okf_version: "0.2"
type: Function
title: resolveModelForProvider
resource: lib/tokens/quota-stats.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-01T14:05:27Z"
concept_id: lib/tokens/quota-stats/resolveModelForProvider
language: typescript
---

# resolveModelForProvider

## Signature

```typescript
function resolveModelForProvider(providerID: string, normalizedModel: string): string | null
```

## Source
Lines 252–284 in `lib/tokens/quota-stats.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [quota-stats](/lib/tokens/quota-stats.md) |
| calls | [isModelsDevProviderId](/lib/tokens/modelsdev-pricing/isModelsDevProviderId.md) |
| calls | [pickBestModelForProvider](/lib/tokens/quota-stats/pickBestModelForProvider.md) |
| calls | [freeSuffixCandidates](/lib/tokens/quota-stats/freeSuffixCandidates.md) |
| calls | [hasModel](/lib/tokens/modelsdev-pricing/hasModel.md) |
| calls | [moonshotaiPricingCandidates](/lib/tokens/quota-stats/moonshotaiPricingCandidates.md) |
| calls | [anthropicPricingCandidates](/lib/tokens/quota-stats/anthropicPricingCandidates.md) |
| called_by | [resolvePricingKey](/lib/tokens/quota-stats/resolvePricingKey.md) |
| called_by | [tryProvider](/lib/tokens/quota-stats/tryProvider.md) |
