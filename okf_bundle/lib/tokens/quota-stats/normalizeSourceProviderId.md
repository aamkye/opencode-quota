---
okf_version: "0.2"
type: Function
title: normalizeSourceProviderId
resource: lib/tokens/quota-stats.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-01T14:05:27Z"
concept_id: lib/tokens/quota-stats/normalizeSourceProviderId
language: typescript
---

# normalizeSourceProviderId

## Signature

```typescript
function normalizeSourceProviderId(raw?: string): string | undefined
```

## Source
Lines 192–209 in `lib/tokens/quota-stats.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [quota-stats](/lib/tokens/quota-stats.md) |
| calls | [filter](/tui/quota/filter.md) |
| calls | [isModelsDevProviderId](/lib/tokens/modelsdev-pricing/isModelsDevProviderId.md) |
| called_by | [resolvePricingKey](/lib/tokens/quota-stats/resolvePricingKey.md) |
