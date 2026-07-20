---
okf_version: "0.2"
type: Function
title: findOpenAiAuthFromProviders
resource: tui/providers/openai.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:providers"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-16T13:37:47Z"
concept_id: tui/providers/openai/findOpenAiAuthFromProviders
language: typescript
---

# findOpenAiAuthFromProviders

## Signature

```typescript
function findOpenAiAuthFromProviders(providers: TuiPluginApi["state"]["provider"]): OpenAiAuthEntry | null
```

## Source
Lines 128–134 in `tui/providers/openai.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [openai](/tui/providers/openai.md) |
| calls | [find](/tui/quota/find.md) |
| called_by | [createOpenAiProvider](/tui/providers/openai/createOpenAiProvider.md) |
