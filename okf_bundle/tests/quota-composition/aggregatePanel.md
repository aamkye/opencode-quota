---
okf_version: "0.2"
type: Function
title: aggregatePanel
resource: tests/quota-composition.test.mjs
tags:
  - "lang:javascript"
  - "type:Function"
  - "module:tests"
  - "domain:quota-composition.test.mjs"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-20T01:15:53Z"
concept_id: tests/quota-composition/aggregatePanel
language: javascript
---

# aggregatePanel

## Signature

```javascript
function aggregatePanel(t, options, observations = { intervals: [], requests: [] })
```

## Source
Lines 445–450 in `tests/quota-composition.test.mjs`

## Relationships

| Type | Target |
|------|--------|
| related | [quota-composition.test](/tests/quota-composition.test.md) |
| calls | [activateQuotaPlugin](/tests/quota-composition/activateQuotaPlugin.md) |
| calls | [flushEffects](/tests/quota-composition/flushEffects.md) |
