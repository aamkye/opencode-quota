---
okf_version: "0.2"
type: Function
title: flushMicrotasks
resource: tests/provider-opencode-go.test.mjs
tags:
  - "lang:javascript"
  - "type:Function"
  - "module:tests"
  - "domain:provider-opencode-go.test.mjs"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-16T13:37:47Z"
concept_id: tests/provider-opencode-go/flushMicrotasks
language: javascript
---

# flushMicrotasks

## Signature

```javascript
const flushMicrotasks = () =>
```

## Source
Lines 101–104 in `tests/provider-opencode-go.test.mjs`

## Relationships

| Type | Target |
|------|--------|
| related | [provider-opencode-go.test](/tests/provider-opencode-go.test.md) |
| calls | [resolve](/tests/plugin-build/resolve.md) |
| called_by | [cleanupLifecycle](/tests/provider-opencode-go/cleanupLifecycle.md) |
