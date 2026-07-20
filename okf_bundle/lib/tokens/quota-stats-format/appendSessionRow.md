---
okf_version: "0.2"
type: Function
title: appendSessionRow
resource: lib/tokens/quota-stats-format.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-15T13:08:32Z"
concept_id: lib/tokens/quota-stats-format/appendSessionRow
language: typescript
---

# appendSessionRow

## Signature

```typescript
function appendSessionRow(sessionRows: string[][], row: SessionReportRow, current = ""): void
```

## Source
Lines 27–36 in `lib/tokens/quota-stats-format.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [quota-stats-format](/lib/tokens/quota-stats-format.md) |
| calls | [fmtUsd](/lib/tokens/quota-stats-format/fmtUsd.md) |
| calls | [fmtCompact](/lib/tokens/quota-stats-format/fmtCompact.md) |
| calls | [totalTokenBuckets](/lib/tokens/token-buckets/totalTokenBuckets.md) |
| calls | [truncateTitle](/lib/tokens/quota-stats-format/truncateTitle.md) |
| called_by | [formatQuotaStatsReport](/lib/tokens/quota-stats-format/formatQuotaStatsReport.md) |
