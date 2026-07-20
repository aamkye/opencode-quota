---
okf_version: "0.2"
type: Function
title: emptyTokenBuckets
resource: lib/tokens/token-buckets.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-01T14:03:56Z"
concept_id: lib/tokens/token-buckets/emptyTokenBuckets
language: typescript
---

# emptyTokenBuckets

## Signature

```typescript
function emptyTokenBuckets(): TokenBuckets
```

## Source
Lines 21–23 in `lib/tokens/token-buckets.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [token-buckets](/lib/tokens/token-buckets.md) |
| called_by | [formatQuotaStatsReport](/lib/tokens/quota-stats-format/formatQuotaStatsReport.md) |
| called_by | [aggregateUsage](/lib/tokens/quota-stats/aggregateUsage.md) |
| called_by | [tokenBucketsFromMessage](/lib/tokens/token-buckets/tokenBucketsFromMessage.md) |
