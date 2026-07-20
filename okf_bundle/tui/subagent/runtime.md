---
okf_version: "0.2"
type: Function
title: runtime
resource: tui/subagent.tsx
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:subagent.tsx"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-20T01:15:53Z"
concept_id: tui/subagent/runtime
language: typescript
---

# runtime

## Signature

```typescript
function runtime(meta: unknown): SubagentRuntime
```

## Source
Lines 40–61 in `tui/subagent.tsx`

## Relationships

| Type | Target |
|------|--------|
| related | [subagent](/tui/subagent.md) |
| calls | [createSubagentSource](/tui/services/subagent-source/createSubagentSource.md) |
| calls | [setInterval](/tests/subagent-mounted/setInterval.md) |
| calls | [clearInterval](/tests/subagent-mounted/clearInterval.md) |
