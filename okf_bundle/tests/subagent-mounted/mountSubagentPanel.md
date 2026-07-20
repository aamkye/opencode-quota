---
okf_version: "0.2"
type: Function
title: mountSubagentPanel
resource: tests/subagent-mounted.fixture.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tests"
  - "domain:subagent-mounted.fixture.ts"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-20T01:15:53Z"
concept_id: tests/subagent-mounted/mountSubagentPanel
language: typescript
---

# mountSubagentPanel

## Signature

```typescript
function mountSubagentPanel(options: {
  parentID?: string
  store?: Map<string, unknown>
} = {})
```

## Source
Lines 293–703 in `tests/subagent-mounted.fixture.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [subagent-mounted.fixture](/tests/subagent-mounted.fixture.md) |
| calls | [filter](/tui/quota/filter.md) |
| calls | [get](/tests/subagent-mounted/get.md) |
| calls | [set](/tests/subagent-mounted/set.md) |
| calls | [createSubagentSource](/tui/services/subagent-source/createSubagentSource.md) |
| calls | [tui](/tui/runtime/plugin/tui.md) |
| calls | [createHostNode](/tests/opentui-solid-host-runtime/createHostNode.md) |
| calls | [find](/tui/quota/find.md) |
| calls | [textNodes](/tests/subagent-mounted/textNodes.md) |
| calls | [textOf](/tests/subagent-mounted/textOf.md) |
| calls | [currentPanel](/tests/subagent-mounted/currentPanel.md) |
| calls | [settle](/tests/subagent-mounted/settle.md) |
| calls | [trackPanelLifecycle](/tests/subagent-mounted/trackPanelLifecycle.md) |
| calls | [flushHost](/tests/subagent-mounted/flushHost.md) |
| calls | [descendants](/tests/subagent-mounted/descendants.md) |
| calls | [isDivider](/tests/subagent-mounted/isDivider.md) |
| calls | [collectBodyItems](/tests/subagent-mounted/collectBodyItems.md) |
| calls | [directTexts](/tests/subagent-mounted/directTexts.md) |
| calls | [rowLayout](/tests/subagent-mounted/rowLayout.md) |
| calls | [isExplicitDivider](/tests/subagent-mounted/isExplicitDivider.md) |
| calls | [wrappingText](/tests/subagent-mounted/wrappingText.md) |
| calls | [clickRow](/tests/subagent-mounted/clickRow.md) |
| calls | [resolve](/tests/plugin-build/resolve.md) |
| calls | [resolveList](/tests/subagent-mounted/resolveList.md) |
| calls | [resolveMessages](/tests/subagent-mounted/resolveMessages.md) |
| calls | [cleanup](/tui/runtime/plugin/cleanup.md) |
