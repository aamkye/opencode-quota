---
okf_version: "0.2"
type: Function
title: readPricingRefreshState
resource: lib/tokens/modelsdev-pricing.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-15T13:08:32Z"
concept_id: lib/tokens/modelsdev-pricing/readPricingRefreshState
language: typescript
---

# readPricingRefreshState

## Signature

```typescript
function readPricingRefreshState(
  runtimeDirs?: OpencodeRuntimeDirs,
): Promise<PricingRefreshStateV1 | null>
```

## Source
Lines 358–362 in `lib/tokens/modelsdev-pricing.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [modelsdev-pricing](/lib/tokens/modelsdev-pricing.md) |
| calls | [readRefreshState](/lib/tokens/modelsdev-pricing/readRefreshState.md) |
| calls | [getRuntimePricingRefreshStatePath](/lib/tokens/modelsdev-pricing/getRuntimePricingRefreshStatePath.md) |
