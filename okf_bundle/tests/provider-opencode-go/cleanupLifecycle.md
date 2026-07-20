---
okf_version: "0.2"
type: Function
title: cleanupLifecycle
resource: tests/provider-opencode-go.test.mjs
tags:
  - "lang:javascript"
  - "type:Function"
  - "module:tests"
  - "domain:provider-opencode-go.test.mjs"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-16T13:37:47Z"
concept_id: tests/provider-opencode-go/cleanupLifecycle
language: javascript
---

# cleanupLifecycle

## Signature

```javascript
function cleanupLifecycle(t, clock, adapter, pending = [])
```

## Source
Lines 106–115 in `tests/provider-opencode-go.test.mjs`

## Relationships

| Type | Target |
|------|--------|
| related | [provider-opencode-go.test](/tests/provider-opencode-go.test.md) |
| calls | [resolve](/tests/plugin-build/resolve.md) |
| calls | [response](/tests/provider-opencode-go/response.md) |
| calls | [flushMicrotasks](/tests/provider-opencode-go/flushMicrotasks.md) |
| calls | [activeTimers](/tests/provider-opencode-go/activeTimers.md) |
| calls | [restore](/tests/provider-opencode-go/restore.md) |
