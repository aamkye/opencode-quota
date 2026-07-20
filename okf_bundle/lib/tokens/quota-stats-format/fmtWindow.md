---
okf_version: "0.2"
type: Function
title: fmtWindow
resource: lib/tokens/quota-stats-format.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-15T13:08:32Z"
concept_id: lib/tokens/quota-stats-format/fmtWindow
language: typescript
---

# fmtWindow

## Signature

```typescript
function fmtWindow(params: { sinceMs?: number; untilMs?: number }): string
```

## Source
Lines 64–69 in `lib/tokens/quota-stats-format.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [quota-stats-format](/lib/tokens/quota-stats-format.md) |
| calls | [fmtLocalDateTime](/lib/tokens/quota-stats-format/fmtLocalDateTime.md) |
| called_by | [formatQuotaStatsReport](/lib/tokens/quota-stats-format/formatQuotaStatsReport.md) |
