## 1. LSP State Model

- [x] 1.1 Add a compile fixture for `api.state.lsp()` and extend the local TUI declaration with the SDK-compatible LSP entry shape.
- [x] 1.2 Add failing pure model tests for host ordering, active counts, connected and error roles, empty state, and ignored host metadata.
- [x] 1.3 Implement and export the pure LSP panel model through the shared artifact.

## 2. Standalone LSP Panel

- [x] 2.1 Add failing mounted tests for expanded rows, semantic bullet colors, collapsed counts, KV persistence, and placement after MCP.
- [x] 2.2 Add failing mounted tests for the default empty hint, empty collapse behavior, reactive empty/populated transitions, and root preservation.
- [x] 2.3 Add failing constrained-width tests for long-ID ellipsis, 37- and 36-cell bounds, full-width separators, and no trailing whitespace.
- [x] 2.4 Implement the LSP row presentation and standalone `tui/lsp.tsx` adapter with namespaced persistent collapse state.

## 3. Packaging and Deployment

- [x] 3.1 Add failing manifest, package export, and production-build expectations for the fifth standalone LSP artifact.
- [x] 3.2 Extend the plugin manifest, runtime key type, shared exports, package metadata, and build outputs with LSP immediately after MCP.
- [x] 3.3 Add failing local and global deployment tests for LSP installation, existing four-plugin migration, unrelated entries, stale artifacts, and idempotency.
- [x] 3.4 Extend manifest-driven deployment and managed configuration migration to install the LSP artifact without changing quota options.

## 4. Documentation and Verification

- [x] 4.1 Document LSP layouts, installation, collapse persistence, and replacement of `internal:sidebar-lsp` without automatic deactivation.
- [x] 4.2 Run the complete test suite, strict typecheck, and production plugin build, then resolve any regressions.
