---
okf_version: "0.2"
type: Function
title: hasModel
resource: lib/tokens/modelsdev-pricing.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-15T13:08:32Z"
concept_id: lib/tokens/modelsdev-pricing/hasModel
language: typescript
---

# hasModel

## Signature

```typescript
function hasModel(providerId: string, modelId: string): boolean
```

## Source
Lines 719–723 in `lib/tokens/modelsdev-pricing.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [modelsdev-pricing](/lib/tokens/modelsdev-pricing.md) |
| calls | [ensureLoaded](/lib/tokens/modelsdev-pricing/ensureLoaded.md) |
| called_by | [classifyMissingPricing](/lib/tokens/quota-stats/classifyMissingPricing.md) |
| called_by | [pickBestModelForProvider](/lib/tokens/quota-stats/pickBestModelForProvider.md) |
| called_by | [resolveModelForProvider](/lib/tokens/quota-stats/resolveModelForProvider.md) |
