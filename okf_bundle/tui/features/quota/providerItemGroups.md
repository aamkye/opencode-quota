---
okf_version: "0.2"
type: Function
title: providerItemGroups
resource: tui/features/quota.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:features"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-17T13:34:37Z"
concept_id: tui/features/quota/providerItemGroups
language: typescript
---

# providerItemGroups

## Signature

```typescript
function providerItemGroups(items: readonly PanelItem[]): { preamble: PanelItem[]; groups: ProviderItemGroup[] }
```

## Source
Lines 207–226 in `tui/features/quota.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [quota](/tui/features/quota.md) |
| calls | [sortByOrderThenId](/tui/presentation/types/sortByOrderThenId.md) |
| calls | [windowDuration](/tui/features/quota/windowDuration.md) |
| called_by | [orderedProviderItems](/tui/features/quota/orderedProviderItems.md) |
