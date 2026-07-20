---
okf_version: "0.2"
type: Function
title: attemptLoad
resource: tui/services/ses-tokens-source.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:services"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-19T13:51:24Z"
concept_id: tui/services/ses-tokens-source/attemptLoad
language: typescript
---

# attemptLoad

## Signature

```typescript
function attemptLoad(
    capturedSessionID: string,
    capturedGeneration: number,
    attempt: number,
    controller: AbortController,
  ): Promise<void>
```

## Source
Lines 93–140 in `tui/services/ses-tokens-source.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [ses-tokens-source](/tui/services/ses-tokens-source.md) |
| calls | [isCurrent](/tui/services/ses-tokens-source/isCurrent.md) |
| calls | [notify](/tui/services/ses-tokens-source/notify.md) |
| called_by | [createSesTokensSource](/tui/services/ses-tokens-source/createSesTokensSource.md) |
| called_by | [setSessionID](/tui/services/ses-tokens-source/setSessionID.md) |
| called_by | [startRefresh](/tui/services/ses-tokens-source/startRefresh.md) |
