---
okf_version: "0.2"
type: Function
title: resolve
resource: tests/plugin-build.test.mjs
tags:
  - "lang:javascript"
  - "type:Function"
  - "module:tests"
  - "domain:plugin-build.test.mjs"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-20T01:15:53Z"
concept_id: tests/plugin-build/resolve
language: javascript
---

# resolve

## Signature

```javascript
resolve(specifier, context, nextResolve)
```

## Source
Lines 27–34 in `tests/plugin-build.test.mjs`

## Relationships

| Type | Target |
|------|--------|
| related | [plugin-build.test](/tests/plugin-build.test.md) |
| called_by | [buildPlugins](/build-plugins/buildPlugins.md) |
| called_by | [copyBuiltArtifact](/deploy-plugins/copyBuiltArtifact.md) |
| called_by | [deployPlugins](/deploy-plugins/deployPlugins.md) |
| called_by | [main](/deploy-plugins/main.md) |
| called_by | [managedConfigPath](/deploy-plugins/managedConfigPath.md) |
| called_by | [specPath](/deploy-plugins/specPath.md) |
| called_by | [mountReactiveCompactPanel](/tests/compact-panel-mounted/mountReactiveCompactPanel.md) |
| called_by | [setDetail](/tests/compact-panel-mounted/setDetail.md) |
| called_by | [setup](/tests/compile-presentation/setup.md) |
| called_by | [runPluginRuntimeContractCheck](/tests/plugin-runtime/runPluginRuntimeContractCheck.md) |
| called_by | [cleanupLifecycle](/tests/provider-opencode-go/cleanupLifecycle.md) |
| called_by | [flushMicrotasks](/tests/provider-opencode-go/flushMicrotasks.md) |
| called_by | [flushEffects](/tests/quota-composition/flushEffects.md) |
| called_by | [mountSesTokensPanel](/tests/ses-tokens-mounted/mountSesTokensPanel.md) |
| called_by | [resolveList](/tests/ses-tokens-mounted/resolveList.md) |
| called_by | [resolveMessages](/tests/ses-tokens-mounted/resolveMessages.md) |
| called_by | [release](/tests/session-tree-snapshot/release.md) |
| called_by | [mountSubagentPanel](/tests/subagent-mounted/mountSubagentPanel.md) |
| called_by | [resolveList](/tests/subagent-mounted/resolveList.md) |
| called_by | [resolveMessages](/tests/subagent-mounted/resolveMessages.md) |
| called_by | [createOpenAiProvider](/tui/providers/openai/createOpenAiProvider.md) |
| called_by | [refresh](/tui/providers/openai/refresh.md) |
| called_by | [createOpenCodeGoProvider](/tui/providers/opencode-go/createOpenCodeGoProvider.md) |
| called_by | [refresh](/tui/providers/opencode-go/refresh.md) |
| called_by | [createZaiProvider](/tui/providers/zai/createZaiProvider.md) |
| called_by | [refresh](/tui/providers/zai/refresh.md) |
| called_by | [createMessageRequestLimiter](/tui/services/session-tree-snapshot/createMessageRequestLimiter.md) |
| called_by | [start](/tui/services/session-tree-snapshot/start.md) |
| called_by | [createMessageRequestLimiter](/tui/services/subagent-snapshot/createMessageRequestLimiter.md) |
| called_by | [start](/tui/services/subagent-snapshot/start.md) |
