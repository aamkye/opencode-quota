---
okf_version: "0.2"
type: Function
title: truncateTitle
description: Truncate a title to first 10 + last 10 chars with ellipsis in the middle.
resource: lib/tokens/quota-stats-format.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-15T13:08:32Z"
concept_id: lib/tokens/quota-stats-format/truncateTitle
language: typescript
---

# truncateTitle

Truncate a title to first 10 + last 10 chars with ellipsis in the middle.

## Signature

```typescript
function truncateTitle(title: string | undefined): string
```

## Docstring

Truncate a title to first 10 + last 10 chars with ellipsis in the middle.

## Source
Lines 145–151 in `lib/tokens/quota-stats-format.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [quota-stats-format](/lib/tokens/quota-stats-format.md) |
| called_by | [appendSessionRow](/lib/tokens/quota-stats-format/appendSessionRow.md) |
| called_by | [formatQuotaStatsReport](/lib/tokens/quota-stats-format/formatQuotaStatsReport.md) |
