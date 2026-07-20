---
okf_version: "0.2"
type: Function
title: providerSpecs
resource: tui/services/quota-provider-hub.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:services"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-17T13:34:37Z"
concept_id: tui/services/quota-provider-hub/providerSpecs
language: typescript
---

# providerSpecs

## Signature

```typescript
function providerSpecs(
  api: TuiPluginApi,
  factories: ProviderFactorySet,
  demands: readonly QuotaProviderDemand[],
): ProviderSpec[]
```

## Source
Lines 109–154 in `tui/services/quota-provider-hub.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [quota-provider-hub](/tui/services/quota-provider-hub.md) |
| calls | [filter](/tui/quota/filter.md) |
| calls | [zaiOptions](/tui/services/quota-provider-hub/zaiOptions.md) |
| calls | [openAiOptions](/tui/services/quota-provider-hub/openAiOptions.md) |
| calls | [openCodeGoOptions](/tui/services/quota-provider-hub/openCodeGoOptions.md) |
| calls | [zaiKey](/tui/services/quota-provider-hub/zaiKey.md) |
| calls | [openAiKey](/tui/services/quota-provider-hub/openAiKey.md) |
| calls | [openCodeGoKey](/tui/services/quota-provider-hub/openCodeGoKey.md) |
| calls | [some](/tui/quota/some.md) |
| called_by | [createQuotaProviderHub](/tui/services/quota-provider-hub/createQuotaProviderHub.md) |
| called_by | [reconcile](/tui/services/quota-provider-hub/reconcile.md) |
