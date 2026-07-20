---
okf_version: "0.2"
type: Function
title: onDispose
resource: tests/mcp-mounted.fixture.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tests"
  - "domain:mcp-mounted.fixture.ts"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-17T13:34:37Z"
concept_id: tests/mcp-mounted/onDispose
language: typescript
---

# onDispose

## Signature

```typescript
onDispose(cleanup: () => void | Promise<void>)
```

## Source
Lines 83–88 in `tests/mcp-mounted.fixture.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [mcp-mounted.fixture](/tests/mcp-mounted.fixture.md) |
| calls | [filter](/tui/quota/filter.md) |
