---
okf_version: "0.2"
type: Function
title: renderTokenReport
resource: lib/tokens/token-report-presenter.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-15T13:08:32Z"
concept_id: lib/tokens/token-report-presenter/renderTokenReport
language: typescript
---

# renderTokenReport

## Signature

```typescript
function renderTokenReport(data: TokenReportData): string
```

## Source
Lines 7–42 in `lib/tokens/token-report-presenter.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [token-report-presenter](/lib/tokens/token-report-presenter.md) |
| calls | [renderCommandHeading](/lib/tokens/format-utils/renderCommandHeading.md) |
| calls | [formatQuotaStatsReport](/lib/tokens/quota-stats-format/formatQuotaStatsReport.md) |
| called_by | [persistTokenReport](/tui/features/token-report/persistTokenReport.md) |
