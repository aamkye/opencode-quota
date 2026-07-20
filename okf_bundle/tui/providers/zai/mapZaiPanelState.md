---
okf_version: "0.2"
type: Function
title: mapZaiPanelState
resource: tui/providers/zai.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:providers"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-16T13:37:47Z"
concept_id: tui/providers/zai/mapZaiPanelState
language: typescript
---

# mapZaiPanelState

## Signature

```typescript
function mapZaiPanelState(state: ZaiPanelState): PanelModel
```

## Source
Lines 308–381 in `tui/providers/zai.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [zai](/tui/providers/zai.md) |
| calls | [isPeakHour](/tui/providers/zai/isPeakHour.md) |
| calls | [header](/tui/providers/zai/header.md) |
| calls | [quotaItems](/tui/providers/zai/quotaItems.md) |
| calls | [parseSgt](/tui/providers/zai/parseSgt.md) |
| calls | [nextResetEpoch](/tui/providers/zai/nextResetEpoch.md) |
| calls | [timerState](/tui/providers/zai/timerState.md) |
| calls | [filter](/tui/quota/filter.md) |
| called_by | [createZaiProvider](/tui/providers/zai/createZaiProvider.md) |
