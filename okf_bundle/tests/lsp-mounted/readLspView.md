---
okf_version: "0.2"
type: Function
title: readLspView
resource: tests/lsp-mounted.fixture.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tests"
  - "domain:lsp-mounted.fixture.ts"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-17T16:09:27Z"
concept_id: tests/lsp-mounted/readLspView
language: typescript
---

# readLspView

## Signature

```typescript
function readLspView(tree: unknown, width: number): LspView
```

## Source
Lines 103–152 in `tests/lsp-mounted.fixture.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [lsp-mounted.fixture](/tests/lsp-mounted.fixture.md) |
| calls | [expand](/tests/lsp-mounted/expand.md) |
| calls | [find](/tui/quota/find.md) |
| calls | [descendantsOf](/tests/lsp-mounted/descendantsOf.md) |
| calls | [textOf](/tests/lsp-mounted/textOf.md) |
| calls | [filter](/tui/quota/filter.md) |
| calls | [truncate](/tests/lsp-mounted/truncate.md) |
| called_by | [mountLspPanel](/tests/lsp-mounted/mountLspPanel.md) |
