## 1. Context Metrics Model

- [x] 1.1 Add failing model tests for populated, compacted, zero-cost, missing-session, and missing-model-metadata scenarios.
- [x] 1.2 Implement the typed Context panel model with OpenCode-compatible token, usage, cost, and compact-value formatting.

## 2. Context TUI Component

- [x] 2.1 Add failing mounted-component and TUI-state type fixtures for expanded, collapsed, persisted, reactive, unavailable, and 37-column layouts.
- [x] 2.2 Implement the Context sidebar component with `CompactPanel`, quantity rows, active-session wiring, and persisted collapse state.

## 3. Plugin Packaging

- [x] 3.1 Register the Context descriptor, package export, build artifact, and sidebar order between MCP and LSP.
- [x] 3.2 Update plugin registration and deployment documentation with the new opt-in Context artifact.

## 4. Verification

- [x] 4.1 Run focused Context model, mounted-component, manifest, and build tests and resolve failures.
- [x] 4.2 Run the full test suite, typecheck, and plugin build; confirm generated output matches the OpenSpec scenarios and `AGENTS.md` layout.
