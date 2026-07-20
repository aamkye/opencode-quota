---
okf_version: "0.2"
type: Function
title: expand
resource: tests/lsp-mounted.fixture.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tests"
  - "domain:lsp-mounted.fixture.ts"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-17T16:09:27Z"
concept_id: tests/lsp-mounted/expand
language: typescript
---

# expand

## Signature

```typescript
function expand(value: unknown, parent?: MountedNode): MountedNode[]
```

## Source
Lines 58–79 in `tests/lsp-mounted.fixture.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [lsp-mounted.fixture](/tests/lsp-mounted.fixture.md) |
| calls | [isElement](/tests/lsp-mounted/isElement.md) |
| called_by | [readLspView](/tests/lsp-mounted/readLspView.md) |
