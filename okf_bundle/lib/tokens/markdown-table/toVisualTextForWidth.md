---
okf_version: "0.2"
type: Function
title: toVisualTextForWidth
description: Convert markdown text to visual representation for width calculation.
resource: lib/tokens/markdown-table.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-01T14:05:42Z"
concept_id: lib/tokens/markdown-table/toVisualTextForWidth
language: typescript
---

# toVisualTextForWidth

Convert markdown text to visual representation for width calculation.

## Signature

```typescript
function toVisualTextForWidth(text: string): string
```

## Docstring

Convert markdown text to visual representation for width calculation.
Strips markdown syntax that is hidden in concealment mode.

## Source
Lines 37–73 in `lib/tokens/markdown-table.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [markdown-table](/lib/tokens/markdown-table.md) |
| called_by | [cellWidth](/lib/tokens/markdown-table/cellWidth.md) |
