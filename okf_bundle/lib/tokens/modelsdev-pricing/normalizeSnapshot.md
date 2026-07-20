---
okf_version: "0.2"
type: Function
title: normalizeSnapshot
resource: lib/tokens/modelsdev-pricing.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-15T13:08:32Z"
concept_id: lib/tokens/modelsdev-pricing/normalizeSnapshot
language: typescript
---

# normalizeSnapshot

## Signature

```typescript
function normalizeSnapshot(raw: unknown): PricingSnapshot | null
```

## Source
Lines 138–197 in `lib/tokens/modelsdev-pricing.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [modelsdev-pricing](/lib/tokens/modelsdev-pricing.md) |
| calls | [asRecord](/lib/tokens/modelsdev-pricing/asRecord.md) |
| calls | [sortRecordByKeys](/lib/tokens/modelsdev-pricing/sortRecordByKeys.md) |
| called_by | [loadBundledSnapshotSync](/lib/tokens/modelsdev-pricing/loadBundledSnapshotSync.md) |
| called_by | [loadRuntimeSnapshotSync](/lib/tokens/modelsdev-pricing/loadRuntimeSnapshotSync.md) |
