---
okf_version: "0.2"
type: Function
title: collectBodyItems
resource: tests/subagent-mounted.fixture.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tests"
  - "domain:subagent-mounted.fixture.ts"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-20T01:15:53Z"
concept_id: tests/subagent-mounted/collectBodyItems
language: typescript
---

# collectBodyItems

## Signature

```typescript
function collectBodyItems(node: HostNode, output: HostNode[] = []): HostNode[]
```

## Source
Lines 280–287 in `tests/subagent-mounted.fixture.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [subagent-mounted.fixture](/tests/subagent-mounted.fixture.md) |
| calls | [isDivider](/tests/subagent-mounted/isDivider.md) |
| calls | [isExplicitDivider](/tests/subagent-mounted/isExplicitDivider.md) |
| calls | [isRenderableRow](/tests/subagent-mounted/isRenderableRow.md) |
| called_by | [mountSubagentPanel](/tests/subagent-mounted/mountSubagentPanel.md) |
| called_by | [view](/tests/subagent-mounted/view.md) |
