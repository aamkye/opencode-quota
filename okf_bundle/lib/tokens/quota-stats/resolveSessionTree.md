---
okf_version: "0.2"
type: Function
title: resolveSessionTree
resource: lib/tokens/quota-stats.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-01T14:05:27Z"
concept_id: lib/tokens/quota-stats/resolveSessionTree
language: typescript
---

# resolveSessionTree

## Signature

```typescript
function resolveSessionTree(rootSessionID: string): Promise<SessionTreeNode[]>
```

## Source
Lines 445–479 in `lib/tokens/quota-stats.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [quota-stats](/lib/tokens/quota-stats.md) |
| calls | [readAllSessionsIndex](/lib/tokens/opencode-storage/readAllSessionsIndex.md) |
| calls | [getOpenCodeDbPath](/lib/tokens/opencode-storage/getOpenCodeDbPath.md) |
| calls | [get](/lib/tokens/opencode-sqlite/get.md) |
| calls | [visit](/lib/tokens/quota-stats/visit.md) |
| called_by | [computeTokenReport](/lib/tokens/token-report-data/computeTokenReport.md) |
