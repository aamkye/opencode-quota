---
okf_version: "0.2"
type: Function
title: readDataTag
resource: tui/providers/opencode-go.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:providers"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-16T13:37:47Z"
concept_id: tui/providers/opencode-go/readDataTag
language: typescript
---

# readDataTag

## Signature

```typescript
function readDataTag(html: string, start: number): HtmlTag | typeof NOT_A_TAG | null
```

## Source
Lines 115–153 in `tui/providers/opencode-go.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [opencode-go](/tui/providers/opencode-go.md) |
| calls | [isAsciiAlpha](/tui/providers/opencode-go/isAsciiAlpha.md) |
| calls | [isTagNameChar](/tui/providers/opencode-go/isTagNameChar.md) |
| calls | [isHtmlSpace](/tui/providers/opencode-go/isHtmlSpace.md) |
| called_by | [scanScriptBodies](/tui/providers/opencode-go/scanScriptBodies.md) |
