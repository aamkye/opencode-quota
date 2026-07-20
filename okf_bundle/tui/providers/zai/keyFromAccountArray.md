---
okf_version: "0.2"
type: Function
title: keyFromAccountArray
resource: tui/providers/zai.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:tui"
  - "domain:providers"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-16T13:37:47Z"
concept_id: tui/providers/zai/keyFromAccountArray
language: typescript
---

# keyFromAccountArray

## Signature

```typescript
function keyFromAccountArray(data: unknown): string | null
```

## Source
Lines 178–181 in `tui/providers/zai.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [zai](/tui/providers/zai.md) |
| calls | [find](/tui/quota/find.md) |
| called_by | [findZaiKeyFromFiles](/tui/providers/zai/findZaiKeyFromFiles.md) |
