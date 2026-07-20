---
okf_version: "0.2"
type: Function
title: header
resource: tui/providers/zai.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:providers"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-16T13:37:47Z"
concept_id: tui/providers/zai/header
language: typescript
---

# header

## Signature

```typescript
function header(
  title: string,
  detail?: string,
  status?: PanelStatus,
  detailSegments?: readonly PanelTextSegment[],
): PanelItem
```

## Source
Lines 277–292 in `tui/providers/zai.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [zai](/tui/providers/zai.md) |
| called_by | [mapZaiPanelState](/tui/providers/zai/mapZaiPanelState.md) |
