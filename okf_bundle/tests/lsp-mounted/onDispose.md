---
okf_version: "0.2"
type: Function
title: onDispose
resource: tests/lsp-mounted.fixture.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tests"
  - "domain:lsp-mounted.fixture.ts"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-17T16:09:27Z"
concept_id: tests/lsp-mounted/onDispose
language: typescript
---

# onDispose

## Signature

```typescript
onDispose(cleanup: () => void | Promise<void>)
```

## Source
Lines 173–176 in `tests/lsp-mounted.fixture.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [lsp-mounted.fixture](/tests/lsp-mounted.fixture.md) |
| calls | [filter](/tui/quota/filter.md) |
