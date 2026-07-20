---
okf_version: "0.2"
type: Function
title: createQuotaSelectionHost
resource: tests/quota-selection.fixture.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tests"
  - "domain:quota-selection.fixture.ts"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-16T10:01:15Z"
concept_id: tests/quota-selection/createQuotaSelectionHost
language: typescript
---

# createQuotaSelectionHost

## Signature

```typescript
function createQuotaSelectionHost(input: {
  provider: readonly HostProvider[]
  messages: Record<string, readonly HostMessage[]>
  disposeRegistrationError?: Error
})
```

## Source
Lines 33–124 in `tests/quota-selection.fixture.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [quota-selection.fixture](/tests/quota-selection.fixture.md) |
| calls | [filter](/tui/quota/filter.md) |
