---
okf_version: "0.2"
type: Function
title: computeTokenReport
resource: lib/tokens/token-report-data.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-15T13:08:32Z"
concept_id: lib/tokens/token-report-data/computeTokenReport
language: typescript
---

# computeTokenReport

## Signature

```typescript
function computeTokenReport(
  params: ComputeTokenReportParams,
  injectedDependencies?: ComputeTokenReportDependencies,
): Promise<TokenReportData>
```

## Source
Lines 115–204 in `lib/tokens/token-report-data.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [token-report-data](/lib/tokens/token-report-data.md) |
| calls | [getTokenReportCommandSpec](/lib/tokens/token-commands/getTokenReportCommandSpec.md) |
| calls | [sessionLookupError](/lib/tokens/token-report-data/sessionLookupError.md) |
| calls | [parseQuotaBetweenArgs](/lib/tokens/command-parsing/parseQuotaBetweenArgs.md) |
| calls | [computeUsageReport](/lib/tokens/token-report-data/computeUsageReport.md) |
| calls | [startOfLocalDayMs](/lib/tokens/command-parsing/startOfLocalDayMs.md) |
| calls | [startOfNextLocalDayMs](/lib/tokens/command-parsing/startOfNextLocalDayMs.md) |
| calls | [resolveSessionTree](/lib/tokens/quota-stats/resolveSessionTree.md) |
