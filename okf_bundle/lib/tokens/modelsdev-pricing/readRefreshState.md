---
okf_version: "0.2"
type: Function
title: readRefreshState
resource: lib/tokens/modelsdev-pricing.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-15T13:08:32Z"
concept_id: lib/tokens/modelsdev-pricing/readRefreshState
language: typescript
---

# readRefreshState

## Signature

```typescript
function readRefreshState(path: string): Promise<PricingRefreshStateV1 | null>
```

## Source
Lines 349–356 in `lib/tokens/modelsdev-pricing.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [modelsdev-pricing](/lib/tokens/modelsdev-pricing.md) |
| calls | [normalizeRefreshState](/lib/tokens/modelsdev-pricing/normalizeRefreshState.md) |
| called_by | [maybeRefreshPricingSnapshot](/lib/tokens/modelsdev-pricing/maybeRefreshPricingSnapshot.md) |
| called_by | [readPricingRefreshState](/lib/tokens/modelsdev-pricing/readPricingRefreshState.md) |
