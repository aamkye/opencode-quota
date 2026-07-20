---
okf_version: "0.2"
type: Function
title: fetchOpenCodeGoQuota
resource: tui/providers/opencode-go.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:providers"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-16T13:37:47Z"
concept_id: tui/providers/opencode-go/fetchOpenCodeGoQuota
language: typescript
---

# fetchOpenCodeGoQuota

## Signature

```typescript
function fetchOpenCodeGoQuota(
  config: OpenCodeGoConfig,
  signal: AbortSignal,
  dependencies: OpenCodeGoFetchDependencies,
): Promise<OpenCodeGoFetchResult>
```

## Source
Lines 424–471 in `tui/providers/opencode-go.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [opencode-go](/tui/providers/opencode-go.md) |
| calls | [parseOpenCodeGoHydration](/tui/providers/opencode-go/parseOpenCodeGoHydration.md) |
| called_by | [transportWith](/tests/provider-opencode-go/transportWith.md) |
| called_by | [createOpenCodeGoProvider](/tui/providers/opencode-go/createOpenCodeGoProvider.md) |
| called_by | [refresh](/tui/providers/opencode-go/refresh.md) |
