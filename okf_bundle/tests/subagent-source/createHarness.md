---
okf_version: "0.2"
type: Function
title: createHarness
resource: tests/subagent-source.test.mjs
tags:
  - "lang:javascript"
  - "type:Function"
  - "module:tests"
  - "domain:subagent-source.test.mjs"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-20T01:15:53Z"
concept_id: tests/subagent-source/createHarness
language: javascript
---

# createHarness

## Signature

```javascript
function createHarness(loadSnapshot, { failures = {}, now = () => 1_000 } = {})
```

## Source
Lines 86–135 in `tests/subagent-source.test.mjs`

## Relationships

| Type | Target |
|------|--------|
| related | [subagent-source.test](/tests/subagent-source.test.md) |
| calls | [createScheduler](/tests/subagent-source/createScheduler.md) |
| calls | [cloneFailures](/tests/subagent-source/cloneFailures.md) |
| calls | [createSubagentSource](/tui/services/subagent-source/createSubagentSource.md) |
