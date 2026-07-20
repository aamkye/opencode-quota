---
okf_version: "0.2"
type: Function
title: setSessionID
resource: tui/services/ses-tokens-source.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:services"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-19T13:51:24Z"
concept_id: tui/services/ses-tokens-source/setSessionID
language: typescript
---

# setSessionID

## Signature

```typescript
function setSessionID(nextSessionID: string): void
```

## Source
Lines 195–214 in `tui/services/ses-tokens-source.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [ses-tokens-source](/tui/services/ses-tokens-source.md) |
| calls | [clearTimers](/tui/services/ses-tokens-source/clearTimers.md) |
| calls | [notify](/tui/services/ses-tokens-source/notify.md) |
| calls | [attemptLoad](/tui/services/ses-tokens-source/attemptLoad.md) |
| called_by | [createSesTokensSource](/tui/services/ses-tokens-source/createSesTokensSource.md) |
