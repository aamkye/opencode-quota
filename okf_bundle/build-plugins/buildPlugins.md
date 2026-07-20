---
okf_version: "0.2"
type: Function
title: buildPlugins
resource: build-plugins.mjs
tags:
  - "lang:javascript"
  - "type:Function"
  - "module:build-plugins.mjs"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-17T13:34:37Z"
concept_id: build-plugins/buildPlugins
language: javascript
---

# buildPlugins

## Signature

```javascript
function buildPlugins({ logLevel = "info", manifest = pluginManifest } = {})
```

## Source
Lines 86–111 in `build-plugins.mjs`

## Relationships

| Type | Target |
|------|--------|
| related | [build-plugins](/build-plugins.md) |
| calls | [validatePluginManifest](/plugin-manifest/validatePluginManifest.md) |
| calls | [resolve](/tests/plugin-build/resolve.md) |
| calls | [solidTransformPlugin](/build-plugins/solidTransformPlugin.md) |
| calls | [hostRuntimeImports](/build-plugins/hostRuntimeImports.md) |
| calls | [sharedImport](/build-plugins/sharedImport.md) |
| called_by | [deployPlugins](/deploy-plugins/deployPlugins.md) |
