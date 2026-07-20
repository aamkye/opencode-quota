---
okf_version: "0.2"
type: Function
title: cleanup
resource: tui/runtime/plugin.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:runtime"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-17T13:34:37Z"
concept_id: tui/runtime/plugin/cleanup
language: typescript
---

# cleanup

## Signature

```typescript
const cleanup = (activationFailure?: { error: unknown }) =>
```

## Source
Lines 97–118 in `tui/runtime/plugin.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [plugin](/tui/runtime/plugin.md) |
| called_by | [dispose](/tests/context-mounted/dispose.md) |
| called_by | [mountContextPanel](/tests/context-mounted/mountContextPanel.md) |
| called_by | [dispose](/tests/lsp-mounted/dispose.md) |
| called_by | [mountLspPanel](/tests/lsp-mounted/mountLspPanel.md) |
| called_by | [createLifecycle](/tests/mcp-mounted/createLifecycle.md) |
| called_by | [dispose](/tests/ses-tokens-mounted/dispose.md) |
| called_by | [mountSesTokensPanel](/tests/ses-tokens-mounted/mountSesTokensPanel.md) |
| called_by | [dispose](/tests/subagent-mounted/dispose.md) |
| called_by | [mountSubagentPanel](/tests/subagent-mounted/mountSubagentPanel.md) |
| called_by | [dispose](/tests/todo-mounted/dispose.md) |
| called_by | [mountTodoPanel](/tests/todo-mounted/mountTodoPanel.md) |
| called_by | [defineTuiPlugin](/tui/runtime/plugin/defineTuiPlugin.md) |
| called_by | [tui](/tui/runtime/plugin/tui.md) |
