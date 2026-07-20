---
okf_version: "0.2"
type: Function
title: readRawEnd
resource: tui/providers/opencode-go.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:providers"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-16T13:37:47Z"
concept_id: tui/providers/opencode-go/readRawEnd
language: typescript
---

# readRawEnd

## Signature

```typescript
function readRawEnd(html: string, start: number, name: string): number | null | undefined
```

## Source
Lines 155–164 in `tui/providers/opencode-go.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [opencode-go](/tui/providers/opencode-go.md) |
| calls | [startsWithAsciiCaseInsensitive](/tui/providers/opencode-go/startsWithAsciiCaseInsensitive.md) |
| calls | [isHtmlSpace](/tui/providers/opencode-go/isHtmlSpace.md) |
| called_by | [scanRawElement](/tui/providers/opencode-go/scanRawElement.md) |
