---
okf_version: "0.2"
type: Function
title: parseOptionalJsonArgs
resource: lib/tokens/command-parsing.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-01T14:07:37Z"
concept_id: lib/tokens/command-parsing/parseOptionalJsonArgs
language: typescript
---

# parseOptionalJsonArgs

## Signature

```typescript
function parseOptionalJsonArgs(input: string | undefined): | {
      ok: true;
      value: Record<string, unknown>;
    }
  | {
      ok: false;
      error: string;
    }
```

## Source
Lines 3–23 in `lib/tokens/command-parsing.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [command-parsing](/lib/tokens/command-parsing.md) |
