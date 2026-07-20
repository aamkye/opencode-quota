---
okf_version: "0.2"
type: Function
title: find
resource: tui/quota.tsx
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:quota.tsx"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-17T13:34:37Z"
concept_id: tui/quota/find
language: typescript
---

# find

## Signature

```typescript
find(predicate: Predicate, thisArg?: unknown)
```

## Source
Lines 56–58 in `tui/quota.tsx`

## Relationships

| Type | Target |
|------|--------|
| related | [quota](/tui/quota.md) |
| called_by | [managedConfigPath](/deploy-plugins/managedConfigPath.md) |
| called_by | [createSessionRenameHooks](/lib/session-rename/createSessionRenameHooks.md) |
| called_by | [generateTitle](/lib/session-rename/generateTitle.md) |
| called_by | [formatQuotaStatsReport](/lib/tokens/quota-stats-format/formatQuotaStatsReport.md) |
| called_by | [header](/tests/compact-panel-mounted/header.md) |
| called_by | [marker](/tests/compact-panel-mounted/marker.md) |
| called_by | [metric](/tests/compact-panel-mounted/metric.md) |
| called_by | [stale](/tests/compact-panel-mounted/stale.md) |
| called_by | [title](/tests/compact-panel-mounted/title.md) |
| called_by | [mountContextPanel](/tests/context-mounted/mountContextPanel.md) |
| called_by | [view](/tests/context-mounted/view.md) |
| called_by | [readLspView](/tests/lsp-mounted/readLspView.md) |
| called_by | [mountMcpPanel](/tests/mcp-mounted/mountMcpPanel.md) |
| called_by | [view](/tests/mcp-mounted/view.md) |
| called_by | [item](/tests/provider-openai/item.md) |
| called_by | [item](/tests/provider-opencode-go/item.md) |
| called_by | [item](/tests/provider-zai/item.md) |
| called_by | [activateQuotaPlugin](/tests/quota-composition/activateQuotaPlugin.md) |
| called_by | [item](/tests/quota-composition/item.md) |
| called_by | [otherProviderIDs](/tests/quota-composition/otherProviderIDs.md) |
| called_by | [currentPanel](/tests/ses-tokens-mounted/currentPanel.md) |
| called_by | [mountSesTokensPanel](/tests/ses-tokens-mounted/mountSesTokensPanel.md) |
| called_by | [runTimer](/tests/ses-tokens-mounted/runTimer.md) |
| called_by | [view](/tests/ses-tokens-mounted/view.md) |
| called_by | [createScheduler](/tests/ses-tokens-source/createScheduler.md) |
| called_by | [runNext](/tests/ses-tokens-source/runNext.md) |
| called_by | [namedImportLocalName](/tests/shared-boundary/namedImportLocalName.md) |
| called_by | [typeOnlyNamedImportLocalName](/tests/shared-boundary/typeOnlyNamedImportLocalName.md) |
| called_by | [clickRest](/tests/subagent-mounted/clickRest.md) |
| called_by | [currentPanel](/tests/subagent-mounted/currentPanel.md) |
| called_by | [mountSubagentPanel](/tests/subagent-mounted/mountSubagentPanel.md) |
| called_by | [runInterval](/tests/subagent-mounted/runInterval.md) |
| called_by | [runTimer](/tests/subagent-mounted/runTimer.md) |
| called_by | [view](/tests/subagent-mounted/view.md) |
| called_by | [wrappingText](/tests/subagent-mounted/wrappingText.md) |
| called_by | [createScheduler](/tests/subagent-source/createScheduler.md) |
| called_by | [run](/tests/subagent-source/run.md) |
| called_by | [timer](/tests/subagent-source/timer.md) |
| called_by | [mountTodoPanel](/tests/todo-mounted/mountTodoPanel.md) |
| called_by | [view](/tests/todo-mounted/view.md) |
| called_by | [commandBySlash](/tests/token-tui/commandBySlash.md) |
| called_by | [createTuiApi](/tests/token-tui/createTuiApi.md) |
| called_by | [dispatchKey](/tests/token-tui/dispatchKey.md) |
| called_by | [createContextPanelModel](/tui/features/context/createContextPanelModel.md) |
| called_by | [composeQuotaPanel](/tui/features/quota/composeQuotaPanel.md) |
| called_by | [createQuotaSelection](/tui/features/quota/createQuotaSelection.md) |
| called_by | [providerPrimaryPct](/tui/features/quota/providerPrimaryPct.md) |
| called_by | [resolveSupportedProvider](/tui/features/quota/resolveSupportedProvider.md) |
| called_by | [findOpenAiAuthFromProviders](/tui/providers/openai/findOpenAiAuthFromProviders.md) |
| called_by | [fetchZaiQuota](/tui/providers/zai/fetchZaiQuota.md) |
| called_by | [findZaiKeyFromProviders](/tui/providers/zai/findZaiKeyFromProviders.md) |
| called_by | [keyFromAccountArray](/tui/providers/zai/keyFromAccountArray.md) |
| called_by | [keyFromAccountFile](/tui/providers/zai/keyFromAccountFile.md) |
| called_by | [reactiveProviders](/tui/quota/reactiveProviders.md) |
| called_by | [pluginDescriptor](/tui/runtime/manifest/pluginDescriptor.md) |
