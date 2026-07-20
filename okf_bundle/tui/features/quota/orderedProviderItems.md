---
okf_version: "0.2"
type: Function
title: orderedProviderItems
resource: tui/features/quota.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:features"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-17T13:34:37Z"
concept_id: tui/features/quota/orderedProviderItems
language: typescript
---

# orderedProviderItems

## Signature

```typescript
function orderedProviderItems(items: readonly PanelItem[], options: NormalizedCompositionOptions, orderOffset: number): PanelItem[]
```

## Source
Lines 228–246 in `tui/features/quota.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [quota](/tui/features/quota.md) |
| calls | [providerItemGroups](/tui/features/quota/providerItemGroups.md) |
| calls | [percentStatus](/tui/features/quota/percentStatus.md) |
| called_by | [composeQuotaPanel](/tui/features/quota/composeQuotaPanel.md) |
| called_by | [providerItems](/tui/features/quota/providerItems.md) |
