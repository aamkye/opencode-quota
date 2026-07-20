---
okf_version: "0.2"
type: Function
title: hasCost
resource: lib/tokens/modelsdev-pricing.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-15T13:08:32Z"
concept_id: lib/tokens/modelsdev-pricing/hasCost
language: typescript
---

# hasCost

## Signature

```typescript
function hasCost(providerId: string, modelId: string): boolean
```

## Source
Lines 756–758 in `lib/tokens/modelsdev-pricing.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [modelsdev-pricing](/lib/tokens/modelsdev-pricing.md) |
| calls | [lookupCost](/lib/tokens/modelsdev-pricing/lookupCost.md) |
| called_by | [pickBestModelForProvider](/lib/tokens/quota-stats/pickBestModelForProvider.md) |
