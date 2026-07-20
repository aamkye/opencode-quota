---
okf_version: "0.2"
type: Function
title: applySnapshotSelection
resource: lib/tokens/modelsdev-pricing.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-15T13:08:32Z"
concept_id: lib/tokens/modelsdev-pricing/applySnapshotSelection
language: typescript
---

# applySnapshotSelection

## Signature

```typescript
function applySnapshotSelection(params?: {
  runtimeDirs?: OpencodeRuntimeDirs;
  bootstrapSnapshotOverride?: PricingSnapshot;
  selection?: PricingSnapshotSource;
}): { snapshot: PricingSnapshot; source: "runtime" | "bundled" | "empty" }
```

## Source
Lines 280–288 in `lib/tokens/modelsdev-pricing.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [modelsdev-pricing](/lib/tokens/modelsdev-pricing.md) |
| calls | [chooseSnapshot](/lib/tokens/modelsdev-pricing/chooseSnapshot.md) |
| calls | [setSnapshot](/lib/tokens/modelsdev-pricing/setSnapshot.md) |
| called_by | [ensureLoaded](/lib/tokens/modelsdev-pricing/ensureLoaded.md) |
| called_by | [maybeRefreshPricingSnapshot](/lib/tokens/modelsdev-pricing/maybeRefreshPricingSnapshot.md) |
