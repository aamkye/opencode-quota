---
okf_version: "0.2"
type: Function
title: normalizeRefreshState
resource: lib/tokens/modelsdev-pricing.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-15T13:08:32Z"
concept_id: lib/tokens/modelsdev-pricing/normalizeRefreshState
language: typescript
---

# normalizeRefreshState

## Signature

```typescript
function normalizeRefreshState(raw: unknown): PricingRefreshStateV1 | null
```

## Source
Lines 314–347 in `lib/tokens/modelsdev-pricing.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [modelsdev-pricing](/lib/tokens/modelsdev-pricing.md) |
| calls | [asRecord](/lib/tokens/modelsdev-pricing/asRecord.md) |
| called_by | [readRefreshState](/lib/tokens/modelsdev-pricing/readRefreshState.md) |
