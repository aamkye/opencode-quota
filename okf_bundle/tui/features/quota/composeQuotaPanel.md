---
okf_version: "0.2"
type: Function
title: composeQuotaPanel
resource: tui/features/quota.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:features"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-17T13:34:37Z"
concept_id: tui/features/quota/composeQuotaPanel
language: typescript
---

# composeQuotaPanel

## Signature

```typescript
function composeQuotaPanel(
  selection: QuotaSelection,
  providers: readonly QuotaProviderAdapter[],
  requestedOptions?: QuotaCompositionOptions,
): PanelModel
```

## Source
Lines 300–375 in `tui/features/quota.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [quota](/tui/features/quota.md) |
| calls | [compositionOptions](/tui/features/quota/compositionOptions.md) |
| calls | [filter](/tui/quota/filter.md) |
| calls | [find](/tui/quota/find.md) |
| calls | [effectiveHideInactive](/tui/features/quota/effectiveHideInactive.md) |
| calls | [metric](/tui/features/quota/metric.md) |
| calls | [providerPrimaryPct](/tui/features/quota/providerPrimaryPct.md) |
| calls | [providerName](/tui/features/quota/providerName.md) |
| calls | [sortByOrderThenId](/tui/presentation/types/sortByOrderThenId.md) |
| calls | [orderedProviderItems](/tui/features/quota/orderedProviderItems.md) |
| calls | [providerItems](/tui/features/quota/providerItems.md) |
| calls | [pluginDescriptor](/tui/runtime/manifest/pluginDescriptor.md) |
| calls | [summary](/tui/features/quota/summary.md) |
