# Subagent Progress

- Change: add-opencode-tools-mcp
- Review mode: thorough
- TDD mode: tdd
- Dispatch constraint: native Task subagents only; never invoke `opencode run` or another external agent CLI
- Current plan task: Publish Standalone Metadata and Raise the Engine Floor (OpenSpec 5.2)
- Mapped OpenSpec task: 5.2 Update package exports, included files, TypeScript inputs, and the OpenCode engine floor to 1.18.1.
- Stage: done
- Review-fix round: 1 of 2
- Implementation commit: 6ff186d; fix fb0734f
- Changed files: five allowed Task 11 files
- RED evidence: 3 expected missing-contract failures
- GREEN evidence: focused tests passed 9/9; typecheck passed
- Review status: thorough re-review approved; one non-blocking stale pack-count evidence correction retained
- RED evidence: missing MCP feature module resolution failure
- GREEN evidence: MCP model tests passed 2/2; typecheck passed
- Risk signals: shared presentation API
- Unresolved feedback: residual mounted narrow-parent rendering risk covered by pure constrained allocator tests
- Recovery action: checkoff and continue to Task 12
