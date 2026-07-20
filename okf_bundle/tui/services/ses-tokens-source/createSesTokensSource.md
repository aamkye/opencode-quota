---
okf_version: "0.2"
type: Function
title: createSesTokensSource
resource: tui/services/ses-tokens-source.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:services"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-19T13:51:24Z"
concept_id: tui/services/ses-tokens-source/createSesTokensSource
language: typescript
---

# createSesTokensSource

## Signature

```typescript
function createSesTokensSource({
  loadSnapshot,
  onEvent,
  setTimer = (callback, delayMs) => globalThis.setTimeout(callback, delayMs),
  clearTimer = (timer) => globalThis.clearTimeout(timer as ReturnType<typeof globalThis.setTimeout>),
}: SesTokensSourceDependencies): SesTokensSource
```

## Source
Lines 42–235 in `tui/services/ses-tokens-source.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [ses-tokens-source](/tui/services/ses-tokens-source.md) |
| calls | [clearRetryTimers](/tui/services/ses-tokens-source/clearRetryTimers.md) |
| calls | [isCurrent](/tui/services/ses-tokens-source/isCurrent.md) |
| calls | [notify](/tui/services/ses-tokens-source/notify.md) |
| calls | [attemptLoad](/tui/services/ses-tokens-source/attemptLoad.md) |
| calls | [startRefresh](/tui/services/ses-tokens-source/startRefresh.md) |
| calls | [some](/tui/quota/some.md) |
| calls | [hasKnownSessionID](/tui/services/ses-tokens-source/hasKnownSessionID.md) |
| calls | [scheduleRefresh](/tui/services/ses-tokens-source/scheduleRefresh.md) |
| calls | [setSessionID](/tui/services/ses-tokens-source/setSessionID.md) |
| calls | [clearTimers](/tui/services/ses-tokens-source/clearTimers.md) |
| called_by | [mountSesTokensPanel](/tests/ses-tokens-mounted/mountSesTokensPanel.md) |
| called_by | [createHarness](/tests/ses-tokens-source/createHarness.md) |
