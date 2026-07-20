---
okf_version: "0.2"
type: Function
title: createTuiApi
resource: tests/token-tui.test.mjs
tags:
  - "lang:javascript"
  - "type:Function"
  - "module:tests"
  - "domain:token-tui.test.mjs"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-17T13:34:37Z"
concept_id: tests/token-tui/createTuiApi
language: javascript
---

# createTuiApi

## Signature

```javascript
function createTuiApi({ route = { name: "home" }, prompt } = {})
```

## Source
Lines 19–92 in `tests/token-tui.test.mjs`

## Relationships

| Type | Target |
|------|--------|
| related | [token-tui.test](/tests/token-tui.test.md) |
| calls | [push](/tests/token-tui/push.md) |
| calls | [prompt](/tests/token-tui/prompt.md) |
| calls | [find](/tui/quota/find.md) |
