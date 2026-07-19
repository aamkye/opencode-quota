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

## 6. Visual Contract Corrections

- [x] 6.1 Add failing pure-allocation, mounted-panel, source-boundary, compiler, and build-policy tests for bullet removal, 37/36/scrollbar-reduced 35-cell end truncation, one fixed title/time gap, grapheme-safe measured `onSizeChange` behavior and removal safety, compact/detail status colors, muted Rest disclosure/title, explicit muted divider children, revised AGENTS-derived layouts, type-only public `Renderable` use, the exact bundled width-helper dependency chain, and no trailing whitespace
- [x] 6.2 Remove entry bullet rendering/allocation, implement public-OpenTUI `onSizeChange` terminal-cell end truncation, color compact/detail times, render the muted explicit Rest divider/header, directly declare locked `string-width` 7.2.0, synchronize README layouts/docs, and pass focused, typecheck, full-suite, build, diff, hash, dependency, bundle, and artifact checks without changing existing source, lifecycle, navigation, persistence, status, or integration behavior

## 7. Responsive Title Width Correction

- [ ] 7.1 Add a failing mounted regression that removes all title measurement callbacks, asserts a flex-derived 28-cell title at width 37 and 27 cells at scrollbar-reduced width 36, and preserves the one-cell gap and full duration
- [ ] 7.2 Implement the `CompactStatusRow` flexible-title/fixed-right pattern plus end truncation and native clipping safety, preserve all approved visual behavior, pass focused/full/typecheck/build/bundle gates, deploy locally, and confirm titles in the live OpenCode sidebar
