---
okf_version: "0.2"
type: Function
title: message
resource: tests/subagent-mounted.fixture.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tests"
  - "domain:subagent-mounted.fixture.ts"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-20T01:15:53Z"
concept_id: tests/subagent-mounted/message
language: typescript
---

# message

## Signature

```typescript
function message(
  sessionID: string,
  status: "successful" | "running" | "failed",
  created: number,
  durationMs: number,
  agent = "general",
  modelID = "gpt-4o-mini",
)
```

## Source
Lines 38–62 in `tests/subagent-mounted.fixture.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [subagent-mounted.fixture](/tests/subagent-mounted.fixture.md) |
| called_by | [child](/tests/subagent-mounted/child.md) |
