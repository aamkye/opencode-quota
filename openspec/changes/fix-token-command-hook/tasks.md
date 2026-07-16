## 1. Fix Token Command Hook

- [x] 1.1 Add a failing regression test for a recognized token command that asserts normal hook completion and rendered output parts.
- [x] 1.2 Replace synthetic abort/session prompt behavior with supported output-part mutation in the token command hook and declarative command registration during deployment.
- [x] 1.3 Run the token-plugin regression tests, full test suite, typecheck, and plugin build.

## 2. Replace Model-Backed Token Commands

- [x] 2.1 Add failing TUI command and route tests for no-model report generation, range input, and return navigation.
- [x] 2.2 Implement native token TUI commands, report route, and native range prompt.
- [x] 2.3 Remove server token command deployment and verify local/global cleanup with the full project suite.
