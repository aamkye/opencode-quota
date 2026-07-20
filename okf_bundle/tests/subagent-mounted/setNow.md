---
okf_version: "0.2"
type: Function
title: setNow
resource: tests/subagent-mounted.fixture.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tests"
  - "domain:subagent-mounted.fixture.ts"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-20T01:15:53Z"
concept_id: tests/subagent-mounted/setNow
language: typescript
---

# setNow

## Signature

```typescript
setNow(value: number)
```

## Source
Lines 626–628 in `tests/subagent-mounted.fixture.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [subagent-mounted.fixture](/tests/subagent-mounted.fixture.md) |
| called_by | [PanelRenderer](/tui/presentation/renderer/PanelRenderer.md) |
| called_by | [createOpenAiProvider](/tui/providers/openai/createOpenAiProvider.md) |
| called_by | [createOpenCodeGoProvider](/tui/providers/opencode-go/createOpenCodeGoProvider.md) |
| called_by | [createZaiProvider](/tui/providers/zai/createZaiProvider.md) |
| called_by | [SubagentPanel](/tui/subagent/SubagentPanel.md) |
