---
okf_version: "0.2"
type: Function
title: createApi
resource: tests/plugin-adapters.test.mjs
tags:
  - "lang:javascript"
  - "type:Function"
  - "module:tests"
  - "domain:plugin-adapters.test.mjs"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-20T01:15:53Z"
concept_id: tests/plugin-adapters/createApi
language: javascript
---

# createApi

## Signature

```javascript
function createApi({ route = { name: "home" } } = {})
```

## Source
Lines 292–408 in `tests/plugin-adapters.test.mjs`

## Relationships

| Type | Target |
|------|--------|
| related | [plugin-adapters.test](/tests/plugin-adapters.test.md) |
| calls | [createLifecycle](/tests/plugin-adapters/createLifecycle.md) |
| calls | [push](/tests/plugin-adapters/push.md) |
| calls | [filter](/tui/quota/filter.md) |
| calls | [get](/tests/plugin-adapters/get.md) |
| calls | [set](/tests/plugin-adapters/set.md) |
