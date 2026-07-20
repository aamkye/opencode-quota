---
okf_version: "0.2"
type: Function
title: selectedQuotaProviderID
resource: tui/features/quota.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:features"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-17T13:34:37Z"
concept_id: tui/features/quota/selectedQuotaProviderID
language: typescript
---

# selectedQuotaProviderID

## Signature

```typescript
function selectedQuotaProviderID(
  providerState: readonly { id: string }[],
  providers: readonly QuotaProviderAdapter[],
): QuotaSelection
```

## Source
Lines 396–405 in `tui/features/quota.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [quota](/tui/features/quota.md) |
| calls | [resolveSupportedProvider](/tui/features/quota/resolveSupportedProvider.md) |
| called_by | [createQuotaSelection](/tui/features/quota/createQuotaSelection.md) |
