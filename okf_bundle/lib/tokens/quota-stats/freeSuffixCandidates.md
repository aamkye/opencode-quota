---
okf_version: "0.2"
type: Function
title: freeSuffixCandidates
resource: lib/tokens/quota-stats.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-01T14:05:27Z"
concept_id: lib/tokens/quota-stats/freeSuffixCandidates
language: typescript
---

# freeSuffixCandidates

## Signature

```typescript
function freeSuffixCandidates(modelId: string): string[]
```

## Source
Lines 154–159 in `lib/tokens/quota-stats.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [quota-stats](/lib/tokens/quota-stats.md) |
| calls | [stripFreeSuffix](/lib/tokens/quota-stats/stripFreeSuffix.md) |
| calls | [filter](/tui/quota/filter.md) |
| called_by | [moonshotaiPricingCandidates](/lib/tokens/quota-stats/moonshotaiPricingCandidates.md) |
| called_by | [resolveModelForProvider](/lib/tokens/quota-stats/resolveModelForProvider.md) |
| called_by | [resolvePricingKey](/lib/tokens/quota-stats/resolvePricingKey.md) |
