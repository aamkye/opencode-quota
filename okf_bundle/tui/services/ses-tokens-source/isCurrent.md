---
okf_version: "0.2"
type: Function
title: isCurrent
resource: tui/services/ses-tokens-source.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:services"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-19T13:51:24Z"
concept_id: tui/services/ses-tokens-source/isCurrent
language: typescript
---

# isCurrent

## Signature

```typescript
function isCurrent(
    capturedSessionID: string,
    capturedGeneration: number,
    controller: AbortController,
  ): boolean
```

## Source
Lines 81–91 in `tui/services/ses-tokens-source.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [ses-tokens-source](/tui/services/ses-tokens-source.md) |
| called_by | [attemptLoad](/tui/services/ses-tokens-source/attemptLoad.md) |
| called_by | [createSesTokensSource](/tui/services/ses-tokens-source/createSesTokensSource.md) |
| called_by | [onSessionIDs](/tui/services/ses-tokens-source/onSessionIDs.md) |
