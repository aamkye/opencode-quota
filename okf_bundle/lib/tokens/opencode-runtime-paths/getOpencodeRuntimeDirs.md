---
okf_version: "0.2"
type: Function
title: getOpencodeRuntimeDirs
resource: lib/tokens/opencode-runtime-paths.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-01T14:04:09Z"
concept_id: lib/tokens/opencode-runtime-paths/getOpencodeRuntimeDirs
language: typescript
---

# getOpencodeRuntimeDirs

## Signature

```typescript
function getOpencodeRuntimeDirs(params?: {
  env?: NodeJS.ProcessEnv;
  homeDir?: string;
}): OpencodeRuntimeDirs
```

## Source
Lines 30–48 in `lib/tokens/opencode-runtime-paths.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [opencode-runtime-paths](/lib/tokens/opencode-runtime-paths.md) |
| called_by | [getRuntimePricingRefreshStatePath](/lib/tokens/modelsdev-pricing/getRuntimePricingRefreshStatePath.md) |
| called_by | [getRuntimePricingSnapshotPath](/lib/tokens/modelsdev-pricing/getRuntimePricingSnapshotPath.md) |
| called_by | [getOpencodeRuntimeDirCandidates](/lib/tokens/opencode-runtime-paths/getOpencodeRuntimeDirCandidates.md) |
