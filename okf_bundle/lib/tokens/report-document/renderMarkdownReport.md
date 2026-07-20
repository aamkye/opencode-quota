---
okf_version: "0.2"
type: Function
title: renderMarkdownReport
resource: lib/tokens/report-document.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-01T14:05:42Z"
concept_id: lib/tokens/report-document/renderMarkdownReport
language: typescript
---

# renderMarkdownReport

## Signature

```typescript
function renderMarkdownReport(document: ReportDocument): string
```

## Source
Lines 129–160 in `lib/tokens/report-document.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [report-document](/lib/tokens/report-document.md) |
| calls | [renderCommandHeading](/lib/tokens/format-utils/renderCommandHeading.md) |
| calls | [filter](/tui/quota/filter.md) |
| calls | [getRenderableBlocks](/lib/tokens/report-document/getRenderableBlocks.md) |
| calls | [renderMarkdownBlock](/lib/tokens/report-document/renderMarkdownBlock.md) |
| called_by | [formatQuotaStatsReport](/lib/tokens/quota-stats-format/formatQuotaStatsReport.md) |
