---
okf_version: "0.2"
type: Function
title: filter
resource: tui/quota.tsx
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:quota.tsx"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-17T13:34:37Z"
concept_id: tui/quota/filter
language: typescript
---

# filter

## Signature

```typescript
filter(predicate: Predicate, thisArg?: unknown)
```

## Source
Lines 53–55 in `tui/quota.tsx`

## Relationships

| Type | Target |
|------|--------|
| related | [quota](/tui/quota.md) |
| called_by | [collectRecentUserText](/lib/session-rename/collectRecentUserText.md) |
| called_by | [formatQuotaStatsReport](/lib/tokens/quota-stats-format/formatQuotaStatsReport.md) |
| called_by | [freeSuffixCandidates](/lib/tokens/quota-stats/freeSuffixCandidates.md) |
| called_by | [getSessionTokenSummary](/lib/tokens/quota-stats/getSessionTokenSummary.md) |
| called_by | [moonshotaiPricingCandidates](/lib/tokens/quota-stats/moonshotaiPricingCandidates.md) |
| called_by | [normalizeSourceProviderId](/lib/tokens/quota-stats/normalizeSourceProviderId.md) |
| called_by | [getRenderableBlocks](/lib/tokens/report-document/getRenderableBlocks.md) |
| called_by | [renderMarkdownReport](/lib/tokens/report-document/renderMarkdownReport.md) |
| called_by | [renderPlainTextReport](/lib/tokens/report-document/renderPlainTextReport.md) |
| called_by | [detailText](/tests/compact-panel-mounted/detailText.md) |
| called_by | [dividers](/tests/compact-panel-mounted/dividers.md) |
| called_by | [mountCompactPanel](/tests/compact-panel-mounted/mountCompactPanel.md) |
| called_by | [render](/tests/compact-panel-mounted/render.md) |
| called_by | [texts](/tests/compact-panel-mounted/texts.md) |
| called_by | [descendantsOf](/tests/context-mounted/descendantsOf.md) |
| called_by | [mountContextPanel](/tests/context-mounted/mountContextPanel.md) |
| called_by | [onDispose](/tests/context-mounted/onDispose.md) |
| called_by | [view](/tests/context-mounted/view.md) |
| called_by | [descendantsOf](/tests/lsp-mounted/descendantsOf.md) |
| called_by | [mountLspPanel](/tests/lsp-mounted/mountLspPanel.md) |
| called_by | [onDispose](/tests/lsp-mounted/onDispose.md) |
| called_by | [readLspView](/tests/lsp-mounted/readLspView.md) |
| called_by | [createLifecycle](/tests/mcp-mounted/createLifecycle.md) |
| called_by | [descendantsOf](/tests/mcp-mounted/descendantsOf.md) |
| called_by | [mountMcpPanel](/tests/mcp-mounted/mountMcpPanel.md) |
| called_by | [onDispose](/tests/mcp-mounted/onDispose.md) |
| called_by | [view](/tests/mcp-mounted/view.md) |
| called_by | [createApi](/tests/plugin-adapters/createApi.md) |
| called_by | [createControlledHubMeta](/tests/plugin-adapters/createControlledHubMeta.md) |
| called_by | [createLifecycle](/tests/plugin-adapters/createLifecycle.md) |
| called_by | [on](/tests/plugin-adapters/on.md) |
| called_by | [onDispose](/tests/plugin-adapters/onDispose.md) |
| called_by | [providerSpecs](/tests/plugin-adapters/providerSpecs.md) |
| called_by | [createHostLifecycle](/tests/plugin-build/createHostLifecycle.md) |
| called_by | [onDispose](/tests/plugin-build/onDispose.md) |
| called_by | [assertPlainContextEntry](/tests/plugin-deploy/assertPlainContextEntry.md) |
| called_by | [assertPlainLspEntry](/tests/plugin-deploy/assertPlainLspEntry.md) |
| called_by | [assertPlainSesTokensEntry](/tests/plugin-deploy/assertPlainSesTokensEntry.md) |
| called_by | [assertPlainSubagentEntry](/tests/plugin-deploy/assertPlainSubagentEntry.md) |
| called_by | [assertPlainTodoEntry](/tests/plugin-deploy/assertPlainTodoEntry.md) |
| called_by | [managedArtifactPaths](/tests/plugin-deploy/managedArtifactPaths.md) |
| called_by | [mountPanel](/tests/presentation-mounted/mountPanel.md) |
| called_by | [installFakeClock](/tests/provider-openai/installFakeClock.md) |
| called_by | [restore](/tests/provider-openai/restore.md) |
| called_by | [decodeSyntheticFixture](/tests/provider-opencode-go-contract/decodeSyntheticFixture.md) |
| called_by | [active](/tests/provider-opencode-go/active.md) |
| called_by | [activeTimers](/tests/provider-opencode-go/activeTimers.md) |
| called_by | [advance](/tests/provider-opencode-go/advance.md) |
| called_by | [fakeClock](/tests/provider-opencode-go/fakeClock.md) |
| called_by | [installFakeClock](/tests/provider-zai/installFakeClock.md) |
| called_by | [restore](/tests/provider-zai/restore.md) |
| called_by | [activateQuotaPlugin](/tests/quota-composition/activateQuotaPlugin.md) |
| called_by | [headers](/tests/quota-composition/headers.md) |
| called_by | [createQuotaSelectionHost](/tests/quota-selection/createQuotaSelectionHost.md) |
| called_by | [onDispose](/tests/quota-selection/onDispose.md) |
| called_by | [mountSesTokensPanel](/tests/ses-tokens-mounted/mountSesTokensPanel.md) |
| called_by | [mountedTextNodes](/tests/ses-tokens-mounted/mountedTextNodes.md) |
| called_by | [onDispose](/tests/ses-tokens-mounted/onDispose.md) |
| called_by | [rowLayout](/tests/ses-tokens-mounted/rowLayout.md) |
| called_by | [view](/tests/ses-tokens-mounted/view.md) |
| called_by | [createScheduler](/tests/ses-tokens-source/createScheduler.md) |
| called_by | [pendingDelays](/tests/ses-tokens-source/pendingDelays.md) |
| called_by | [assertRelativeImports](/tests/shared-boundary/assertRelativeImports.md) |
| called_by | [directTexts](/tests/subagent-mounted/directTexts.md) |
| called_by | [mountSubagentPanel](/tests/subagent-mounted/mountSubagentPanel.md) |
| called_by | [onDispose](/tests/subagent-mounted/onDispose.md) |
| called_by | [rowLayout](/tests/subagent-mounted/rowLayout.md) |
| called_by | [textNodes](/tests/subagent-mounted/textNodes.md) |
| called_by | [view](/tests/subagent-mounted/view.md) |
| called_by | [createScheduler](/tests/subagent-source/createScheduler.md) |
| called_by | [pendingDelays](/tests/subagent-source/pendingDelays.md) |
| called_by | [descendantsOf](/tests/todo-mounted/descendantsOf.md) |
| called_by | [mountTodoPanel](/tests/todo-mounted/mountTodoPanel.md) |
| called_by | [onDispose](/tests/todo-mounted/onDispose.md) |
| called_by | [view](/tests/todo-mounted/view.md) |
| called_by | [composeQuotaPanel](/tui/features/quota/composeQuotaPanel.md) |
| called_by | [createSubagentPanelModel](/tui/features/subagent/createSubagentPanelModel.md) |
| called_by | [providers](/tui/home/providers.md) |
| called_by | [createOpenCodeGoProvider](/tui/providers/opencode-go/createOpenCodeGoProvider.md) |
| called_by | [scheduleBoundary](/tui/providers/opencode-go/scheduleBoundary.md) |
| called_by | [fetchZaiQuota](/tui/providers/zai/fetchZaiQuota.md) |
| called_by | [mapZaiPanelState](/tui/providers/zai/mapZaiPanelState.md) |
| called_by | [reactiveProviders](/tui/quota/reactiveProviders.md) |
| called_by | [providerSpecs](/tui/services/quota-provider-hub/providerSpecs.md) |
| called_by | [createSubagentSource](/tui/services/subagent-source/createSubagentSource.md) |
| called_by | [pruneFailures](/tui/services/subagent-source/pruneFailures.md) |
