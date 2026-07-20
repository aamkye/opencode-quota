---
okf_version: "0.2"
type: Function
title: mountMcpPanel
resource: tests/mcp-mounted.fixture.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tests"
  - "domain:mcp-mounted.fixture.ts"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-17T13:34:37Z"
concept_id: tests/mcp-mounted/mountMcpPanel
language: typescript
---

# mountMcpPanel

## Signature

```typescript
function mountMcpPanel(options: {
  entries?: readonly McpEntry[]
  savedCollapsed?: boolean
} = {})
```

## Source
Lines 99–229 in `tests/mcp-mounted.fixture.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [mcp-mounted.fixture](/tests/mcp-mounted.fixture.md) |
| calls | [createLifecycle](/tests/mcp-mounted/createLifecycle.md) |
| calls | [set](/tests/mcp-mounted/set.md) |
| calls | [get](/tests/mcp-mounted/get.md) |
| calls | [tui](/tui/runtime/plugin/tui.md) |
| calls | [mount](/tests/mcp-mounted/mount.md) |
| calls | [expand](/tests/mcp-mounted/expand.md) |
| calls | [nodes](/tests/mcp-mounted/nodes.md) |
| calls | [find](/tui/quota/find.md) |
| calls | [descendantsOf](/tests/mcp-mounted/descendantsOf.md) |
| calls | [textOf](/tests/mcp-mounted/textOf.md) |
| calls | [filter](/tui/quota/filter.md) |
| calls | [truncate](/tests/mcp-mounted/truncate.md) |
| calls | [disposeRoot](/tests/mcp-mounted/disposeRoot.md) |
| calls | [dispose](/tests/mcp-mounted/dispose.md) |
