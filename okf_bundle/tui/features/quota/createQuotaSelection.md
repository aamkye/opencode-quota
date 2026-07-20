---
okf_version: "0.2"
type: Function
title: createQuotaSelection
resource: tui/features/quota.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:features"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-17T13:34:37Z"
concept_id: tui/features/quota/createQuotaSelection
language: typescript
---

# createQuotaSelection

## Signature

```typescript
function createQuotaSelection(
  api: TuiPluginApi,
  providers: readonly QuotaProviderAdapter[],
): { selectedProviderID: Accessor<QuotaSelection>; setSessionID(sessionID: string): void }
```

## Source
Lines 425–491 in `tui/features/quota.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [quota](/tui/features/quota.md) |
| calls | [sessionID](/tui/ses-tokens/sessionID.md) |
| calls | [selectedQuotaProviderID](/tui/features/quota/selectedQuotaProviderID.md) |
| calls | [selectedSessionQuotaProviderID](/tui/features/quota/selectedSessionQuotaProviderID.md) |
| calls | [find](/tui/quota/find.md) |
| calls | [dispose](/tui/features/quota/dispose.md) |
| called_by | [mountQuotaSelection](/tests/quota-selection/mountQuotaSelection.md) |
