---
okf_version: "0.2"
type: Function
title: mapRowToOpenCodeMessage
resource: lib/tokens/opencode-storage.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-01T14:05:26Z"
concept_id: lib/tokens/opencode-storage/mapRowToOpenCodeMessage
language: typescript
---

# mapRowToOpenCodeMessage

## Signature

```typescript
function mapRowToOpenCodeMessage(row: MessageRow): OpenCodeMessage | null
```

## Source
Lines 106–132 in `lib/tokens/opencode-storage.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [opencode-storage](/lib/tokens/opencode-storage.md) |
| calls | [asRecord](/lib/tokens/opencode-storage/asRecord.md) |
| calls | [safeJsonParse](/lib/tokens/opencode-storage/safeJsonParse.md) |
| calls | [normalizeString](/lib/tokens/opencode-storage/normalizeString.md) |
| calls | [normalizeNumber](/lib/tokens/opencode-storage/normalizeNumber.md) |
| called_by | [mapAssistantMessages](/lib/tokens/opencode-storage/mapAssistantMessages.md) |
