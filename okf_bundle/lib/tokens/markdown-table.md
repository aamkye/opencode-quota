---
okf_version: "0.2"
type: Module
title: markdown-table
description: "Width measurement mode:"
resource: lib/tokens/markdown-table.ts
tags:
  - "lang:typescript"
  - "type:Module"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-01T14:05:42Z"
concept_id: lib/tokens/markdown-table
language: typescript
---

# markdown-table

Width measurement mode:

## Docstring

Width measurement mode:
- "raw": Use string length (grapheme count)
- "markdown-conceal": Strip markdown syntax for width calculation (for TUI concealment mode)

## Relationships

| Type | Target |
|------|--------|
| related | [Align](/lib/tokens/markdown-table/Align.md) |
| related | [WidthMode](/lib/tokens/markdown-table/WidthMode.md) |
| related | [measureWidth](/lib/tokens/markdown-table/measureWidth.md) |
| related | [toVisualTextForWidth](/lib/tokens/markdown-table/toVisualTextForWidth.md) |
| related | [cellWidth](/lib/tokens/markdown-table/cellWidth.md) |
| related | [padCell](/lib/tokens/markdown-table/padCell.md) |
| related | [escapeCell](/lib/tokens/markdown-table/escapeCell.md) |
| related | [renderMarkdownTable](/lib/tokens/markdown-table/renderMarkdownTable.md) |
| related | [fmtRow](/lib/tokens/markdown-table/fmtRow.md) |
