---
okf_version: "0.2"
type: Function
title: get
resource: lib/tokens/opencode-sqlite.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-01T14:04:09Z"
concept_id: lib/tokens/opencode-sqlite/get
language: typescript
---

# get

## Signature

```typescript
get(sql: string, params?: unknown[]): T | null
```

## Type Parameters

- `T = unknown`

## Source
Lines 67–70 in `lib/tokens/opencode-sqlite.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [opencode-sqlite](/lib/tokens/opencode-sqlite.md) |
| calls | [toParams](/lib/tokens/opencode-sqlite/toParams.md) |
| called_by | [ensureModelIndex](/lib/tokens/modelsdev-pricing/ensureModelIndex.md) |
| called_by | [listProvidersForModelId](/lib/tokens/modelsdev-pricing/listProvidersForModelId.md) |
| called_by | [maybeRefreshPricingSnapshot](/lib/tokens/modelsdev-pricing/maybeRefreshPricingSnapshot.md) |
| called_by | [createPreparedSqliteConn](/lib/tokens/opencode-sqlite/createPreparedSqliteConn.md) |
| called_by | [openWithBunSqlite](/lib/tokens/opencode-sqlite/openWithBunSqlite.md) |
| called_by | [iterAssistantMessagesForSession](/lib/tokens/opencode-storage/iterAssistantMessagesForSession.md) |
| called_by | [formatQuotaStatsReport](/lib/tokens/quota-stats-format/formatQuotaStatsReport.md) |
| called_by | [aggregateUsage](/lib/tokens/quota-stats/aggregateUsage.md) |
| called_by | [getSessionTokenSummary](/lib/tokens/quota-stats/getSessionTokenSummary.md) |
| called_by | [resolveSessionTree](/lib/tokens/quota-stats/resolveSessionTree.md) |
| called_by | [visit](/lib/tokens/quota-stats/visit.md) |
| called_by | [getCommandTitle](/lib/tokens/token-commands/getCommandTitle.md) |
| called_by | [getTokenReportCommandSpec](/lib/tokens/token-commands/getTokenReportCommandSpec.md) |
