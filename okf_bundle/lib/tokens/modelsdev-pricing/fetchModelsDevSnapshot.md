---
okf_version: "0.2"
type: Function
title: fetchModelsDevSnapshot
resource: lib/tokens/modelsdev-pricing.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-15T13:08:32Z"
concept_id: lib/tokens/modelsdev-pricing/fetchModelsDevSnapshot
language: typescript
---

# fetchModelsDevSnapshot

## Signature

```typescript
function fetchModelsDevSnapshot(params: {
  timeoutMs: number;
  state: PricingRefreshStateV1;
  fetchFn?: typeof fetch;
}): Promise<Response>
```

## Source
Lines 438–462 in `lib/tokens/modelsdev-pricing.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [modelsdev-pricing](/lib/tokens/modelsdev-pricing.md) |
| calls | [fetchWithTimeout](/lib/tokens/http/fetchWithTimeout.md) |
| called_by | [maybeRefreshPricingSnapshot](/lib/tokens/modelsdev-pricing/maybeRefreshPricingSnapshot.md) |
