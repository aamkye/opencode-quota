---
okf_version: "0.2"
type: Function
title: quotaItems
resource: tui/providers/zai.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:providers"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-16T13:37:47Z"
concept_id: tui/providers/zai/quotaItems
language: typescript
---

# quotaItems

## Signature

```typescript
function quotaItems(label: "5H" | "7D", id: "5h" | "7d", order: number, remainingPct: number, epoch: number, now: number, absolute: AbsoluteQuota | null): PanelItem[]
```

## Source
Lines 294–306 in `tui/providers/zai.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [zai](/tui/providers/zai.md) |
| calls | [timerState](/tui/providers/zai/timerState.md) |
| called_by | [mapZaiPanelState](/tui/providers/zai/mapZaiPanelState.md) |
