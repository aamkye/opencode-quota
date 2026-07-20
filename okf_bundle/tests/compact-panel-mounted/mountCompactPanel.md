---
okf_version: "0.2"
type: Function
title: mountCompactPanel
resource: tests/compact-panel-mounted.fixture.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tests"
  - "domain:compact-panel-mounted.fixture.ts"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-19T13:51:24Z"
concept_id: tests/compact-panel-mounted/mountCompactPanel
language: typescript
---

# mountCompactPanel

## Signature

```typescript
function mountCompactPanel(options: {
  collapsed?: boolean
  detail?: CompactPanelSummary
  summary?: CompactPanelSummary
  footerDivider?: boolean
} = {})
```

## Source
Lines 136–186 in `tests/compact-panel-mounted.fixture.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [compact-panel-mounted.fixture](/tests/compact-panel-mounted.fixture.md) |
| calls | [CompactPanel](/tui/presentation/compact-panel/CompactPanel.md) |
| calls | [filter](/tui/quota/filter.md) |
| calls | [expand](/tests/compact-panel-mounted/expand.md) |
| calls | [render](/tests/compact-panel-mounted/render.md) |
| calls | [dispose](/tests/compact-panel-mounted/dispose.md) |
