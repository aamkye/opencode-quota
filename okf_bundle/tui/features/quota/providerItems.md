---
okf_version: "0.2"
type: Function
title: providerItems
resource: tui/features/quota.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:features"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-17T13:34:37Z"
concept_id: tui/features/quota/providerItems
language: typescript
---

# providerItems

## Signature

```typescript
function providerItems(provider: QuotaProviderAdapter, options: NormalizedCompositionOptions, orderOffset: number): PanelItem[]
```

## Source
Lines 248–254 in `tui/features/quota.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [quota](/tui/features/quota.md) |
| calls | [sortByOrderThenId](/tui/presentation/types/sortByOrderThenId.md) |
| calls | [orderedProviderItems](/tui/features/quota/orderedProviderItems.md) |
| called_by | [composeQuotaPanel](/tui/features/quota/composeQuotaPanel.md) |
