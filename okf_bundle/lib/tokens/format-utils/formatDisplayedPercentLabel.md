---
okf_version: "0.2"
type: Function
title: formatDisplayedPercentLabel
resource: lib/tokens/format-utils.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-01T14:08:00Z"
concept_id: lib/tokens/format-utils/formatDisplayedPercentLabel
language: typescript
---

# formatDisplayedPercentLabel

## Signature

```typescript
function formatDisplayedPercentLabel(
  percentRemaining: number,
  mode: PercentDisplayMode = "remaining",
): string
```

## Source
Lines 38–44 in `lib/tokens/format-utils.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [format-utils](/lib/tokens/format-utils.md) |
| calls | [resolveDisplayedPercent](/lib/tokens/format-utils/resolveDisplayedPercent.md) |
