---
okf_version: "0.2"
type: Function
title: createTestAdapter
resource: tests/provider-openai.test.mjs
tags:
  - "lang:javascript"
  - "type:Function"
  - "module:tests"
  - "domain:provider-openai.test.mjs"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-16T13:37:47Z"
concept_id: tests/provider-openai/createTestAdapter
language: javascript
---

# createTestAdapter

## Signature

```javascript
function createTestAdapter(t, { api = adapterApi(), fetch: testFetch, clock, providerOptions } = {})
```

## Source
Lines 87–101 in `tests/provider-openai.test.mjs`

## Relationships

| Type | Target |
|------|--------|
| related | [provider-openai.test](/tests/provider-openai.test.md) |
| calls | [adapterApi](/tests/provider-openai/adapterApi.md) |
| calls | [flushEffects](/tests/provider-openai/flushEffects.md) |
| calls | [restore](/tests/provider-openai/restore.md) |
