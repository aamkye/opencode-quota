---
okf_version: "0.2"
type: Function
title: scanJavaScriptBody
resource: tui/providers/opencode-go.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:providers"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-16T13:37:47Z"
concept_id: tui/providers/opencode-go/scanJavaScriptBody
language: typescript
---

# scanJavaScriptBody

## Signature

```typescript
function scanJavaScriptBody(body: string): ScriptScan | null
```

## Source
Lines 278–385 in `tui/providers/opencode-go.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [opencode-go](/tui/providers/opencode-go.md) |
| calls | [newScriptScan](/tui/providers/opencode-go/newScriptScan.md) |
| calls | [hasMarkerCandidate](/tui/providers/opencode-go/hasMarkerCandidate.md) |
| calls | [readExactMarker](/tui/providers/opencode-go/readExactMarker.md) |
| calls | [captureExactRecord](/tui/providers/opencode-go/captureExactRecord.md) |
| called_by | [parseOpenCodeGoHydration](/tui/providers/opencode-go/parseOpenCodeGoHydration.md) |
