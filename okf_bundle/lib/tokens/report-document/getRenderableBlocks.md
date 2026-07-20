---
okf_version: "0.2"
type: Function
title: getRenderableBlocks
resource: lib/tokens/report-document.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-01T14:05:42Z"
concept_id: lib/tokens/report-document/getRenderableBlocks
language: typescript
---

# getRenderableBlocks

## Signature

```typescript
function getRenderableBlocks(section: ReportSection): ReportBlock[]
```

## Source
Lines 49–51 in `lib/tokens/report-document.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [report-document](/lib/tokens/report-document.md) |
| calls | [filter](/tui/quota/filter.md) |
| called_by | [renderMarkdownReport](/lib/tokens/report-document/renderMarkdownReport.md) |
| called_by | [renderPlainTextReport](/lib/tokens/report-document/renderPlainTextReport.md) |
