---
okf_version: "0.2"
type: Function
title: createReactiveOpenAiAdapter
resource: tests/provider-lifecycle.fixture.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tests"
  - "domain:provider-lifecycle.fixture.ts"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-16T08:00:57Z"
concept_id: tests/provider-lifecycle/createReactiveOpenAiAdapter
language: typescript
---

# createReactiveOpenAiAdapter

## Signature

```typescript
function createReactiveOpenAiAdapter(
  initialKey: string | null,
  options: QuotaProviderOptions = {},
): ReactiveProvider
```

## Source
Lines 39–48 in `tests/provider-lifecycle.fixture.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [provider-lifecycle.fixture](/tests/provider-lifecycle.fixture.md) |
| calls | [reactiveProviderApi](/tests/provider-lifecycle/reactiveProviderApi.md) |
| called_by | [createReactiveTestAdapter](/tests/provider-openai/createReactiveTestAdapter.md) |
