---
okf_version: "0.2"
type: Function
title: getSessionTokenSummary
resource: lib/tokens/quota-stats.ts
tags:
  - "lang:typescript"
  - "type:Function"
  - "module:lib"
  - "domain:tokens"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-01T14:05:27Z"
concept_id: lib/tokens/quota-stats/getSessionTokenSummary
language: typescript
---

# getSessionTokenSummary

## Signature

```typescript
function getSessionTokenSummary(sessionID: string): Promise<SessionTokenSummary | null>
```

## Source
Lines 625–658 in `lib/tokens/quota-stats.ts`

## Relationships

| Type | Target |
|------|--------|
| related | [quota-stats](/lib/tokens/quota-stats.md) |
| calls | [iterAssistantMessagesForSession](/lib/tokens/opencode-storage/iterAssistantMessagesForSession.md) |
| calls | [get](/lib/tokens/opencode-sqlite/get.md) |
| calls | [filter](/tui/quota/filter.md) |
