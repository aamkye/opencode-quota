---
okf_version: "0.2"
type: Function
title: createQuotaProviderHub
resource: tui/services/quota-provider-hub.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:services"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-17T13:34:37Z"
concept_id: tui/services/quota-provider-hub/createQuotaProviderHub
language: typescript
---

# createQuotaProviderHub

## Signature

```typescript
function createQuotaProviderHub(
  api: TuiPluginApi,
  factories: ProviderFactorySet = { createZaiProvider, createOpenAiProvider, createOpenCodeGoProvider },
): QuotaProviderHub
```

## Source
Lines 156–263 in `tui/services/quota-provider-hub.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [quota-provider-hub](/tui/services/quota-provider-hub.md) |
| calls | [providerSpecs](/tui/services/quota-provider-hub/providerSpecs.md) |
| calls | [dispose](/tui/services/quota-provider-hub/dispose.md) |
| calls | [some](/tui/quota/some.md) |
| calls | [notify](/tui/services/quota-provider-hub/notify.md) |
| calls | [reconcile](/tui/services/quota-provider-hub/reconcile.md) |
| called_by | [acquireQuotaProviderHub](/tui/services/quota-provider-hub/acquireQuotaProviderHub.md) |
