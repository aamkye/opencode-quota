---
okf_version: "0.2"
type: Function
title: getOpencodeRuntimeDirCandidates
resource: lib/tokens/opencode-runtime-paths.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-01T14:04:09Z"
concept_id: lib/tokens/opencode-runtime-paths/getOpencodeRuntimeDirCandidates
language: typescript
---

# getOpencodeRuntimeDirCandidates

## Signature

```typescript
function getOpencodeRuntimeDirCandidates(params?: {
  platform?: NodeJS.Platform;
  env?: NodeJS.ProcessEnv;
  homeDir?: string;
  primary?: OpencodeRuntimeDirs;
}): OpencodeRuntimeDirCandidates
```

## Source
Lines 50–86 in `lib/tokens/opencode-runtime-paths.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [opencode-runtime-paths](/lib/tokens/opencode-runtime-paths.md) |
| calls | [getOpencodeRuntimeDirs](/lib/tokens/opencode-runtime-paths/getOpencodeRuntimeDirs.md) |
| calls | [dedupe](/lib/tokens/opencode-runtime-paths/dedupe.md) |
| called_by | [getOpenCodeDataDirCandidates](/lib/tokens/opencode-storage/getOpenCodeDataDirCandidates.md) |
