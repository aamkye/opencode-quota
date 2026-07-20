---
okf_version: "0.2"
type: Function
title: header
resource: tui/providers/openai.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:providers"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-16T13:37:47Z"
concept_id: tui/providers/openai/header
language: typescript
---

# header

## Signature

```typescript
function header(title: string, detail?: string, detailSegments?: readonly PanelTextSegment[]): PanelItem
```

## Source
Lines 213–222 in `tui/providers/openai.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [openai](/tui/providers/openai.md) |
| called_by | [mapOpenAiPanelState](/tui/providers/openai/mapOpenAiPanelState.md) |
