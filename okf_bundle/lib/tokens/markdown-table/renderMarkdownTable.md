---
okf_version: "0.2"
type: Function
title: renderMarkdownTable
resource: lib/tokens/markdown-table.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-01T14:05:42Z"
concept_id: lib/tokens/markdown-table/renderMarkdownTable
language: typescript
---

# renderMarkdownTable

## Signature

```typescript
function renderMarkdownTable(params: {
  headers: string[];
  rows: string[][];
  aligns?: Align[];
  widthMode?: WidthMode;
}): string
```

## Source
Lines 104–146 in `lib/tokens/markdown-table.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [markdown-table](/lib/tokens/markdown-table.md) |
| calls | [escapeCell](/lib/tokens/markdown-table/escapeCell.md) |
| calls | [cellWidth](/lib/tokens/markdown-table/cellWidth.md) |
| calls | [padCell](/lib/tokens/markdown-table/padCell.md) |
| calls | [fmtRow](/lib/tokens/markdown-table/fmtRow.md) |
| called_by | [renderMarkdownBlock](/lib/tokens/report-document/renderMarkdownBlock.md) |
| called_by | [renderPlainTextBlock](/lib/tokens/report-document/renderPlainTextBlock.md) |
