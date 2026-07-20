---
okf_version: "0.2"
type: Function
title: effectiveRefreshInterval
resource: tui/services/quota-provider-hub.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:services"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-17T13:34:37Z"
concept_id: tui/services/quota-provider-hub/effectiveRefreshInterval
language: typescript
---

# effectiveRefreshInterval

## Signature

```typescript
function effectiveRefreshInterval(value: number | undefined): number
```

## Source
Lines 56–58 in `tui/services/quota-provider-hub.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [quota-provider-hub](/tui/services/quota-provider-hub.md) |
| calls | [normalizeRefreshInterval](/tui/services/quota-provider-hub/normalizeRefreshInterval.md) |
| called_by | [openAiKey](/tui/services/quota-provider-hub/openAiKey.md) |
| called_by | [openCodeGoKey](/tui/services/quota-provider-hub/openCodeGoKey.md) |
| called_by | [zaiKey](/tui/services/quota-provider-hub/zaiKey.md) |
