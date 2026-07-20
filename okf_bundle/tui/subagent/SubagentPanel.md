---
okf_version: "0.2"
type: Function
title: SubagentPanel
resource: tui/subagent.tsx
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:subagent.tsx"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-20T01:15:53Z"
concept_id: tui/subagent/SubagentPanel
language: typescript
---

# SubagentPanel

## Signature

```typescript
function SubagentPanel(props: { panelState: Extract<SubagentSourceState, { phase: "ready" | "stale" }> })
```

## Source
Lines 230–356 in `tui/subagent.tsx`

## Relationships

| Type | Target |
|------|--------|
| related | [subagent](/tui/subagent.md) |
| calls | [createSubagentPanelModel](/tui/features/subagent/createSubagentPanelModel.md) |
| calls | [clearInterval](/tests/subagent-mounted/clearInterval.md) |
| calls | [stopClock](/tui/subagent/stopClock.md) |
| calls | [some](/tui/quota/some.md) |
| calls | [setNow](/tests/subagent-mounted/setNow.md) |
| calls | [setInterval](/tests/subagent-mounted/setInterval.md) |
| calls | [summaryText](/tui/subagent/summaryText.md) |
| calls | [toggleEntry](/tui/subagent/toggleEntry.md) |
