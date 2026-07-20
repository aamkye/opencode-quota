---
okf_version: "0.2"
type: Function
title: renderMarkdownBlock
resource: lib/tokens/report-document.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-01T14:05:42Z"
concept_id: lib/tokens/report-document/renderMarkdownBlock
language: typescript
---

# renderMarkdownBlock

## Signature

```typescript
function renderMarkdownBlock(block: ReportBlock): string[]
```

## Source
Lines 79–95 in `lib/tokens/report-document.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [report-document](/lib/tokens/report-document.md) |
| calls | [renderMarkdownTable](/lib/tokens/markdown-table/renderMarkdownTable.md) |
| called_by | [renderMarkdownReport](/lib/tokens/report-document/renderMarkdownReport.md) |
