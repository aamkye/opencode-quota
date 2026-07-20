---
okf_version: "0.2"
type: Function
title: hasProvider
resource: lib/tokens/modelsdev-pricing.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-15T13:08:32Z"
concept_id: lib/tokens/modelsdev-pricing/hasProvider
language: typescript
---

# hasProvider

## Signature

```typescript
function hasProvider(providerId: string): boolean
```

## Source
Lines 711–713 in `lib/tokens/modelsdev-pricing.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [modelsdev-pricing](/lib/tokens/modelsdev-pricing.md) |
| calls | [ensureLoaded](/lib/tokens/modelsdev-pricing/ensureLoaded.md) |
| called_by | [isModelsDevProviderId](/lib/tokens/modelsdev-pricing/isModelsDevProviderId.md) |
| called_by | [classifyMissingPricing](/lib/tokens/quota-stats/classifyMissingPricing.md) |
