## Context

The quota TUI currently instantiates Z.AI and OpenAI adapters behind a shared reactive provider interface. OpenCode Go already has known runtime IDs in token metadata, but it has no quota adapter or selection mapping. OpenCode documents 5-hour, weekly, and monthly monetary limits, while its API-key inference endpoints expose no documented usage endpoint or quota headers. The authenticated console obtains exact usage through the private `lite.subscription.get` server query.

The provider must therefore consume a private console contract using a workspace ID and browser session cookie supplied through native local options. This creates compatibility and secret-storage risks that must be isolated from semantic mapping and aggregate composition.

## Goals / Non-Goals

**Goals:**
- Retrieve exact OpenCode Go rolling, weekly, and monthly usage from the authenticated console.
- Present 5H, 7D, and 1M remaining percentages and reset times through the existing semantic quota panel.
- Participate in active-provider selection, configurable polling, stale handling, reset-boundary refresh, percentage modes, and progress coloring.
- Fail closed on invalid configuration, authentication, or response shape without exposing the configured cookie.
- Keep the private transport replaceable if OpenCode later publishes a supported usage API.

**Non-Goals:**
- Discovering or decrypting browser cookies automatically.
- Estimating quota from local message history.
- Managing subscriptions, workspaces, balance fallback, regions, or account settings.
- Changing inference requests, OpenCode-managed API keys, token reports, or upstream OpenCode behavior.

## Decisions

### Isolate the private console transport

Add a dedicated OpenCode Go provider with separate transport, response validation, semantic mapping, and reactive adapter layers. The first implementation task captures the current `lite.subscription.get` request contract with sanitized evidence before production transport code is written. Tests use fixtures containing no real credentials.

This is preferred over page scraping because structured data preserves `usagePercent` and `resetInSec` without depending on localized HTML. It is preferred over local reconstruction because console data includes usage from other clients and devices.

### Configure the console session through native options

Add `openCodeGo.workspaceId` and `openCodeGo.cookie` options. The cookie is the complete console `Cookie` request-header value and remains in local `.opencode/tui.json`; it is never logged, serialized into reports, or copied into tests. Requests use a fixed `https://opencode.ai` origin and do not accept a configurable destination.

This follows the explicit configuration choice and avoids browser-specific cookie discovery. The documentation will warn that the option stores a plaintext session secret and must not be committed.

### Map console usage into the existing provider contract

Map `rollingUsage`, `weeklyUsage`, and `monthlyUsage` to 5H, 7D, and 1M progress/timer pairs. Console used percentages become remaining percentages before entering composition, and reset epochs are derived from the server-provided `resetInSec`. The home summary uses 5H as primary and 7D as secondary; the expanded panel includes all three windows.

The provider reports runtime ID `opencode-go`, while selection maps both `opencode-go` and `opencode-go-subscription` to it. No renderer-specific branch is added.

### Reuse polling and lifecycle semantics

The provider uses the normalized shared refresh interval, immediately refreshes when selected, serializes overlapping requests, schedules reset-boundary refreshes, updates countdowns once per second, and cancels work on disposal. Transient network and server failures retain last-known data as stale until the existing stale horizon expires. Authentication, redirect-to-login, malformed-response, and workspace failures clear quota and expose a configuration-required or unavailable state.

This keeps adapter behavior consistent with existing providers while distinguishing recoverable transport failures from invalid credentials.

## Risks / Trade-offs

- [The private SolidStart query protocol changes] -> Keep it behind one transport function, validate every response, fail closed, and cover the captured contract with fixtures.
- [A plaintext browser cookie is stored in native options] -> Document local-only storage, prohibit logging and committed examples, and test diagnostic redaction.
- [Frequent polling places load on an internal console endpoint] -> Reuse the user-configurable shared interval, serialize requests, and avoid polling when configuration is absent.
- [The session expires or references the wrong workspace] -> Clear current quota and show configuration required instead of displaying fabricated or indefinitely cached values.
- [Server reset values drift during request latency] -> Derive epochs at response receipt and refresh at the next reported boundary.

## Migration Plan

Add the optional provider without changing existing Z.AI or OpenAI configuration. Document local OpenCode Go options, build and deploy the three plugin artifacts, then validate with a real uncommitted console session. Rollback removes the OpenCode Go adapter registration and repeats local deployment; existing providers remain unaffected.

## Open Questions

- The exact current SolidStart request URL, method, headers, and payload for `lite.subscription.get` must be recorded by the implementation contract spike before transport code is accepted.
