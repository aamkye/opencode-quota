---
okf_version: "0.2"
type: Function
title: scanScriptBodies
resource: tui/providers/opencode-go.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:providers"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-16T13:37:47Z"
concept_id: tui/providers/opencode-go/scanScriptBodies
language: typescript
---

# scanScriptBodies

## Signature

```typescript
function scanScriptBodies(html: string): string[] | null
```

## Source
Lines 181–226 in `tui/providers/opencode-go.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [opencode-go](/tui/providers/opencode-go.md) |
| calls | [scanMarkupEnd](/tui/providers/opencode-go/scanMarkupEnd.md) |
| calls | [readDataTag](/tui/providers/opencode-go/readDataTag.md) |
| calls | [scanRawElement](/tui/providers/opencode-go/scanRawElement.md) |
| called_by | [parseOpenCodeGoHydration](/tui/providers/opencode-go/parseOpenCodeGoHydration.md) |
