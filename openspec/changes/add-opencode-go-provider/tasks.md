## 1. Capture The Page Contract And Regressions

- [x] 1.1 Sanitize the authenticated Go workspace page contract, including fixed URL shape, `auth` cookie behavior, login redirect, and the three Solid hydration usage assignments.
- [x] 1.2 Add failing native-option and security tests for workspace/token validation, missing configuration, fixed-origin requests, and token-safe diagnostics.
- [x] 1.3 Add failing page transport, bounded hydration parser, and mapper tests for atomic rolling/weekly/monthly validation, remaining percentages, reset epochs, malformed markup, and authentication expiry.
- [ ] 1.4 Add failing adapter and composition tests for polling, request serialization, reset boundaries, stale expiry, disposal, runtime aliases, active-provider refresh, and ordering.

## 2. Implement The OpenCode Go Provider

- [x] 2.1 Normalize local `quota.opencodego.workspaceId` and `quota.opencodego.workspaceToken` options without exposing secrets through returned diagnostics or committed examples.
- [x] 2.2 Implement the fixed-origin authenticated Go page transport and strict atomic Solid hydration extraction behind a dedicated OpenCode Go module.
- [x] 2.3 Map valid console snapshots to `OpenCode GO:` with 5H, 7D, and 1M semantic progress/reset windows plus ready, stale, unavailable, and configuration-required states.
- [x] 2.4 Implement shared-interval polling, immediate refresh, serialized requests, reset-boundary refresh, stale expiry, one-second countdowns, and disposal-safe updates.

## 3. Integrate And Document The Provider

- [ ] 3.1 Export the provider and summary types through the shared boundary, instantiate it in quota composition, and map `opencode-go` plus `opencode-go-subscription` to the adapter.
- [ ] 3.2 Verify active-provider prioritization, other-provider retention, collapsed summaries, remaining/used modes, and progress colors across all three providers.
- [ ] 3.3 Document local plaintext workspace-token configuration, non-commit requirements, session rotation, supported windows, and hydration-contract limitations.

## 4. Verify And Deploy

- [ ] 4.1 Run focused tests, typechecking, the complete automated suite, production build tests, and deployment tests.
- [ ] 4.2 Deploy locally, verify artifact parity, and manually validate real 5H/7D/1M data, resets, polling, provider switching, stale behavior, configuration removal, and secret-safe output.
