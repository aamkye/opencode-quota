---
okf_version: "0.2"
type: Function
title: inferOfficialProviderFromModelId
resource: lib/tokens/quota-stats.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-01T14:05:27Z"
concept_id: lib/tokens/quota-stats/inferOfficialProviderFromModelId
language: typescript
---

# inferOfficialProviderFromModelId

## Signature

```typescript
function inferOfficialProviderFromModelId(modelId: string): string | null
```

## Source
Lines 211–229 in `lib/tokens/quota-stats.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [quota-stats](/lib/tokens/quota-stats.md) |
| calls | [listProvidersForModelId](/lib/tokens/modelsdev-pricing/listProvidersForModelId.md) |
| called_by | [resolvePricingKey](/lib/tokens/quota-stats/resolvePricingKey.md) |
