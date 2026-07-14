## Why

The quota sidebar recognizes OpenCode Go model metadata but cannot display the subscription's 5-hour, weekly, or monthly limits. Users selecting an `opencode-go` model need the same active-provider quota visibility, refresh behavior, and failure handling already available for Z.AI and OpenAI.

## What Changes

- Add an OpenCode Go quota provider backed by the authenticated console's private subscription-usage query.
- Add native options for a console workspace ID and session cookie, with explicit local-secret handling requirements.
- Display 5H, 7D, and 1M remaining percentages and reset times using the existing semantic panel, coloring, and percentage-mode behavior.
- Recognize both `opencode-go` and `opencode-go-subscription` runtime IDs for active-provider refresh and prioritization.
- Reuse configurable polling, reset-boundary refresh, stale-data retention, and lifecycle cleanup while failing closed on invalid configuration or authentication.
- Add transport, mapping, composition, lifecycle, security, build, deployment, and live-validation coverage.

## Capabilities

### New Capabilities
- `opencode-go-quota-provider`: Authenticated OpenCode Go console usage retrieval, semantic quota presentation, provider selection, refresh behavior, and secret-safe failure handling.

### Modified Capabilities

None.

## Impact

The change affects native quota options, shared provider exports and summary types, quota composition and provider-ID mapping, a new OpenCode Go adapter, focused tests, documentation, and the built/deployed quota artifact. It depends on an undocumented OpenCode console server-query contract and requires users to keep a console session cookie in local uncommitted TUI configuration. It does not change inference requests, OpenCode account settings, provider authentication managed by OpenCode, or token-report calculations.
