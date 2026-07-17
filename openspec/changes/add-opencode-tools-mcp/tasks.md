## 1. Foundation Contracts

- [x] 1.1 Add a data-only manifest for quota, home, token-report, and MCP with normalized IDs, source entries, artifacts, slot orders, and option ownership.
- [x] 1.2 Add failing tests for standalone module creation, lifecycle cleanup, partial activation rollback, and already-aborted activation.
- [x] 1.3 Implement and export the shared `defineTuiPlugin` runtime contract.
- [x] 1.4 Add failing tests for API-scoped service acquisition, ref counts, idempotent release, and final disposal.
- [x] 1.5 Implement the shared service lease registry and provider hub used by quota and home.

## 2. Current Plugin Migration

- [x] 2.1 Add parity tests that lock quota, home, and token-report behavior before migration.
- [x] 2.2 Move reusable quota composition, options, selection, and provider ownership behind shared exports.
- [ ] 2.3 Move reusable home and token-report decisions behind shared exports and reduce all current TUI entries to thin adapters.
- [ ] 2.4 Convert quota, home, and token-report to standalone modules with normalized manifest IDs.
- [ ] 2.5 Verify quota and home share one provider hub when both are active and remain functional when installed alone.

## 3. Shared Sidebar Presentation

- [ ] 3.1 Add mounted tests for a controlled compact-panel shell, summary segments, separators, bounded content, and collapse callbacks.
- [ ] 3.2 Extract shared compact-panel primitives and migrate quota without changing its rendered layouts or ephemeral collapse behavior.
- [ ] 3.3 Add a reusable status-row primitive that preserves a right-aligned label and truncates names within 37 cells.

## 4. MCP Status Feature

- [ ] 4.1 Extend local TUI declarations with `api.state.mcp()`, known MCP statuses, and the runtime-safe unknown boundary.
- [ ] 4.2 Add shared MCP model tests for order, labels, native roles, unknown fallback, and healthy, unhealthy, and empty summaries.
- [ ] 4.3 Implement and export the pure MCP status model through the shared artifact.
- [ ] 4.4 Add mounted tests for expanded, collapsed, empty, long-name, reactive-update, and persisted-preference scenarios.
- [ ] 4.5 Implement the standalone MCP adapter with shared primitives, namespaced KV persistence, and placement immediately after quota.

## 5. Build, Deployment, and Documentation

- [ ] 5.1 Replace the synthetic composed build entry with manifest-driven standalone builds and test all four artifacts and shared imports.
- [ ] 5.2 Update package exports, included files, TypeScript inputs, and the OpenCode engine floor to 1.18.1.
- [ ] 5.3 Add local and global deployment migration tests for legacy entries, quota options, normalized IDs, unrelated entries, stale files, and idempotency.
- [ ] 5.4 Implement manifest-driven deployment of four standalone entries and removal of obsolete composed artifacts.
- [ ] 5.5 Document standalone installation, normalized IDs, MCP layouts, the automatic config migration, and replacement of `internal:sidebar-mcp`.

## 6. Verification

- [ ] 6.1 Run the complete test suite, strict typecheck, and production plugin build, then resolve any regressions.
