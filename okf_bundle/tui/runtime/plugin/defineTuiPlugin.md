---
okf_version: "0.2"
type: Function
title: defineTuiPlugin
resource: tui/runtime/plugin.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:runtime"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-17T13:34:37Z"
concept_id: tui/runtime/plugin/defineTuiPlugin
language: typescript
---

# defineTuiPlugin

## Signature

```typescript
function defineTuiPlugin(
  descriptor: PluginManifestEntry,
  activate: FeatureActivation,
): TuiPluginModule & { id: string }
```

## Source
Lines 76–141 in `tui/runtime/plugin.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [plugin](/tui/runtime/plugin.md) |
| calls | [acquireService](/tui/runtime/plugin/acquireService.md) |
| calls | [activate](/tests/plugin-adapters/activate.md) |
| calls | [cleanup](/tui/runtime/plugin/cleanup.md) |
