# Subagent Progress

- Change: add-opencode-tools-mcp
- Review mode: thorough
- TDD mode: tdd
- Dispatch constraint: native Task subagents only; never invoke `opencode run` or another external agent CLI
- Current plan task: Document Installation, Migration, MCP Layouts, and Rollback (OpenSpec 5.5)
- Mapped OpenSpec task: 5.5 Document standalone installation, normalized IDs, MCP layouts, the automatic config migration, and replacement of `internal:sidebar-mcp`.
- Stage: done
- Review-fix round: 1 of 2
- Implementation commit: c731b31
- Changed files: five allowed Task 11 files
- RED evidence: 3 expected missing-contract failures
- GREEN evidence: focused tests passed 9/9; typecheck passed
- Review status: thorough review approved with no substantive findings; missing ignored report noted as process-only
- RED evidence: missing MCP feature module resolution failure
- GREEN evidence: MCP model tests passed 2/2; typecheck passed
- Risk signals: shared presentation API
- Unresolved feedback: residual mounted narrow-parent rendering risk covered by pure constrained allocator tests
- Recovery action: checkoff and continue to Task 12
