---
okf_version: "0.2"
type: Function
title: pluginDescriptor
resource: tui/runtime/manifest.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:runtime"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-20T01:15:53Z"
concept_id: tui/runtime/manifest/pluginDescriptor
language: typescript
---

# pluginDescriptor

## Signature

```typescript
function pluginDescriptor(key: PluginKey): PluginManifestEntry
```

## Source
Lines 15–19 in `tui/runtime/manifest.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [manifest](/tui/runtime/manifest.md) |
| calls | [find](/tui/quota/find.md) |
| called_by | [composeQuotaPanel](/tui/features/quota/composeQuotaPanel.md) |
