---
okf_version: "0.2"
type: Function
title: createSesTokensPanelModel
resource: tui/features/ses-tokens.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:features"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-20T09:11:43Z"
concept_id: tui/features/ses-tokens/createSesTokensPanelModel
language: typescript
---

# createSesTokensPanelModel

## Signature

```typescript
function createSesTokensPanelModel(messages: readonly SesTokensMessage[]): SesTokensPanelModel
```

## Source
Lines 33–61 in `tui/features/ses-tokens.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [ses-tokens](/tui/features/ses-tokens.md) |
| calls | [finite](/tui/features/ses-tokens/finite.md) |
| calls | [formatCount](/tui/presentation/format/formatCount.md) |
| called_by | [SesTokensPanel](/tui/ses-tokens/SesTokensPanel.md) |
