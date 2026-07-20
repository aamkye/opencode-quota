---
okf_version: "0.2"
type: Function
title: writeJsonAtomic
resource: lib/tokens/atomic-json.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-01T14:04:09Z"
concept_id: lib/tokens/atomic-json/writeJsonAtomic
language: typescript
---

# writeJsonAtomic

## Signature

```typescript
function writeJsonAtomic(
  path: string,
  data: unknown,
  opts: WriteJsonAtomicOptions = {},
): Promise<void>
```

## Source
Lines 13–38 in `lib/tokens/atomic-json.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [atomic-json](/lib/tokens/atomic-json.md) |
| calls | [stringifyWithComments](/lib/tokens/jsonc/stringifyWithComments.md) |
| calls | [safeRm](/lib/tokens/atomic-json/safeRm.md) |
| called_by | [maybeRefreshPricingSnapshot](/lib/tokens/modelsdev-pricing/maybeRefreshPricingSnapshot.md) |
