---
okf_version: "0.2"
type: Function
title: renderCommandHeading
resource: lib/tokens/format-utils.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-01T14:08:00Z"
concept_id: lib/tokens/format-utils/renderCommandHeading
language: typescript
---

# renderCommandHeading

## Signature

```typescript
function renderCommandHeading(params: { title: string; generatedAtMs?: number }): string
```

## Source
Lines 76–78 in `lib/tokens/format-utils.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [format-utils](/lib/tokens/format-utils.md) |
| calls | [formatLocalCallTimestamp](/lib/tokens/format-utils/formatLocalCallTimestamp.md) |
| called_by | [renderMarkdownReport](/lib/tokens/report-document/renderMarkdownReport.md) |
| called_by | [renderPlainTextReport](/lib/tokens/report-document/renderPlainTextReport.md) |
| called_by | [renderTokenReport](/lib/tokens/token-report-presenter/renderTokenReport.md) |
