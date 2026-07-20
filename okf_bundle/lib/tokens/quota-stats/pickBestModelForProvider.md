---
okf_version: "0.2"
type: Function
title: pickBestModelForProvider
resource: lib/tokens/quota-stats.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-01T14:05:27Z"
concept_id: lib/tokens/quota-stats/pickBestModelForProvider
language: typescript
---

# pickBestModelForProvider

## Signature

```typescript
function pickBestModelForProvider(providerID: string, candidates: readonly string[]): string | null
```

## Source
Lines 161–169 in `lib/tokens/quota-stats.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [quota-stats](/lib/tokens/quota-stats.md) |
| calls | [hasCost](/lib/tokens/modelsdev-pricing/hasCost.md) |
| calls | [hasModel](/lib/tokens/modelsdev-pricing/hasModel.md) |
| called_by | [resolveModelForProvider](/lib/tokens/quota-stats/resolveModelForProvider.md) |
