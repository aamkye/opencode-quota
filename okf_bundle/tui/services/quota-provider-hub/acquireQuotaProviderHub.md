---
okf_version: "0.2"
type: Function
title: acquireQuotaProviderHub
resource: tui/services/quota-provider-hub.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:services"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-17T13:34:37Z"
concept_id: tui/services/quota-provider-hub/acquireQuotaProviderHub
language: typescript
---

# acquireQuotaProviderHub

## Signature

```typescript
function acquireQuotaProviderHub(
  context: QuotaProviderHubContext,
  demand: QuotaProviderDemand,
): ServiceLease<QuotaProviderHub>
```

## Source
Lines 265–273 in `tui/services/quota-provider-hub.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [quota-provider-hub](/tui/services/quota-provider-hub.md) |
| calls | [createQuotaProviderHub](/tui/services/quota-provider-hub/createQuotaProviderHub.md) |
| calls | [addDemand](/tui/services/quota-provider-hub/addDemand.md) |
