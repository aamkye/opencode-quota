---
okf_version: "0.2"
type: Function
title: sessionLookupError
resource: lib/tokens/token-report-data.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-15T13:08:32Z"
concept_id: lib/tokens/token-report-data/sessionLookupError
language: typescript
---

# sessionLookupError

## Signature

```typescript
function sessionLookupError(
  command: string,
  generatedAtMs: number,
  error: SessionNotFoundError,
): TokenReportData
```

## Source
Lines 66–79 in `lib/tokens/token-report-data.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [token-report-data](/lib/tokens/token-report-data.md) |
| called_by | [computeTokenReport](/lib/tokens/token-report-data/computeTokenReport.md) |
