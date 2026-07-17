# Subagent Progress

- Change: add-opencode-tools-mcp
- Review mode: thorough
- TDD mode: tdd
- Current plan task: Move Home and Token Decisions Behind Shared Exports (OpenSpec 2.3)
- Mapped OpenSpec task: 2.3 Move reusable home and token-report decisions behind shared exports and reduce all current TUI entries to thin adapters.
- Stage: done
- Review-fix round: 0 of 2
- Implementation commit: 4a773a1c86efa9a7fb5775e4573f7919dc8413ef
- Changed files: shared/opencode-tools-shared.ts; tests/compile-presentation.mjs; tests/home-quota.test.mjs; tests/shared-boundary.test.mjs; tests/token-tui.test.mjs; tui/features/home.ts; tui/features/token-report.ts; tui/home.tsx; tui/token-report.tsx
- RED evidence: `node tests/compile-presentation.mjs && node --test tests/home-quota.test.mjs tests/token-tui.test.mjs tests/shared-boundary.test.mjs` failed resolving missing `tui/features/home.ts` as expected
- GREEN evidence: `node tests/compile-presentation.mjs && node --test tests/home-quota.test.mjs tests/token-tui.test.mjs tests/plugin-adapters.test.mjs tests/shared-boundary.test.mjs` passed 19/19 with pristine output
- Review status: thorough task review approved with no findings; later artifact/runtime requirements recorded as cross-task gates for Tasks 8, 15, and 16
- Risk signals: cross-module; security/external input; public API/external interface
- Unresolved feedback: accepted Task 6 Minor `quotaSidebarSlotOrder` indirection retained for final review reassessment; later-task gates are normalized runtime IDs (Task 8), standalone artifact/sibling isolation (Task 15), and OpenCode 1.18.1 floor (Task 16)
- Recovery action: Task 7 targeted plan/OpenSpec checkoffs passed; commit coordinator tracking, then dispatch Task 8
