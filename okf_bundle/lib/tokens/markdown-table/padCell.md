---
okf_version: "0.2"
type: Function
title: padCell
resource: lib/tokens/markdown-table.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-01T14:05:42Z"
concept_id: lib/tokens/markdown-table/padCell
language: typescript
---

# padCell

## Signature

```typescript
function padCell(text: string, width: number, align: Align, widthMode: WidthMode): string
```

## Source
Lines 85–97 in `lib/tokens/markdown-table.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [markdown-table](/lib/tokens/markdown-table.md) |
| calls | [cellWidth](/lib/tokens/markdown-table/cellWidth.md) |
| called_by | [fmtRow](/lib/tokens/markdown-table/fmtRow.md) |
| called_by | [renderMarkdownTable](/lib/tokens/markdown-table/renderMarkdownTable.md) |
