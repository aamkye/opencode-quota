## 1. Capture The Private Contract And Regressions

- [ ] 1.1 Capture and sanitize the current `lite.subscription.get` request/response contract, including URL, method, headers, payload, authentication failure, and redirect behavior.
- [ ] 1.2 Add failing native-option and security tests for workspace/cookie validation, missing configuration, fixed-origin requests, and cookie-safe diagnostics.
- [ ] 1.3 Add failing transport and mapper tests for atomic rolling/weekly/monthly validation, remaining percentages, reset epochs, malformed responses, and authentication expiry.
- [ ] 1.4 Add failing adapter and composition tests for polling, request serialization, reset boundaries, stale expiry, disposal, runtime aliases, active-provider refresh, and ordering.

## 2. Implement The OpenCode Go Provider

- [ ] 2.1 Add normalized `openCodeGo.workspaceId` and `openCodeGo.cookie` native options without exposing secrets through returned diagnostics or committed examples.
- [ ] 2.2 Implement the fixed-origin private console transport and strict atomic response validation behind a dedicated OpenCode Go module.
- [ ] 2.3 Map valid console snapshots to `OpenCode GO:` with 5H, 7D, and 1M semantic progress/reset windows plus ready, stale, unavailable, and configuration-required states.
- [ ] 2.4 Implement shared-interval polling, immediate refresh, serialized requests, reset-boundary refresh, stale expiry, one-second countdowns, and disposal-safe updates.

## 3. Integrate And Document The Provider

- [ ] 3.1 Export the provider and summary types through the shared boundary, instantiate it in quota composition, and map `opencode-go` plus `opencode-go-subscription` to the adapter.
- [ ] 3.2 Verify active-provider prioritization, other-provider retention, collapsed summaries, remaining/used modes, and progress colors across all three providers.
- [ ] 3.3 Document local plaintext cookie configuration, non-commit requirements, session rotation, supported windows, and private-contract limitations.

## 4. Verify And Deploy

- [ ] 4.1 Run focused tests, typechecking, the complete automated suite, production build tests, and deployment tests.
- [ ] 4.2 Deploy locally, verify artifact parity, and manually validate real 5H/7D/1M data, resets, polling, provider switching, stale behavior, configuration removal, and secret-safe output.
