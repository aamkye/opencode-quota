---
okf_version: "0.2"
type: Function
title: persistTokenReport
resource: tui/features/token-report.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:features"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-17T13:34:37Z"
concept_id: tui/features/token-report/persistTokenReport
language: typescript
---

# persistTokenReport

## Signature

```typescript
function persistTokenReport(
  api: TuiPluginApi,
  sessionID: string,
  command: TokenReportCommandId,
  argumentsValue?: string,
): Promise<void>
```

## Source
Lines 13–38 in `tui/features/token-report.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [token-report](/tui/features/token-report.md) |
| calls | [renderTokenReport](/lib/tokens/token-report-presenter/renderTokenReport.md) |
| called_by | [onConfirm](/tui/token-report/onConfirm.md) |
| called_by | [run](/tui/token-report/run.md) |
| called_by | [tokenReportCommands](/tui/token-report/tokenReportCommands.md) |
