---
okf_version: "0.2"
type: Function
title: tokenReportCommands
resource: tui/token-report.tsx
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:token-report.tsx"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-17T13:34:37Z"
concept_id: tui/token-report/tokenReportCommands
language: typescript
---

# tokenReportCommands

## Signature

```typescript
function tokenReportCommands(
  api: TuiPluginApi,
  setRangeDialogClose: (close: () => void) => void = () => {},
): TuiCommand[]
```

## Source
Lines 13–55 in `tui/token-report.tsx`

## Relationships

| Type | Target |
|------|--------|
| related | [token-report](/tui/token-report.md) |
| calls | [activeSessionID](/tui/features/token-report/activeSessionID.md) |
| calls | [persistTokenReport](/tui/features/token-report/persistTokenReport.md) |
| calls | [close](/tui/token-report/close.md) |
| called_by | [registerTokenReportTui](/tui/token-report/registerTokenReportTui.md) |
