---
okf_version: "0.2"
type: Function
title: openAiOptions
resource: tui/services/quota-provider-hub.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:services"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-17T13:34:37Z"
concept_id: tui/services/quota-provider-hub/openAiOptions
language: typescript
---

# openAiOptions

## Signature

```typescript
function openAiOptions(demand: QuotaProviderDemand): QuotaProviderOptions
```

## Source
Lines 72–77 in `tui/services/quota-provider-hub.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [quota-provider-hub](/tui/services/quota-provider-hub.md) |
| calls | [normalizeRefreshInterval](/tui/services/quota-provider-hub/normalizeRefreshInterval.md) |
| called_by | [providerSpecs](/tui/services/quota-provider-hub/providerSpecs.md) |
