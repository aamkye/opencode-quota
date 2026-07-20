---
okf_version: "0.2"
type: Function
title: startRefresh
resource: tui/services/ses-tokens-source.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:services"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-19T13:51:24Z"
concept_id: tui/services/ses-tokens-source/startRefresh
language: typescript
---

# startRefresh

## Signature

```typescript
function startRefresh(): void
```

## Source
Lines 142–148 in `tui/services/ses-tokens-source.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [ses-tokens-source](/tui/services/ses-tokens-source.md) |
| calls | [clearRetryTimers](/tui/services/ses-tokens-source/clearRetryTimers.md) |
| calls | [attemptLoad](/tui/services/ses-tokens-source/attemptLoad.md) |
| called_by | [createSesTokensSource](/tui/services/ses-tokens-source/createSesTokensSource.md) |
| called_by | [scheduleRefresh](/tui/services/ses-tokens-source/scheduleRefresh.md) |
