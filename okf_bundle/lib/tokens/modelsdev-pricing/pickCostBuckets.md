---
okf_version: "0.2"
type: Function
title: pickCostBuckets
resource: lib/tokens/modelsdev-pricing.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-15T13:08:32Z"
concept_id: lib/tokens/modelsdev-pricing/pickCostBuckets
language: typescript
---

# pickCostBuckets

## Signature

```typescript
function pickCostBuckets(rawCost: unknown): CostBuckets | null
```

## Source
Lines 371–384 in `lib/tokens/modelsdev-pricing.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [modelsdev-pricing](/lib/tokens/modelsdev-pricing.md) |
| calls | [asRecord](/lib/tokens/modelsdev-pricing/asRecord.md) |
| called_by | [buildSnapshotFromApi](/lib/tokens/modelsdev-pricing/buildSnapshotFromApi.md) |
