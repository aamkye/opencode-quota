---
okf_version: "0.2"
type: Function
title: getTokenReportCommandSpec
resource: lib/tokens/token-commands.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-15T13:08:32Z"
concept_id: lib/tokens/token-commands/getTokenReportCommandSpec
language: typescript
---

# getTokenReportCommandSpec

## Signature

```typescript
function getTokenReportCommandSpec(id: TokenReportCommandId): TokenReportCommandSpec | undefined
```

## Source
Lines 43–45 in `lib/tokens/token-commands.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [token-commands](/lib/tokens/token-commands.md) |
| calls | [get](/lib/tokens/opencode-sqlite/get.md) |
| called_by | [computeTokenReport](/lib/tokens/token-report-data/computeTokenReport.md) |
