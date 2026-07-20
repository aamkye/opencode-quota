---
okf_version: "0.2"
type: Function
title: createContextPanelModel
resource: tui/features/context.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:features"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-18T18:47:16Z"
concept_id: tui/features/context/createContextPanelModel
language: typescript
---

# createContextPanelModel

## Signature

```typescript
function createContextPanelModel(
  messages: readonly ContextMessage[],
  providers: readonly ContextProvider[],
): ContextPanelModel
```

## Source
Lines 41–91 in `tui/features/context.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [context](/tui/features/context.md) |
| calls | [finite](/tui/features/context/finite.md) |
| calls | [messageTokens](/tui/features/context/messageTokens.md) |
| calls | [formatCurrency](/tui/presentation/format/formatCurrency.md) |
| calls | [formatCount](/tui/presentation/format/formatCount.md) |
| calls | [find](/tui/quota/find.md) |
| called_by | [ContextPanel](/tui/context/ContextPanel.md) |
