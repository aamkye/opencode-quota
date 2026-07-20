---
okf_version: "0.2"
type: Function
title: totalTokenBuckets
resource: lib/tokens/token-buckets.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-01T14:03:56Z"
concept_id: lib/tokens/token-buckets/totalTokenBuckets
language: typescript
---

# totalTokenBuckets

## Signature

```typescript
function totalTokenBuckets(buckets: TokenBuckets): number
```

## Source
Lines 35–43 in `lib/tokens/token-buckets.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [token-buckets](/lib/tokens/token-buckets.md) |
| called_by | [appendSessionRow](/lib/tokens/quota-stats-format/appendSessionRow.md) |
| called_by | [formatQuotaStatsReport](/lib/tokens/quota-stats-format/formatQuotaStatsReport.md) |
| called_by | [hasRenderableSessionUsage](/lib/tokens/quota-stats-format/hasRenderableSessionUsage.md) |
