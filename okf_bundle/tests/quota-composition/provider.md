---
okf_version: "0.2"
type: Function
title: provider
resource: tests/quota-composition.test.mjs
tags:
  - "lang:javascript"
  - "type:Function"
  - "module:tests"
  - "domain:quota-composition.test.mjs"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-20T01:15:53Z"
concept_id: tests/quota-composition/provider
language: javascript
---

# provider

## Signature

```javascript
function provider({
  id,
  title,
  order,
  freshness = "ready",
  configured = true,
  primaryPct,
  secondaryPct,
  windows = ["5H", "7D"],
  groups,
  onRefresh = async () => {},
  onDispose = () => {},
})
```

## Source
Lines 43–81 in `tests/quota-composition.test.mjs`

## Relationships

| Type | Target |
|------|--------|
| related | [quota-composition.test](/tests/quota-composition.test.md) |
| called_by | [openCodeGoProvider](/tests/quota-composition/openCodeGoProvider.md) |
