---
okf_version: "0.2"
type: Function
title: aggregateUsage
resource: lib/tokens/quota-stats.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-01T14:05:27Z"
concept_id: lib/tokens/quota-stats/aggregateUsage
language: typescript
---

# aggregateUsage

## Signature

```typescript
function aggregateUsage(params: {
  sinceMs?: number;
  untilMs?: number;
  sessionID?: string;
  sessionIDs?: string[];
}): Promise<AggregateResult>
```

## Source
Lines 481–620 in `lib/tokens/quota-stats.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [quota-stats](/lib/tokens/quota-stats.md) |
| calls | [iterAssistantMessagesForSessions](/lib/tokens/opencode-storage/iterAssistantMessagesForSessions.md) |
| calls | [iterAssistantMessagesForSession](/lib/tokens/opencode-storage/iterAssistantMessagesForSession.md) |
| calls | [iterAssistantMessages](/lib/tokens/opencode-storage/iterAssistantMessages.md) |
| calls | [readAllSessionsIndex](/lib/tokens/opencode-storage/readAllSessionsIndex.md) |
| calls | [emptyTokenBuckets](/lib/tokens/token-buckets/emptyTokenBuckets.md) |
| calls | [tokenBucketsFromMessage](/lib/tokens/token-buckets/tokenBucketsFromMessage.md) |
| calls | [get](/lib/tokens/opencode-sqlite/get.md) |
| calls | [addTokenBuckets](/lib/tokens/token-buckets/addTokenBuckets.md) |
| calls | [resolvePricingKey](/lib/tokens/quota-stats/resolvePricingKey.md) |
| calls | [calculateCostUsd](/lib/tokens/quota-stats/calculateCostUsd.md) |
| calls | [classifyMissingPricing](/lib/tokens/quota-stats/classifyMissingPricing.md) |
| called_by | [computeUsageReport](/lib/tokens/token-report-data/computeUsageReport.md) |
