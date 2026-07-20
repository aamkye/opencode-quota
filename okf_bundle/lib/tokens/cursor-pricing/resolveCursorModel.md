---
okf_version: "0.2"
type: Function
title: resolveCursorModel
resource: lib/tokens/cursor-pricing.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-01T14:06:27Z"
concept_id: lib/tokens/cursor-pricing/resolveCursorModel
language: typescript
---

# resolveCursorModel

## Signature

```typescript
function resolveCursorModel(rawModelId?: string): CursorResolvedModel
```

## Source
Lines 151–172 in `lib/tokens/cursor-pricing.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [cursor-pricing](/lib/tokens/cursor-pricing.md) |
| calls | [extractCursorModelPart](/lib/tokens/cursor-pricing/extractCursorModelPart.md) |
| called_by | [resolvePricingKey](/lib/tokens/quota-stats/resolvePricingKey.md) |
