---
okf_version: "0.2"
type: Function
title: formatTimer
resource: tui/presentation/format.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:presentation"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-20T08:46:32Z"
concept_id: tui/presentation/format/formatTimer
language: typescript
---

# formatTimer

## Signature

```typescript
function formatTimer(timer: TimerDisplay, now = Date.now): string
```

## Source
Lines 69–85 in `tui/presentation/format.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [format](/tui/presentation/format.md) |
| calls | [formatDuration](/tui/presentation/format/formatDuration.md) |
| called_by | [normalizeItem](/tui/presentation/renderer/normalizeItem.md) |
