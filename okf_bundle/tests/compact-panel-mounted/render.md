---
okf_version: "0.2"
type: Function
title: render
resource: tests/compact-panel-mounted.fixture.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tests"
  - "domain:compact-panel-mounted.fixture.ts"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-19T13:51:24Z"
concept_id: tests/compact-panel-mounted/render
language: typescript
---

# render

## Signature

```typescript
const render = () =>
```

## Source
Lines 149–163 in `tests/compact-panel-mounted.fixture.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [compact-panel-mounted.fixture](/tests/compact-panel-mounted.fixture.md) |
| calls | [CompactPanel](/tui/presentation/compact-panel/CompactPanel.md) |
| calls | [filter](/tui/quota/filter.md) |
| calls | [expand](/tests/compact-panel-mounted/expand.md) |
| called_by | [expand](/tests/compact-panel-mounted/expand.md) |
| called_by | [mountCompactPanel](/tests/compact-panel-mounted/mountCompactPanel.md) |
| called_by | [mountReactiveCompactPanel](/tests/compact-panel-mounted/mountReactiveCompactPanel.md) |
| called_by | [rerender](/tests/compact-panel-mounted/rerender.md) |
