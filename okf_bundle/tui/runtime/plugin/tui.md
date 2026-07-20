---
okf_version: "0.2"
type: Function
title: tui
resource: tui/runtime/plugin.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:runtime"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-17T13:34:37Z"
concept_id: tui/runtime/plugin/tui
language: typescript
---

# tui

## Signature

```typescript
tui(api, options, meta)
```

## Source
Lines 82–139 in `tui/runtime/plugin.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [plugin](/tui/runtime/plugin.md) |
| calls | [acquireService](/tui/runtime/plugin/acquireService.md) |
| calls | [activate](/tests/plugin-adapters/activate.md) |
| calls | [cleanup](/tui/runtime/plugin/cleanup.md) |
| called_by | [mountContextPanel](/tests/context-mounted/mountContextPanel.md) |
| called_by | [mountLspPanel](/tests/lsp-mounted/mountLspPanel.md) |
| called_by | [mountMcpPanel](/tests/mcp-mounted/mountMcpPanel.md) |
| called_by | [activate](/tests/plugin-adapters/activate.md) |
| called_by | [activateQuotaPlugin](/tests/quota-composition/activateQuotaPlugin.md) |
| called_by | [mountSesTokensPanel](/tests/ses-tokens-mounted/mountSesTokensPanel.md) |
| called_by | [mountSubagentPanel](/tests/subagent-mounted/mountSubagentPanel.md) |
| called_by | [mountTodoPanel](/tests/todo-mounted/mountTodoPanel.md) |
