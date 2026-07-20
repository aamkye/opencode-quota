---
okf_version: "0.2"
type: Function
title: mountPanel
resource: tests/presentation-mounted.fixture.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tests"
  - "domain:presentation-mounted.fixture.ts"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-16T09:13:05Z"
concept_id: tests/presentation-mounted/mountPanel
language: typescript
---

# mountPanel

## Signature

```typescript
function mountPanel(
  model: Parameters<typeof PanelRenderer>[0]["model"] extends () => infer Model ? Model : never,
  options: { initiallyCollapsed?: boolean } = {},
)
```

## Source
Lines 32–53 in `tests/presentation-mounted.fixture.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [presentation-mounted.fixture](/tests/presentation-mounted.fixture.md) |
| calls | [PanelRenderer](/tui/presentation/renderer/PanelRenderer.md) |
| calls | [filter](/tui/quota/filter.md) |
| calls | [expand](/tests/presentation-mounted/expand.md) |
| calls | [dispose](/tests/presentation-mounted/dispose.md) |
