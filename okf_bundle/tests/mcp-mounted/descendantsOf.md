---
okf_version: "0.2"
type: Function
title: descendantsOf
resource: tests/mcp-mounted.fixture.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tests"
  - "domain:mcp-mounted.fixture.ts"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-17T13:34:37Z"
concept_id: tests/mcp-mounted/descendantsOf
language: typescript
---

# descendantsOf

## Signature

```typescript
function descendantsOf(nodes: readonly MountedNode[], parent: MountedNode): MountedNode[]
```

## Source
Lines 54–63 in `tests/mcp-mounted.fixture.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [mcp-mounted.fixture](/tests/mcp-mounted.fixture.md) |
| calls | [filter](/tui/quota/filter.md) |
| called_by | [mountMcpPanel](/tests/mcp-mounted/mountMcpPanel.md) |
| called_by | [view](/tests/mcp-mounted/view.md) |
