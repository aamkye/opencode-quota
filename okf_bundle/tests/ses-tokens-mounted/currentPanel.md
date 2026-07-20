---
okf_version: "0.2"
type: Function
title: currentPanel
resource: tests/ses-tokens-mounted.fixture.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tests"
  - "domain:ses-tokens-mounted.fixture.ts"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-20T09:11:20Z"
concept_id: tests/ses-tokens-mounted/currentPanel
language: typescript
---

# currentPanel

## Signature

```typescript
function currentPanel(): HostNode | undefined
```

## Source
Lines 255–258 in `tests/ses-tokens-mounted.fixture.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [ses-tokens-mounted.fixture](/tests/ses-tokens-mounted.fixture.md) |
| calls | [find](/tui/quota/find.md) |
| calls | [mountedTextNodes](/tests/ses-tokens-mounted/mountedTextNodes.md) |
| calls | [textOf](/tests/ses-tokens-mounted/textOf.md) |
| called_by | [mountSesTokensPanel](/tests/ses-tokens-mounted/mountSesTokensPanel.md) |
| called_by | [setSessionID](/tests/ses-tokens-mounted/setSessionID.md) |
| called_by | [trackPanelLifecycle](/tests/ses-tokens-mounted/trackPanelLifecycle.md) |
