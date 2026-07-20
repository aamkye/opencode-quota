---
okf_version: "0.2"
type: Function
title: managedConfigPath
resource: deploy-plugins.mjs
tags:
  - "lang:javascript"
  - "type:Function"
  - "module:deploy-plugins.mjs"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-17T13:34:37Z"
concept_id: deploy-plugins/managedConfigPath
language: javascript
---

# managedConfigPath

## Signature

```javascript
function managedConfigPath(spec, targetRoot)
```

## Source
Lines 71–74 in `deploy-plugins.mjs`

## Relationships

| Type | Target |
|------|--------|
| related | [deploy-plugins](/deploy-plugins.md) |
| calls | [specPath](/deploy-plugins/specPath.md) |
| calls | [find](/tui/quota/find.md) |
| calls | [resolve](/tests/plugin-build/resolve.md) |
| called_by | [isManagedSpec](/deploy-plugins/isManagedSpec.md) |
| called_by | [optionsPriority](/deploy-plugins/optionsPriority.md) |
