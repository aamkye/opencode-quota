---
okf_version: "0.2"
type: Function
title: mountLspPanel
resource: tests/lsp-mounted.fixture.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tests"
  - "domain:lsp-mounted.fixture.ts"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-17T16:09:27Z"
concept_id: tests/lsp-mounted/mountLspPanel
language: typescript
---

# mountLspPanel

## Signature

```typescript
function mountLspPanel(options: LspFixtureOptions = {})
```

## Source
Lines 154–225 in `tests/lsp-mounted.fixture.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [lsp-mounted.fixture](/tests/lsp-mounted.fixture.md) |
| calls | [set](/tests/lsp-mounted/set.md) |
| calls | [filter](/tui/quota/filter.md) |
| calls | [get](/tests/lsp-mounted/get.md) |
| calls | [tui](/tui/runtime/plugin/tui.md) |
| calls | [mount](/tests/lsp-mounted/mount.md) |
| calls | [readLspView](/tests/lsp-mounted/readLspView.md) |
| calls | [disposeRoot](/tests/lsp-mounted/disposeRoot.md) |
| calls | [cleanup](/tui/runtime/plugin/cleanup.md) |
