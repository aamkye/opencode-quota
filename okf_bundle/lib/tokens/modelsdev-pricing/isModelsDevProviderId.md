---
okf_version: "0.2"
type: Function
title: isModelsDevProviderId
resource: lib/tokens/modelsdev-pricing.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-15T13:08:32Z"
concept_id: lib/tokens/modelsdev-pricing/isModelsDevProviderId
language: typescript
---

# isModelsDevProviderId

## Signature

```typescript
function isModelsDevProviderId(providerId: string): boolean
```

## Source
Lines 715–717 in `lib/tokens/modelsdev-pricing.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [modelsdev-pricing](/lib/tokens/modelsdev-pricing.md) |
| calls | [hasProvider](/lib/tokens/modelsdev-pricing/hasProvider.md) |
| called_by | [normalizeSourceProviderId](/lib/tokens/quota-stats/normalizeSourceProviderId.md) |
| called_by | [resolveModelForProvider](/lib/tokens/quota-stats/resolveModelForProvider.md) |
