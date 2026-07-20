---
okf_version: "0.2"
type: Function
title: loadRuntimeSnapshotSync
resource: lib/tokens/modelsdev-pricing.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-15T13:08:32Z"
concept_id: lib/tokens/modelsdev-pricing/loadRuntimeSnapshotSync
language: typescript
---

# loadRuntimeSnapshotSync

## Signature

```typescript
function loadRuntimeSnapshotSync(runtimeDirs?: OpencodeRuntimeDirs): PricingSnapshot | null
```

## Source
Lines 223–231 in `lib/tokens/modelsdev-pricing.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [modelsdev-pricing](/lib/tokens/modelsdev-pricing.md) |
| calls | [getRuntimePricingSnapshotPath](/lib/tokens/modelsdev-pricing/getRuntimePricingSnapshotPath.md) |
| calls | [normalizeSnapshot](/lib/tokens/modelsdev-pricing/normalizeSnapshot.md) |
| called_by | [chooseSnapshot](/lib/tokens/modelsdev-pricing/chooseSnapshot.md) |
| called_by | [maybeRefreshPricingSnapshot](/lib/tokens/modelsdev-pricing/maybeRefreshPricingSnapshot.md) |
