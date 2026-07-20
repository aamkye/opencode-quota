---
okf_version: "0.2"
type: Function
title: mountSesTokensPanel
resource: tests/ses-tokens-mounted.fixture.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tests"
  - "domain:ses-tokens-mounted.fixture.ts"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-20T09:11:20Z"
concept_id: tests/ses-tokens-mounted/mountSesTokensPanel
language: typescript
---

# mountSesTokensPanel

## Signature

```typescript
function mountSesTokensPanel(options: {
  sessionID?: string
  savedCollapsed?: boolean
  store?: Map<string, unknown>
} = {})
```

## Source
Lines 125–415 in `tests/ses-tokens-mounted.fixture.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [ses-tokens-mounted.fixture](/tests/ses-tokens-mounted.fixture.md) |
| calls | [set](/tests/ses-tokens-mounted/set.md) |
| calls | [filter](/tui/quota/filter.md) |
| calls | [get](/tests/ses-tokens-mounted/get.md) |
| calls | [createSesTokensSource](/tui/services/ses-tokens-source/createSesTokensSource.md) |
| calls | [tui](/tui/runtime/plugin/tui.md) |
| calls | [createHostNode](/tests/opentui-solid-host-runtime/createHostNode.md) |
| calls | [find](/tui/quota/find.md) |
| calls | [mountedTextNodes](/tests/ses-tokens-mounted/mountedTextNodes.md) |
| calls | [textOf](/tests/ses-tokens-mounted/textOf.md) |
| calls | [currentPanel](/tests/ses-tokens-mounted/currentPanel.md) |
| calls | [settle](/tests/ses-tokens-mounted/settle.md) |
| calls | [trackPanelLifecycle](/tests/ses-tokens-mounted/trackPanelLifecycle.md) |
| calls | [flushHost](/tests/ses-tokens-mounted/flushHost.md) |
| calls | [descendants](/tests/ses-tokens-mounted/descendants.md) |
| calls | [rowLayout](/tests/ses-tokens-mounted/rowLayout.md) |
| calls | [resolve](/tests/plugin-build/resolve.md) |
| calls | [cleanup](/tui/runtime/plugin/cleanup.md) |
