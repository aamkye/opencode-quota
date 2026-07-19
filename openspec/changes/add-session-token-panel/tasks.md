## 1. SesTokens Model

- [x] 1.1 Add failing model tests for assistant-turn aggregation, token totals, cache-ratio edge cases, compact formatting, and collapsed summary text
- [x] 1.2 Implement the pure SesTokens aggregation and presentation model and export it through the shared module

## 2. Session-Tree Data Source

- [x] 2.1 Add failing tests for descendant traversal, cycle protection, bounded concurrency, session switching, stale generations, retry, and last-complete-snapshot retention
- [x] 2.2 Implement the client-backed session-tree loader and event-driven refresh coordinator with lifecycle cleanup
- [x] 2.3 Extend local OpenCode TUI API declarations and compile fixtures for the session, client, event, and state surface used by SesTokens

## 3. Sidebar Panel

- [x] 3.1 Add mounted-panel tests for AGENTS.md expanded, collapsed, loading, unavailable, width-boundary, persistence, session-switch, and disposal scenarios
- [x] 3.2 Implement the standalone Solid SesTokens panel with exact row ordering, symbols, alignment, colors, dividers, summary, and KV collapse behavior

## 4. Plugin Integration

- [x] 4.1 Add failing manifest, package export, build, deployment, managed-artifact, and shared-contract expectations for SesTokens
- [x] 4.2 Wire SesTokens into the plugin manifest, runtime descriptor types, package metadata, build outputs, deployment paths, and user-facing plugin documentation

## 5. Verification

- [ ] 5.1 Run focused tests, typecheck, the full test suite, and plugin build; inspect generated output for forbidden imports and confirm no AGENTS.md layout regression
