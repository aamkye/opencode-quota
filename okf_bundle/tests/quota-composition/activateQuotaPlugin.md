---
okf_version: "0.2"
type: Function
title: activateQuotaPlugin
resource: tests/quota-composition.test.mjs
tags:
  - "lang:javascript"
  - "type:Function"
  - "module:tests"
  - "domain:quota-composition.test.mjs"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-20T01:15:53Z"
concept_id: tests/quota-composition/activateQuotaPlugin
language: javascript
---

# activateQuotaPlugin

## Signature

```javascript
function activateQuotaPlugin(t, options, observations = { intervals: [], requests: [] })
```

## Source
Lines 337–443 in `tests/quota-composition.test.mjs`

## Relationships

| Type | Target |
|------|--------|
| related | [quota-composition.test](/tests/quota-composition.test.md) |
| calls | [find](/tui/quota/find.md) |
| calls | [flushEffects](/tests/quota-composition/flushEffects.md) |
| calls | [filter](/tui/quota/filter.md) |
| calls | [tui](/tui/runtime/plugin/tui.md) |
| called_by | [aggregatePanel](/tests/quota-composition/aggregatePanel.md) |
| called_by | [aggregateRegistration](/tests/quota-composition/aggregateRegistration.md) |
