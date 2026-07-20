---
okf_version: "0.2"
type: Function
title: "on"
resource: opencode-plugin-tui.d.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:opencode-plugin-tui.d.ts"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-20T01:15:53Z"
concept_id: opencode-plugin-tui/on
language: typescript
---

# on

## Signature

```typescript
on(
        type: Type,
        handler: (event: Extract<TuiEvent, { type: Type }>) => void,
      ): () => void
```

## Type Parameters

- `Type extends TuiEvent["type"]`

## Source
Lines 119–144 in `opencode-plugin-tui.d.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [opencode-plugin-tui.d](/opencode-plugin-tui.d.md) |
