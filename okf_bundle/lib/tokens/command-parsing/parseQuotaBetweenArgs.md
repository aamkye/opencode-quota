---
okf_version: "0.2"
type: Function
title: parseQuotaBetweenArgs
resource: lib/tokens/command-parsing.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-01T14:07:37Z"
concept_id: lib/tokens/command-parsing/parseQuotaBetweenArgs
language: typescript
---

# parseQuotaBetweenArgs

## Signature

```typescript
function parseQuotaBetweenArgs(
  input: string | undefined,
): { ok: true; startYmd: Ymd; endYmd: Ymd } | { ok: false; error: string }
```

## Source
Lines 47–99 in `lib/tokens/command-parsing.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [command-parsing](/lib/tokens/command-parsing.md) |
| calls | [parseYyyyMmDd](/lib/tokens/command-parsing/parseYyyyMmDd.md) |
| calls | [startOfLocalDayMs](/lib/tokens/command-parsing/startOfLocalDayMs.md) |
| called_by | [computeTokenReport](/lib/tokens/token-report-data/computeTokenReport.md) |
