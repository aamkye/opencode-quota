---
okf_version: "0.2"
type: Function
title: currentPanel
resource: tests/subagent-mounted.fixture.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tests"
  - "domain:subagent-mounted.fixture.ts"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-20T01:15:53Z"
concept_id: tests/subagent-mounted/currentPanel
language: typescript
---

# currentPanel

## Signature

```typescript
function currentPanel(): HostNode | undefined
```

## Source
Lines 458–461 in `tests/subagent-mounted.fixture.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [subagent-mounted.fixture](/tests/subagent-mounted.fixture.md) |
| calls | [find](/tui/quota/find.md) |
| calls | [textNodes](/tests/subagent-mounted/textNodes.md) |
| calls | [textOf](/tests/subagent-mounted/textOf.md) |
| called_by | [mountSubagentPanel](/tests/subagent-mounted/mountSubagentPanel.md) |
| called_by | [trackPanelLifecycle](/tests/subagent-mounted/trackPanelLifecycle.md) |
| called_by | [view](/tests/subagent-mounted/view.md) |
