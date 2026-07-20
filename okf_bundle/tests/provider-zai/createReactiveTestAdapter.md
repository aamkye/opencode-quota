---
okf_version: "0.2"
type: Function
title: createReactiveTestAdapter
resource: tests/provider-zai.test.mjs
tags:
  - "lang:javascript"
  - "type:Function"
  - "module:tests"
  - "domain:provider-zai.test.mjs"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-16T13:37:47Z"
concept_id: tests/provider-zai/createReactiveTestAdapter
language: javascript
---

# createReactiveTestAdapter

## Signature

```javascript
function createReactiveTestAdapter(t, {
  initialKey = "test-key",
  fetch: testFetch,
  clock,
  providerOptions,
} = {})
```

## Source
Lines 152–171 in `tests/provider-zai.test.mjs`

## Relationships

| Type | Target |
|------|--------|
| related | [provider-zai.test](/tests/provider-zai.test.md) |
| calls | [createReactiveZaiAdapter](/tests/provider-lifecycle/createReactiveZaiAdapter.md) |
| calls | [flushEffects](/tests/provider-zai/flushEffects.md) |
| calls | [restore](/tests/provider-zai/restore.md) |
