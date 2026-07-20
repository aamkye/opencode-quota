---
okf_version: "0.2"
type: Function
title: parseModelIdHint
resource: lib/tokens/quota-stats.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-01T14:05:27Z"
concept_id: lib/tokens/quota-stats/parseModelIdHint
language: typescript
---

# parseModelIdHint

## Signature

```typescript
function parseModelIdHint(rawModelId?: string): { providerHint?: string; modelPart?: string }
```

## Source
Lines 171–179 in `lib/tokens/quota-stats.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [quota-stats](/lib/tokens/quota-stats.md) |
| called_by | [resolvePricingKey](/lib/tokens/quota-stats/resolvePricingKey.md) |
