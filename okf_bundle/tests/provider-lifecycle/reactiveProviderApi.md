---
okf_version: "0.2"
type: Function
title: reactiveProviderApi
resource: tests/provider-lifecycle.fixture.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tests"
  - "domain:provider-lifecycle.fixture.ts"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-16T08:00:57Z"
concept_id: tests/provider-lifecycle/reactiveProviderApi
language: typescript
---

# reactiveProviderApi

## Signature

```typescript
function reactiveProviderApi(providerID: string, initialKey: string | null): {
  api: TuiPluginApi
  setCredential(key: string | null): void
}
```

## Source
Lines 13–37 in `tests/provider-lifecycle.fixture.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [provider-lifecycle.fixture](/tests/provider-lifecycle.fixture.md) |
| called_by | [createReactiveOpenAiAdapter](/tests/provider-lifecycle/createReactiveOpenAiAdapter.md) |
| called_by | [createReactiveZaiAdapter](/tests/provider-lifecycle/createReactiveZaiAdapter.md) |
