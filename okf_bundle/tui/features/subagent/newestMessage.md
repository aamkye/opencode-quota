---
okf_version: "0.2"
type: Function
title: newestMessage
resource: tui/features/subagent.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:features"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-20T01:15:53Z"
concept_id: tui/features/subagent/newestMessage
language: typescript
---

# newestMessage

## Signature

```typescript
function newestMessage(messages: readonly Message[], role: Message["role"]): Message | undefined
```

## Source
Lines 42–54 in `tui/features/subagent.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [subagent](/tui/features/subagent.md) |
| calls | [finite](/tui/features/subagent/finite.md) |
| called_by | [createSubagentPanelModel](/tui/features/subagent/createSubagentPanelModel.md) |
