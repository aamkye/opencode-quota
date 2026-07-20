---
okf_version: "0.2"
type: Function
title: fmtLocalDateTime
description: "Format a timestamp as human-readable local time: \"HH:MM YYYY-MM-DD\""
resource: lib/tokens/quota-stats-format.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-15T13:08:32Z"
concept_id: lib/tokens/quota-stats-format/fmtLocalDateTime
language: typescript
---

# fmtLocalDateTime

Format a timestamp as human-readable local time: "HH:MM YYYY-MM-DD"

## Signature

```typescript
function fmtLocalDateTime(ms: number): string
```

## Docstring

Format a timestamp as human-readable local time: "HH:MM YYYY-MM-DD"

## Source
Lines 54–62 in `lib/tokens/quota-stats-format.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [quota-stats-format](/lib/tokens/quota-stats-format.md) |
| called_by | [fmtWindow](/lib/tokens/quota-stats-format/fmtWindow.md) |
