---
okf_version: "0.2"
type: Function
title: createReactiveTestAdapter
resource: tests/provider-openai.test.mjs
tags:
  - "lang:javascript"
  - "type:Function"
  - "module:tests"
  - "domain:provider-openai.test.mjs"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-16T13:37:47Z"
concept_id: tests/provider-openai/createReactiveTestAdapter
language: javascript
---

# createReactiveTestAdapter

## Signature

```javascript
function createReactiveTestAdapter(t, {
  initialKey = "test-token",
  fetch: testFetch,
  clock,
  providerOptions,
} = {})
```

## Source
Lines 103–122 in `tests/provider-openai.test.mjs`

## Relationships

| Type | Target |
|------|--------|
| related | [provider-openai.test](/tests/provider-openai.test.md) |
| calls | [createReactiveOpenAiAdapter](/tests/provider-lifecycle/createReactiveOpenAiAdapter.md) |
| calls | [flushEffects](/tests/provider-openai/flushEffects.md) |
| calls | [restore](/tests/provider-openai/restore.md) |
