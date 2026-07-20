---
okf_version: "0.2"
type: Function
title: child
resource: tests/subagent-mounted.fixture.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tests"
  - "domain:subagent-mounted.fixture.ts"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-20T01:15:53Z"
concept_id: tests/subagent-mounted/child
language: typescript
---

# child

## Signature

```typescript
function child(
  number: number,
  title: string,
  durationMs: number,
  status: "successful" | "running" | "failed",
): Child
```

## Source
Lines 64–83 in `tests/subagent-mounted.fixture.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [subagent-mounted.fixture](/tests/subagent-mounted.fixture.md) |
| calls | [message](/tests/subagent-mounted/message.md) |
