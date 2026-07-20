---
okf_version: "0.2"
type: Function
title: deployPlugins
resource: deploy-plugins.mjs
tags:
  - "lang:javascript"
  - "type:Function"
  - "module:deploy-plugins.mjs"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-17T13:34:37Z"
concept_id: deploy-plugins/deployPlugins
language: javascript
---

# deployPlugins

## Signature

```javascript
function deployPlugins(targetRoot, { logLevel = "info", projectConfigRoot } = {})
```

## Source
Lines 161–213 in `deploy-plugins.mjs`

## Relationships

| Type | Target |
|------|--------|
| related | [deploy-plugins](/deploy-plugins.md) |
| calls | [validatePluginManifest](/plugin-manifest/validatePluginManifest.md) |
| calls | [buildPlugins](/build-plugins/buildPlugins.md) |
| calls | [all](/lib/tokens/opencode-sqlite/all.md) |
| calls | [copyBuiltArtifact](/deploy-plugins/copyBuiltArtifact.md) |
| calls | [readTuiConfig](/deploy-plugins/readTuiConfig.md) |
| calls | [cleanManagedEntries](/deploy-plugins/cleanManagedEntries.md) |
| calls | [resolve](/tests/plugin-build/resolve.md) |
| calls | [cleanManagedTokenCommands](/deploy-plugins/cleanManagedTokenCommands.md) |
| calls | [readOpenCodeConfig](/deploy-plugins/readOpenCodeConfig.md) |
| called_by | [main](/deploy-plugins/main.md) |
