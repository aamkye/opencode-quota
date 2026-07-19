## 1. SubAgent Model

- [x] 1.1 Add failing model tests for direct-child filtering, deterministic newest-first ordering, newest-five/Rest grouping, completed-result status precedence, newest-message identity fallback, counts, failure-evidence durations, and truncation allocation
- [x] 1.2 Implement the pure SubAgent entry, grouping, status, duration, and collapsed-summary model and export it through the shared module

## 2. Child-Session Data Source

- [x] 2.1 Add failing tests for initial reconstruction, client envelopes, direct-only requests, bounded cross-generation concurrency, immediate event invalidation, assistant error removal, repeated failure timestamps, retries, loading-to-unavailable and unavailable-to-ready recovery, stale retention/recovery, session switching, stale generations, and deleted-child pruning
- [x] 2.2 Implement the direct-child loader and debounced event coordinator with discovered-topology publication, 2/4/8 retries, minimal failure persistence, complete-snapshot retention, and lifecycle cleanup
- [x] 2.3 Extend local OpenCode TUI API declarations and compile fixtures for session records, status, messages, events, client listing, and route navigation used by SubAgent

## 3. Sidebar Panel

- [x] 3.1 Add mounted-panel tests for every AGENTS.md expanded, semi-collapsed, collapsed, Rest, one-detail, empty, stale, and width-boundary layout plus loading/unavailable no-output behavior
- [x] 3.2 Add mounted interaction tests for independent panel/Rest persistence, one-entry expansion, stale expansion cleanup, duration clock disposal, and Open Session navigation
- [x] 3.3 Implement the standalone Solid SubAgent panel with exact disclosures, bullets, rows, colors, ellipsis, dividers, detail alignment, and conditional one-second clock

## 4. Plugin Integration

- [x] 4.1 Add failing exact manifest-order, package export, build, deployment, managed-artifact, and shared-contract expectations for SubAgent
- [x] 4.2 Wire SubAgent into the plugin manifest, runtime descriptor types, package metadata, build outputs, deployment paths, and user-facing plugin documentation

## 5. Verification

- [x] 5.1 Run focused tests, typecheck, the full test suite, and plugin build; inspect generated output for forbidden imports and confirm no AGENTS.md layout regression
