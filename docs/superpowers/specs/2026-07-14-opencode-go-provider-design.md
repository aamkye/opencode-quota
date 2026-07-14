---
comet_change: add-opencode-go-provider
role: technical-design
canonical_spec: openspec
---

# OpenCode Go Quota Provider Technical Design

## Context

The quota sidebar composes provider-specific adapters through `QuotaProviderAdapter`. Z.AI and OpenAI already supply semantic `PanelModel` data, compact home summaries, freshness, polling, reset-boundary refresh, and lifecycle cleanup. `tui/quota.tsx` selects the adapter associated with the latest user model and renders all providers through the shared panel renderer.

OpenCode Go uses provider ID `opencode-go` and publishes three monetary limits: $12 per rolling 5 hours, $30 per week, and $60 per subscription month. Its inference API key authenticates model requests but exposes no documented quota endpoint or quota response headers. The authenticated Go workspace page embeds exact `lite.subscription.get` percentages and reset durations in Solid hydration assignments.

This design adds one provider without changing the renderer or refactoring the existing adapters. The OpenSpec delta spec remains the canonical behavior contract.

## Constraints

- Exact usage must come from the three named hydration records, not visible localized text or local estimates.
- The hydration markup is undocumented and can change independently of this plugin.
- The existing local option shape is `quota.opencodego.{workspaceId, workspaceToken}`.
- The destination is fixed to `https://opencode.ai`; configuration cannot redirect the auth token elsewhere.
- The implementation must fit the existing shared-computation and three-artifact build boundary.
- Real credentials and captured secret values must never enter Git, reports, fixtures, diagnostics, or test output.

## Contract-Capture Gate

Implementation starts by sanitizing the current authenticated Go page contract. The capture records only:

- fixed GET URL shape
- required non-secret request headers and `auth` cookie name
- bounded Solid assignment shapes for `rollingUsage`, `weeklyUsage`, and `monthlyUsage`
- synthetic `usagePercent` and `resetInSec` values at their observed positions
- authentication failure and login redirect behavior

The sanitized request manifest and minimal hydration/error fixtures are committed under `tests/fixtures/opencode-go/`. Workspace IDs, tokens, unrelated page content, account identifiers, and real usage values are replaced with obvious test values before commit.

Production parser code does not begin until a focused contract test can decode all three named hydration records atomically from the sanitized fixture. If the bounded assignment shapes cannot be reproduced, the change stops as blocked. It does not parse visible page text, execute page scripts, or reconstruct local costs.

## Architecture

### Dedicated provider module

Add `tui/providers/opencode-go.ts` with four internal boundaries:

1. Configuration validation
2. Authenticated page request and response classification
3. Bounded hydration extraction and semantic quota mapping
4. Reactive adapter lifecycle

Keeping these concerns in one provider module follows the existing provider organization while allowing hydration extraction to be replaced independently. A generic polling-base refactor would increase the blast radius without helping the page contract.

### Native options

Extend the quota option shape:

```ts
type OpenCodeGoOptions = {
  workspaceId?: string
  workspaceToken?: string
}

type QuotaPluginOptions = {
  refreshIntervalSeconds?: number
  progressColors?: ProgressColorOptions
  otherProviders?: Pick<QuotaCompositionOptions, "percentageMode" | "sortDirection">
  quota?: {
    opencodego?: OpenCodeGoOptions
  }
}
```

Normalization produces either an immutable valid configuration or `null`:

```ts
type OpenCodeGoConfig = {
  workspaceId: string
  workspaceToken: string
}
```

A workspace ID must match `^wrk_[A-Za-z0-9]+$`. The workspace token must be non-empty after trimming and must not contain CR or LF characters. Validation returns no value derived from either credential and does not log rejected input.

The user-facing configuration lives only in the local `.opencode/tui.json` entry. Documentation uses placeholders and explicitly warns that `workspaceToken` is a plaintext `auth` cookie value, must not be committed, and must be rotated when the console session expires.

### Transport result

The transport accepts only `OpenCodeGoConfig`, an injected `fetch` implementation for tests, and a timeout signal. It returns a discriminated result without embedding upstream bodies or request values in error messages:

```ts
type OpenCodeGoFetchResult =
  | { kind: "success"; data: OpenCodeGoQuotaData }
  | { kind: "authentication-required" }
  | { kind: "transient-failure" }
  | { kind: "invalid-response" }
```

Request controls:

- fixed `https://opencode.ai` origin
- `GET /workspace/<encoded-workspaceId>/go`
- `Accept: text/html` and `Cookie: auth=<workspaceToken>`
- `redirect: "manual"` to prevent forwarding credentials
- 20-second timeout
- static diagnostic labels only

Response classification:

| Condition | Result |
| --- | --- |
| HTTP 200 page with exactly one valid assignment for every usage record | `success` |
| 401, 403, or login redirect | `authentication-required` |
| Network error, timeout, 408, 429, or 5xx | `transient-failure` |
| Other status, unexpected content type, missing/duplicate assignment, or invalid number | `invalid-response` |

The parser receives the HTML string only; it never receives configuration. For each named record, it finds exactly one bounded Solid assignment, then extracts only `usagePercent` and `resetInSec` without `eval`, `Function`, DOM script execution, or general object-literal conversion. It accepts a snapshot atomically when all values are finite, percentages fall from 0 through 100, and reset seconds are non-negative. No partial snapshot is returned.

### Semantic data model

```ts
type OpenCodeGoWindow = {
  usedPct: number
  remainingPct: number
  resetEpoch: number
}

type OpenCodeGoQuotaData = {
  fiveHour: OpenCodeGoWindow
  weekly: OpenCodeGoWindow
  monthly: OpenCodeGoWindow
}
```

At response receipt, `remainingPct` is `100 - usagePercent`, clamped to 0 through 100. `resetEpoch` is the receipt timestamp plus `resetInSec * 1000`. Keeping both used and remaining values makes the console contract explicit, while provider output always enters composition as remaining quota.

### Panel mapping

The provider's panel title is `OpenCode GO`; its first semantic item uses the exact visible header `OpenCode GO:`. Ready and stale snapshots produce these progress-led groups:

| Label | Progress order | Timer order |
| --- | ---: | ---: |
| 5H | 20 | 30 |
| 7D | 40 | 50 |
| 1M | 60 | 70 |

Each timer uses the existing idle/countdown/expired semantics. A stale marker appears before quota windows. Missing configuration and authentication failure produce a header with `Configuration required`; initial transient or protocol failure produces `Usage unavailable`.

The compact summary reports provider `OpenCode GO`, plan `Subscription`, 5H as primary, and 7D as secondary. Aggregate composition therefore preserves current `remaining`/`used` conversion, threshold coloring, sorting, and collapsed `5H/7D` summary behavior without renderer changes. The monthly window remains visible in expanded content only.

## State And Lifecycle

The adapter uses these internal phases:

```text
configuration-required
          |
          | valid config
          v
       loading ------ success ------> ready
          |                              |
          | transient/invalid            | transient
          v                              v
     unavailable <--- stale expiry ---- stale
          ^                              |
          | auth failure                 | success
          +------------------------------+----> ready
```

Authentication-required results clear current quota immediately and enter `configuration-required`. Invalid hydration markup clears current quota and enters `unavailable`, because protocol drift must not display indefinite cached values. Transient failures retain the last valid snapshot as `stale`; without a snapshot they enter `unavailable`. Stale data expires after the existing 10-minute horizon.

The adapter follows existing scheduling rules:

- refresh immediately after valid construction
- poll using normalized `refreshIntervalSeconds`
- refresh immediately when active-provider selection changes to OpenCode Go
- update `now` once per second for countdown rendering and stale expiry
- schedule one timer for the nearest future reset epoch among all three windows
- serialize requests through one in-flight promise
- if a reset boundary occurs during an older request, remember only the latest pending boundary and refresh once after settlement
- clear all timers, pending boundaries, and state updates during disposal

The provider does not use the exhausted 5-minute backoff because all three windows can independently reset and the approved behavior is the shared polling interval.

## Integration

### Shared boundary

`shared/opencode-tools-shared.ts` exports the provider constructor, semantic mapping helpers needed by tests, and the OpenCode Go summary type. `tui/providers/types.ts` adds an `OpenCodeGoHomeQuotaSummary` member to `HomeQuotaSummary` without changing `QuotaProviderAdapter`.

The combined quota TUI passes both shared refresh options and normalized OpenCode Go configuration to `createOpenCodeGoProvider`. The separate legacy home TUI remains unchanged because its plugin entry has no native options path for the console secret; this change targets the quota sidebar.

### Provider selection

`ADAPTER_ID_BY_PROVIDER_ID` maps both:

```text
opencode-go              -> opencode-go
opencode-go-subscription -> opencode-go
```

The adapter order follows the existing providers, but selected-provider promotion remains authoritative. Ready or stale OpenCode Go data stays under `Other providers` when another provider becomes active.

### Build and test entry points

The presentation compile step gains a `provider-opencode-go` entry so Node tests can import the bundled provider with browser-compatible conditions. Shared-boundary and plugin-build assertions expand to cover the third provider while keeping host-owned Solid external and preserving the three deployed artifacts.

## Error Handling And Secret Safety

- No exception message, console diagnostic, test name, snapshot, report, or status string includes request headers or configuration values.
- Transport errors are reduced to static classifications before state handling.
- Response bodies are not logged, including malformed bodies that might reflect request metadata.
- Redirects are never automatically followed.
- The origin is a source constant, not an option.
- Tests use a sentinel workspace ID and token and fail if either appears in captured diagnostics or thrown messages.
- Real live-validation options remain uncommitted and are restored or removed after testing.

## Testing Strategy

### Contract and configuration

- sanitized request manifest matches the implemented GET URL, required headers, cookie name, and redirect mode
- nested workspace and token normalization accepts valid placeholders
- missing, blank, malformed, or CR/LF-bearing input disables requests
- destination cannot be overridden
- sentinel credentials never appear in diagnostics or errors

### Transport and parsing

- minimal hydration fixture decodes all three named assignments atomically
- 401, 403, and login redirects classify as authentication required
- network, timeout, 408, 429, and 5xx classify as transient
- missing/duplicate assignments, nested-object tricks, oversized captures, percentages outside 0..100, and negative reset seconds classify as invalid
- no test fixture contains a real workspace, token, account value, or unrelated page content

### Mapping and lifecycle

- 5H, 7D, and 1M progress/timer rows have stable IDs, order, remaining values, and reset epochs
- ready, stale, configuration-required, and unavailable panels match the semantic contract
- compact summary uses 5H and 7D
- default and custom polling use fake clocks
- overlapping polls and reset boundaries create no concurrent requests
- nearest-boundary scheduling advances through all three windows
- stale expiry and disposal prevent late state mutation

### Composition and packaging

- both provider IDs select and refresh the adapter
- provider switching preserves other ready/stale providers
- remaining/used modes and threshold colors remain correct
- shared facade owns provider computation; loadable entries retain presentation/registration only
- typecheck, complete suite, production build tests, deployment tests, local deployment, and artifact hash parity pass

### Live validation

With a real uncommitted configuration:

- the three percentages and resets match the OpenCode Go console
- active model switching promotes and refreshes OpenCode Go
- default/custom polling and countdown cadence are observable
- removing or expiring the session shows configuration required
- transient interruption produces bounded stale values
- no terminal output or report contains either local credential

## Rollout And Rollback

The new options and provider are optional. Existing Z.AI and OpenAI behavior is unchanged when OpenCode Go is not configured. After automated gates, deploy the same three local artifacts and restart OpenCode for live validation.

Rollback removes adapter construction and provider aliases, rebuilds, and redeploys. The isolated module and optional configuration leave no persisted data migration.

## Design Completion Criteria

- A sanitized minimal hydration contract fixture exists and passes before parser implementation.
- The provider satisfies every scenario in `openspec/changes/add-opencode-go-provider/specs/opencode-go-quota-provider/spec.md`.
- No visible-text scraper, script execution, or local estimate is introduced.
- No real token or workspace identifier is committed.
- Existing provider, build, and deployment tests remain green.
