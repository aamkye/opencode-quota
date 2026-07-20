---
okf_version: "0.2"
type: Function
title: createSubagentPanelModel
resource: tui/features/subagent.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:features"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-20T01:15:53Z"
concept_id: tui/features/subagent/createSubagentPanelModel
language: typescript
---

# createSubagentPanelModel

## Signature

```typescript
function createSubagentPanelModel(
  snapshot: SubagentSnapshot,
  failureTimes: Readonly<Record<string, number>>,
  now: number,
): SubagentPanelModel
```

## Source
Lines 89–160 in `tui/features/subagent.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [subagent](/tui/features/subagent.md) |
| calls | [filter](/tui/quota/filter.md) |
| calls | [newestMessage](/tui/features/subagent/newestMessage.md) |
| calls | [finite](/tui/features/subagent/finite.md) |
| calls | [some](/tui/quota/some.md) |
| calls | [durationBetween](/tui/features/subagent/durationBetween.md) |
| calls | [identity](/tui/features/subagent/identity.md) |
| calls | [formatDuration](/tui/features/subagent/formatDuration.md) |
| called_by | [SubagentPanel](/tui/subagent/SubagentPanel.md) |
