---
okf_version: "0.2"
type: Function
title: providerSpecs
resource: tests/plugin-adapters.test.mjs
tags:
  - "lang:javascript"
  - "type:Function"
  - "module:tests"
  - "domain:plugin-adapters.test.mjs"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-20T01:15:53Z"
concept_id: tests/plugin-adapters/providerSpecs
language: javascript
---

# providerSpecs

## Signature

```javascript
function providerSpecs(demands)
```

## Source
Lines 95–127 in `tests/plugin-adapters.test.mjs`

## Relationships

| Type | Target |
|------|--------|
| related | [plugin-adapters.test](/tests/plugin-adapters.test.md) |
| calls | [filter](/tui/quota/filter.md) |
| calls | [normalizeQuotaDemand](/tests/plugin-adapters/normalizeQuotaDemand.md) |
| calls | [some](/tui/quota/some.md) |
| called_by | [createControlledHubMeta](/tests/plugin-adapters/createControlledHubMeta.md) |
| called_by | [createHub](/tests/plugin-adapters/createHub.md) |
| called_by | [reconcile](/tests/plugin-adapters/reconcile.md) |
