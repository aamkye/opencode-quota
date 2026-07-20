---
okf_version: "0.2"
type: Function
title: fetchWithTimeout
resource: lib/tokens/http.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-01T14:03:56Z"
concept_id: lib/tokens/http/fetchWithTimeout
language: typescript
---

# fetchWithTimeout

## Signature

```typescript
function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number = REQUEST_TIMEOUT_MS,
): Promise<Response>
```

## Source
Lines 3–25 in `lib/tokens/http.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [http](/lib/tokens/http.md) |
| called_by | [fetchModelsDevSnapshot](/lib/tokens/modelsdev-pricing/fetchModelsDevSnapshot.md) |
