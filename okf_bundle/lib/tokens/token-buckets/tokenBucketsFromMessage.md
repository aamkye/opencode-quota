---
okf_version: "0.2"
type: Function
title: tokenBucketsFromMessage
resource: lib/tokens/token-buckets.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-01T14:03:56Z"
concept_id: lib/tokens/token-buckets/tokenBucketsFromMessage
language: typescript
---

# tokenBucketsFromMessage

## Signature

```typescript
function tokenBucketsFromMessage(message: TokenCarrier): TokenBuckets
```

## Source
Lines 45–56 in `lib/tokens/token-buckets.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [token-buckets](/lib/tokens/token-buckets.md) |
| calls | [emptyTokenBuckets](/lib/tokens/token-buckets/emptyTokenBuckets.md) |
| called_by | [aggregateUsage](/lib/tokens/quota-stats/aggregateUsage.md) |
