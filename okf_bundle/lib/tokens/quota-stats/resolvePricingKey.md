---
okf_version: "0.2"
type: Function
title: resolvePricingKey
resource: lib/tokens/quota-stats.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-01T14:05:27Z"
concept_id: lib/tokens/quota-stats/resolvePricingKey
language: typescript
---

# resolvePricingKey

## Signature

```typescript
function resolvePricingKey(source: {
  providerID?: string;
  modelID?: string;
}): PricingResolution
```

## Source
Lines 286–405 in `lib/tokens/quota-stats.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [quota-stats](/lib/tokens/quota-stats.md) |
| calls | [parseModelIdHint](/lib/tokens/quota-stats/parseModelIdHint.md) |
| calls | [normalizeModelId](/lib/tokens/quota-stats/normalizeModelId.md) |
| calls | [normalizeSourceProviderId](/lib/tokens/quota-stats/normalizeSourceProviderId.md) |
| calls | [resolveModelForProvider](/lib/tokens/quota-stats/resolveModelForProvider.md) |
| calls | [isCursorProviderId](/lib/tokens/cursor-pricing/isCursorProviderId.md) |
| calls | [isCursorModelId](/lib/tokens/cursor-pricing/isCursorModelId.md) |
| calls | [resolveCursorModel](/lib/tokens/cursor-pricing/resolveCursorModel.md) |
| calls | [tryProvider](/lib/tokens/quota-stats/tryProvider.md) |
| calls | [freeSuffixCandidates](/lib/tokens/quota-stats/freeSuffixCandidates.md) |
| calls | [listProvidersForModelId](/lib/tokens/modelsdev-pricing/listProvidersForModelId.md) |
| calls | [inferOfficialProviderFromModelId](/lib/tokens/quota-stats/inferOfficialProviderFromModelId.md) |
| called_by | [aggregateUsage](/lib/tokens/quota-stats/aggregateUsage.md) |
