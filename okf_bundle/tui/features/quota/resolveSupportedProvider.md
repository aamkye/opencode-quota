---
okf_version: "0.2"
type: Function
title: resolveSupportedProvider
resource: tui/features/quota.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:features"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-17T13:34:37Z"
concept_id: tui/features/quota/resolveSupportedProvider
language: typescript
---

# resolveSupportedProvider

## Signature

```typescript
function resolveSupportedProvider(
  providerID: string,
  providers: readonly QuotaProviderAdapter[],
): QuotaProviderAdapter | undefined
```

## Source
Lines 388–394 in `tui/features/quota.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [quota](/tui/features/quota.md) |
| calls | [find](/tui/quota/find.md) |
| called_by | [selectedQuotaProviderID](/tui/features/quota/selectedQuotaProviderID.md) |
| called_by | [selectedSessionQuotaProviderID](/tui/features/quota/selectedSessionQuotaProviderID.md) |
