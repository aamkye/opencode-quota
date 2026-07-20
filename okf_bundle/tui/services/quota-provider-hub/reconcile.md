---
okf_version: "0.2"
type: Function
title: reconcile
resource: tui/services/quota-provider-hub.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:services"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-17T13:34:37Z"
concept_id: tui/services/quota-provider-hub/reconcile
language: typescript
---

# reconcile

## Signature

```typescript
const reconcile = () =>: void
```

## Source
Lines 177–217 in `tui/services/quota-provider-hub.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [quota-provider-hub](/tui/services/quota-provider-hub.md) |
| calls | [providerSpecs](/tui/services/quota-provider-hub/providerSpecs.md) |
| calls | [dispose](/tui/services/quota-provider-hub/dispose.md) |
| calls | [some](/tui/quota/some.md) |
| calls | [notify](/tui/services/quota-provider-hub/notify.md) |
| called_by | [addDemand](/tui/services/quota-provider-hub/addDemand.md) |
| called_by | [createQuotaProviderHub](/tui/services/quota-provider-hub/createQuotaProviderHub.md) |
