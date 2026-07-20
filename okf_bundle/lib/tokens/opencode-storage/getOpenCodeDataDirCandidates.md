---
okf_version: "0.2"
type: Function
title: getOpenCodeDataDirCandidates
resource: lib/tokens/opencode-storage.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-01T14:05:26Z"
concept_id: lib/tokens/opencode-storage/getOpenCodeDataDirCandidates
language: typescript
---

# getOpenCodeDataDirCandidates

## Signature

```typescript
function getOpenCodeDataDirCandidates(): string[]
```

## Source
Lines 56–58 in `lib/tokens/opencode-storage.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [opencode-storage](/lib/tokens/opencode-storage.md) |
| calls | [getOpencodeRuntimeDirCandidates](/lib/tokens/opencode-runtime-paths/getOpencodeRuntimeDirCandidates.md) |
| called_by | [getOpenCodeDataDir](/lib/tokens/opencode-storage/getOpenCodeDataDir.md) |
| called_by | [getOpenCodeDbPathCandidates](/lib/tokens/opencode-storage/getOpenCodeDbPathCandidates.md) |
