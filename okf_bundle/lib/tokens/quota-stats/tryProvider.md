---
okf_version: "0.2"
type: Function
title: tryProvider
resource: lib/tokens/quota-stats.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-01T14:05:27Z"
concept_id: lib/tokens/quota-stats/tryProvider
language: typescript
---

# tryProvider

## Signature

```typescript
const tryProvider = (
    providerID: string | undefined,
    method: "source_provider" | "model_prefix" | "alias_fallback" | "cursor_api_alias",
    modelIDHint: string = normalizedModel,
  ) =>: PricingResolution | null
```

## Source
Lines 306–315 in `lib/tokens/quota-stats.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [quota-stats](/lib/tokens/quota-stats.md) |
| calls | [resolveModelForProvider](/lib/tokens/quota-stats/resolveModelForProvider.md) |
| called_by | [resolvePricingKey](/lib/tokens/quota-stats/resolvePricingKey.md) |
