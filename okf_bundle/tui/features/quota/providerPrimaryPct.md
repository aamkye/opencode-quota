---
okf_version: "0.2"
type: Function
title: providerPrimaryPct
resource: tui/features/quota.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:features"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-17T13:34:37Z"
concept_id: tui/features/quota/providerPrimaryPct
language: typescript
---

# providerPrimaryPct

## Signature

```typescript
function providerPrimaryPct(provider: QuotaProviderAdapter): number | null
```

## Source
Lines 256–265 in `tui/features/quota.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [quota](/tui/features/quota.md) |
| calls | [find](/tui/quota/find.md) |
| called_by | [composeQuotaPanel](/tui/features/quota/composeQuotaPanel.md) |
