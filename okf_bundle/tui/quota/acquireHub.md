---
okf_version: "0.2"
type: Function
title: acquireHub
resource: tui/quota.tsx
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:quota.tsx"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-17T13:34:37Z"
concept_id: tui/quota/acquireHub
language: typescript
---

# acquireHub

## Signature

```typescript
function acquireHub(
  context: TuiFeatureContext,
  api: TuiPluginApi,
  demand: QuotaProviderDemand,
  meta: unknown,
): ServiceLease<QuotaProviderHub>
```

## Source
Lines 24–37 in `tui/quota.tsx`

## Relationships

| Type | Target |
|------|--------|
| related | [quota](/tui/quota.md) |
