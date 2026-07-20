---
okf_version: "0.2"
type: Function
title: moonshotaiPricingCandidates
resource: lib/tokens/quota-stats.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-01T14:05:27Z"
concept_id: lib/tokens/quota-stats/moonshotaiPricingCandidates
language: typescript
---

# moonshotaiPricingCandidates

## Signature

```typescript
function moonshotaiPricingCandidates(model: string): string[]
```

## Source
Lines 243–250 in `lib/tokens/quota-stats.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [quota-stats](/lib/tokens/quota-stats.md) |
| calls | [freeSuffixCandidates](/lib/tokens/quota-stats/freeSuffixCandidates.md) |
| calls | [filter](/tui/quota/filter.md) |
| called_by | [resolveModelForProvider](/lib/tokens/quota-stats/resolveModelForProvider.md) |
