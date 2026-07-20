---
okf_version: "0.2"
type: Function
title: runNext
resource: tests/ses-tokens-source.test.mjs
tags:
  - "lang:javascript"
  - "type:Function"
  - "module:tests"
  - "domain:ses-tokens-source.test.mjs"
  - "git:branch:feature/20260720/polish-tui-session-rename"
  - "git:repo:opencode-quota"
timestamp: "2026-07-19T13:51:24Z"
concept_id: tests/ses-tokens-source/runNext
language: javascript
---

# runNext

## Signature

```javascript
runNext(delay)
```

## Source
Lines 50–56 in `tests/ses-tokens-source.test.mjs`

## Relationships

| Type | Target |
|------|--------|
| related | [ses-tokens-source.test](/tests/ses-tokens-source.test.md) |
| calls | [find](/tui/quota/find.md) |
| calls | [settle](/tests/ses-tokens-source/settle.md) |
| called_by | [exhaustRetries](/tests/ses-tokens-source/exhaustRetries.md) |
