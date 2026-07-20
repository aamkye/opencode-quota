---
okf_version: "0.2"
type: Function
title: parseOpenCodeGoHydration
resource: tui/providers/opencode-go.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:providers"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-16T13:37:47Z"
concept_id: tui/providers/opencode-go/parseOpenCodeGoHydration
language: typescript
---

# parseOpenCodeGoHydration

## Signature

```typescript
function parseOpenCodeGoHydration(html: string, receivedAt: number): OpenCodeGoQuotaData | null
```

## Source
Lines 387–422 in `tui/providers/opencode-go.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [opencode-go](/tui/providers/opencode-go.md) |
| calls | [scanScriptBodies](/tui/providers/opencode-go/scanScriptBodies.md) |
| calls | [newScriptScan](/tui/providers/opencode-go/newScriptScan.md) |
| calls | [scanJavaScriptBody](/tui/providers/opencode-go/scanJavaScriptBody.md) |
| called_by | [fetchOpenCodeGoQuota](/tui/providers/opencode-go/fetchOpenCodeGoQuota.md) |
