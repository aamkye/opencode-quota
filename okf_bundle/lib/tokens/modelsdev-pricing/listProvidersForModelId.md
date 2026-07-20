---
okf_version: "0.2"
type: Function
title: listProvidersForModelId
resource: lib/tokens/modelsdev-pricing.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-15T13:08:32Z"
concept_id: lib/tokens/modelsdev-pricing/listProvidersForModelId
language: typescript
---

# listProvidersForModelId

## Signature

```typescript
function listProvidersForModelId(modelId: string): string[]
```

## Source
Lines 743–746 in `lib/tokens/modelsdev-pricing.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [modelsdev-pricing](/lib/tokens/modelsdev-pricing.md) |
| calls | [get](/lib/tokens/opencode-sqlite/get.md) |
| calls | [ensureModelIndex](/lib/tokens/modelsdev-pricing/ensureModelIndex.md) |
| called_by | [inferProviderForModelId](/lib/tokens/modelsdev-pricing/inferProviderForModelId.md) |
| called_by | [inferOfficialProviderFromModelId](/lib/tokens/quota-stats/inferOfficialProviderFromModelId.md) |
| called_by | [resolvePricingKey](/lib/tokens/quota-stats/resolvePricingKey.md) |
