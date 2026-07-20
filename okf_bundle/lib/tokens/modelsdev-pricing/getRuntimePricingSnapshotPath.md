---
okf_version: "0.2"
type: Function
title: getRuntimePricingSnapshotPath
resource: lib/tokens/modelsdev-pricing.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-15T13:08:32Z"
concept_id: lib/tokens/modelsdev-pricing/getRuntimePricingSnapshotPath
language: typescript
---

# getRuntimePricingSnapshotPath

## Signature

```typescript
function getRuntimePricingSnapshotPath(runtimeDirs?: OpencodeRuntimeDirs): string
```

## Source
Lines 213–216 in `lib/tokens/modelsdev-pricing.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [modelsdev-pricing](/lib/tokens/modelsdev-pricing.md) |
| calls | [getOpencodeRuntimeDirs](/lib/tokens/opencode-runtime-paths/getOpencodeRuntimeDirs.md) |
| called_by | [loadRuntimeSnapshotSync](/lib/tokens/modelsdev-pricing/loadRuntimeSnapshotSync.md) |
| called_by | [maybeRefreshPricingSnapshot](/lib/tokens/modelsdev-pricing/maybeRefreshPricingSnapshot.md) |
