---
okf_version: "0.2"
type: Function
title: resolveDisplayedPercent
resource: lib/tokens/format-utils.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-01T14:08:00Z"
concept_id: lib/tokens/format-utils/resolveDisplayedPercent
language: typescript
---

# resolveDisplayedPercent

## Signature

```typescript
function resolveDisplayedPercent(
  percentRemaining: number,
  mode: PercentDisplayMode = "remaining",
): number
```

## Source
Lines 29–36 in `lib/tokens/format-utils.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [format-utils](/lib/tokens/format-utils.md) |
| called_by | [formatDisplayedPercentLabel](/lib/tokens/format-utils/formatDisplayedPercentLabel.md) |
