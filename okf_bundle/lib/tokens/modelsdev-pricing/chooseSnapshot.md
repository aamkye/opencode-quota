---
okf_version: "0.2"
type: Function
title: chooseSnapshot
resource: lib/tokens/modelsdev-pricing.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-15T13:08:32Z"
concept_id: lib/tokens/modelsdev-pricing/chooseSnapshot
language: typescript
---

# chooseSnapshot

## Signature

```typescript
function chooseSnapshot(params?: {
  runtimeDirs?: OpencodeRuntimeDirs;
  bootstrapSnapshotOverride?: PricingSnapshot;
  selection?: PricingSnapshotSource;
}): { snapshot: PricingSnapshot; source: "runtime" | "bundled" | "empty" }
```

## Source
Lines 237–272 in `lib/tokens/modelsdev-pricing.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [modelsdev-pricing](/lib/tokens/modelsdev-pricing.md) |
| calls | [loadBundledSnapshotSync](/lib/tokens/modelsdev-pricing/loadBundledSnapshotSync.md) |
| calls | [loadRuntimeSnapshotSync](/lib/tokens/modelsdev-pricing/loadRuntimeSnapshotSync.md) |
| calls | [hasSnapshotData](/lib/tokens/modelsdev-pricing/hasSnapshotData.md) |
| called_by | [applySnapshotSelection](/lib/tokens/modelsdev-pricing/applySnapshotSelection.md) |
