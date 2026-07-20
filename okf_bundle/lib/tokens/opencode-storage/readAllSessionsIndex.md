---
okf_version: "0.2"
type: Function
title: readAllSessionsIndex
resource: lib/tokens/opencode-storage.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-01T14:05:26Z"
concept_id: lib/tokens/opencode-storage/readAllSessionsIndex
language: typescript
---

# readAllSessionsIndex

## Signature

```typescript
function readAllSessionsIndex(): Promise<Record<string, OpenCodeSessionInfo>>
```

## Source
Lines 315–343 in `lib/tokens/opencode-storage.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [opencode-storage](/lib/tokens/opencode-storage.md) |
| calls | [openDbOrNull](/lib/tokens/opencode-storage/openDbOrNull.md) |
| calls | [all](/lib/tokens/opencode-sqlite/all.md) |
| calls | [close](/lib/tokens/opencode-sqlite/close.md) |
| called_by | [aggregateUsage](/lib/tokens/quota-stats/aggregateUsage.md) |
| called_by | [resolveSessionTree](/lib/tokens/quota-stats/resolveSessionTree.md) |
