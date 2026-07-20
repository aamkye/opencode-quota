---
okf_version: "0.2"
type: Function
title: summary
resource: tui/features/quota.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:features"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-17T13:34:37Z"
concept_id: tui/features/quota/summary
language: typescript
---

# summary

## Signature

```typescript
function summary(provider: QuotaProviderAdapter | undefined, options: NormalizedCompositionOptions)
```

## Source
Lines 271–298 in `tui/features/quota.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [quota](/tui/features/quota.md) |
| calls | [metric](/tui/features/quota/metric.md) |
| calls | [percentStatus](/tui/features/quota/percentStatus.md) |
| called_by | [composeQuotaPanel](/tui/features/quota/composeQuotaPanel.md) |
