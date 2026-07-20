---
okf_version: "0.2"
type: Function
title: formatDiagnosticSourceModelId
resource: lib/tokens/quota-stats-format.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-15T13:08:32Z"
concept_id: lib/tokens/quota-stats-format/formatDiagnosticSourceModelId
language: typescript
---

# formatDiagnosticSourceModelId

## Signature

```typescript
function formatDiagnosticSourceModelId(modelID: string, maxWidth?: number): string
```

## Source
Lines 125–128 in `lib/tokens/quota-stats-format.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [quota-stats-format](/lib/tokens/quota-stats-format.md) |
| calls | [abbreviateDisplayedModelName](/lib/tokens/format-utils/abbreviateDisplayedModelName.md) |
| calls | [middleEllipsize](/lib/tokens/quota-stats-format/middleEllipsize.md) |
| calls | [normalizeSourceModelId](/lib/tokens/quota-stats-format/normalizeSourceModelId.md) |
| called_by | [formatQuotaStatsReport](/lib/tokens/quota-stats-format/formatQuotaStatsReport.md) |
