---
okf_version: "0.2"
type: Function
title: formatQuotaStatsReport
resource: lib/tokens/quota-stats-format.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-15T13:08:32Z"
concept_id: lib/tokens/quota-stats-format/formatQuotaStatsReport
language: typescript
---

# formatQuotaStatsReport

## Signature

```typescript
function formatQuotaStatsReport(params: {
  title: string;
  result: AggregateResult;
  topModels?: number;
  topSessions?: number;
  focusSessionID?: string;
  /** When true, hides Window/Sessions columns and Top Sessions section (for session-only reports) */
  sessionOnly?: boolean;
  reportKind?: QuotaStatsReportKind;
  sessionTree?: {
    rootSessionID: string;
    nodes: SessionTreeNode[];
  };
  generatedAtMs?: number;
  tableOptions?: QuotaStatsReportTableOptions;
}): string
```

## Source
Lines 153–494 in `lib/tokens/quota-stats-format.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [quota-stats-format](/lib/tokens/quota-stats-format.md) |
| calls | [totalTokenBuckets](/lib/tokens/token-buckets/totalTokenBuckets.md) |
| calls | [fmtCompact](/lib/tokens/quota-stats-format/fmtCompact.md) |
| calls | [fmtUsd](/lib/tokens/quota-stats-format/fmtUsd.md) |
| calls | [fmtWindow](/lib/tokens/quota-stats-format/fmtWindow.md) |
| calls | [normalizeSourceName](/lib/tokens/quota-stats-format/normalizeSourceName.md) |
| calls | [get](/lib/tokens/opencode-sqlite/get.md) |
| calls | [sourceSortKey](/lib/tokens/quota-stats-format/sourceSortKey.md) |
| calls | [formatSourceModelId](/lib/tokens/quota-stats-format/formatSourceModelId.md) |
| calls | [treeRelationLabel](/lib/tokens/quota-stats-format/treeRelationLabel.md) |
| calls | [emptyTokenBuckets](/lib/tokens/token-buckets/emptyTokenBuckets.md) |
| calls | [truncateTitle](/lib/tokens/quota-stats-format/truncateTitle.md) |
| calls | [filter](/tui/quota/filter.md) |
| calls | [find](/tui/quota/find.md) |
| calls | [appendSessionRow](/lib/tokens/quota-stats-format/appendSessionRow.md) |
| calls | [missingFocusSessionLabel](/lib/tokens/quota-stats-format/missingFocusSessionLabel.md) |
| calls | [formatDiagnosticSourceModelId](/lib/tokens/quota-stats-format/formatDiagnosticSourceModelId.md) |
| calls | [renderMarkdownReport](/lib/tokens/report-document/renderMarkdownReport.md) |
| called_by | [renderTokenReport](/lib/tokens/token-report-presenter/renderTokenReport.md) |
