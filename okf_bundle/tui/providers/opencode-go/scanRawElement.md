---
okf_version: "0.2"
type: Function
title: scanRawElement
resource: tui/providers/opencode-go.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:providers"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-16T13:37:47Z"
concept_id: tui/providers/opencode-go/scanRawElement
language: typescript
---

# scanRawElement

## Signature

```typescript
function scanRawElement(html: string, start: number, name: string): { bodyEnd: number; end: number } | null
```

## Source
Lines 166–179 in `tui/providers/opencode-go.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [opencode-go](/tui/providers/opencode-go.md) |
| calls | [readRawEnd](/tui/providers/opencode-go/readRawEnd.md) |
| called_by | [scanScriptBodies](/tui/providers/opencode-go/scanScriptBodies.md) |
