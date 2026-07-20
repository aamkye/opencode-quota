---
okf_version: "0.2"
type: Function
title: cellWidth
description: Calculate cell width based on the specified mode.
resource: lib/tokens/markdown-table.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-01T14:05:42Z"
concept_id: lib/tokens/markdown-table/cellWidth
language: typescript
---

# cellWidth

Calculate cell width based on the specified mode.

## Signature

```typescript
function cellWidth(text: string, widthMode: WidthMode): number
```

## Docstring

Calculate cell width based on the specified mode.

## Source
Lines 78–83 in `lib/tokens/markdown-table.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [markdown-table](/lib/tokens/markdown-table.md) |
| calls | [measureWidth](/lib/tokens/markdown-table/measureWidth.md) |
| calls | [toVisualTextForWidth](/lib/tokens/markdown-table/toVisualTextForWidth.md) |
| called_by | [padCell](/lib/tokens/markdown-table/padCell.md) |
| called_by | [renderMarkdownTable](/lib/tokens/markdown-table/renderMarkdownTable.md) |
