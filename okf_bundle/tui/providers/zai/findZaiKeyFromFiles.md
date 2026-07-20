---
okf_version: "0.2"
type: Function
title: findZaiKeyFromFiles
resource: tui/providers/zai.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:providers"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-16T13:37:47Z"
concept_id: tui/providers/zai/findZaiKeyFromFiles
language: typescript
---

# findZaiKeyFromFiles

## Signature

```typescript
function findZaiKeyFromFiles(): string | null
```

## Source
Lines 183–195 in `tui/providers/zai.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [zai](/tui/providers/zai.md) |
| calls | [keyFromAuthFile](/tui/providers/zai/keyFromAuthFile.md) |
| calls | [keyFromAccountFile](/tui/providers/zai/keyFromAccountFile.md) |
| calls | [keyFromAccountArray](/tui/providers/zai/keyFromAccountArray.md) |
| calls | [error](/tests/subagent-source/error.md) |
| called_by | [createZaiProvider](/tui/providers/zai/createZaiProvider.md) |
