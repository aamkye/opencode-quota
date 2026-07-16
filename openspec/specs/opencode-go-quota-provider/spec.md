# opencode-go-quota-provider Specification

## Purpose
TBD - created by archiving change add-opencode-go-provider. Update Purpose after archive.
## Requirements
### Requirement: Native OpenCode Go configuration
The quota plugin SHALL accept an optional OpenCode Go console workspace ID and auth-cookie value through `quota.opencodego.workspaceId` and `quota.opencodego.workspaceToken`, SHALL use those values only for the fixed `https://opencode.ai` console origin, and SHALL never expose either value through logs, errors, reports, or committed examples.

#### Scenario: Valid local configuration
- **WHEN** `quota.opencodego.workspaceId` and `quota.opencodego.workspaceToken` are both non-empty valid values
- **THEN** the provider may query the configured workspace's authenticated Go usage
- **AND** it does not duplicate or replace the OpenCode-managed inference API key

#### Scenario: Missing configuration
- **WHEN** either OpenCode Go option is absent or invalid
- **THEN** no console request is sent
- **AND** the quota aggregate SHALL exclude the OpenCode Go provider from selected and inactive provider rendering

#### Scenario: Secret-safe diagnostics
- **WHEN** configuration, transport, parsing, or authentication fails
- **THEN** no diagnostic or returned error contains any part of the configured workspace ID or token

### Requirement: Exact console usage retrieval
The provider SHALL fetch the authenticated OpenCode Go workspace page, extract only the named Solid hydration assignments for `rollingUsage`, `weeklyUsage`, and `monthlyUsage`, and validate all three records before accepting them.

#### Scenario: Successful usage response
- **WHEN** the authenticated page contains all three named hydration records with finite `usagePercent` and `resetInSec` values
- **THEN** the provider accepts all three records as one atomic quota snapshot

#### Scenario: Authentication expires
- **WHEN** the page request returns an authentication failure or a manual redirect to login
- **THEN** the provider discards current quota values
- **AND** it displays `Configuration required`

#### Scenario: Response is malformed
- **WHEN** the page is HTML without the expected hydration contract or any required usage record or numeric field is missing, non-finite, duplicated, or outside its accepted range
- **THEN** the provider rejects the complete response
- **AND** it does not fabricate a partial quota snapshot

### Requirement: Three-window semantic presentation
The provider SHALL map console usage into 5H, 7D, and 1M semantic quota windows in that order, using remaining percentages and server-reported reset durations.

#### Scenario: Ready OpenCode Go quota
- **WHEN** a valid snapshot reports rolling, weekly, and monthly used percentages
- **THEN** the expanded panel renders `OpenCode GO:` followed by 5H, 7D, and 1M progress rows
- **AND** each progress row is followed by a reset row derived from its `resetInSec`
- **AND** each remaining percentage equals 100 minus its console used percentage, clamped to 0 through 100

#### Scenario: Global percentage mode is used
- **WHEN** the native quota option requests used-percentage display
- **THEN** aggregate composition displays the original console used percentages
- **AND** progress color thresholds continue to evaluate remaining percentages

#### Scenario: Collapsed active summary
- **WHEN** OpenCode Go is the active ready provider and the quota panel is collapsed
- **THEN** the header displays colored 5H and 7D summary percentages at the right edge

### Requirement: OpenCode Go provider selection
The quota aggregate SHALL recognize OpenCode Go runtime provider IDs, refresh the adapter when it becomes active, and prioritize its group without hiding other ready providers.

#### Scenario: Canonical provider ID selected
- **WHEN** the latest user model uses provider ID `opencode-go`
- **THEN** the OpenCode Go adapter refreshes immediately
- **AND** its quota group appears before `Other providers`

#### Scenario: Subscription alias selected
- **WHEN** provider state or the latest user model uses provider ID `opencode-go-subscription`
- **THEN** selection resolves to the same OpenCode Go adapter

#### Scenario: Another provider becomes active
- **WHEN** the latest user model changes from OpenCode Go to another supported provider
- **THEN** the newly selected provider moves first
- **AND** ready or stale OpenCode Go values remain visible under `Other providers`

### Requirement: Refresh and lifecycle behavior
The provider SHALL use the normalized shared refresh interval, serialize overlapping requests, refresh at reported reset boundaries, update countdown text once per second, and stop all work after disposal.

#### Scenario: Default and custom polling
- **WHEN** OpenCode Go configuration is valid
- **THEN** polling uses the same default or custom `refreshIntervalSeconds` value as the other quota providers

#### Scenario: Request overlaps a poll or reset boundary
- **WHEN** a refresh remains in flight as another refresh trigger occurs
- **THEN** the provider starts no concurrent request
- **AND** it performs at most one queued boundary refresh after the request settles

#### Scenario: Provider is disposed
- **WHEN** plugin lifecycle disposal occurs
- **THEN** all polling, countdown, boundary timers, and pending state updates stop

### Requirement: Bounded stale and failure states
The provider SHALL distinguish transient console failures from invalid configuration or authentication and SHALL retain last-known quota only within the existing stale horizon.

#### Scenario: Transient failure after success
- **WHEN** a network or server failure occurs after a valid snapshot
- **THEN** the provider retains the snapshot with a `~stale` indicator
- **AND** later polling may restore ready state

#### Scenario: Stale horizon expires
- **WHEN** no valid snapshot arrives before the stale horizon expires
- **THEN** the provider removes the stale quota values
- **AND** it displays usage unavailable

#### Scenario: Initial transient failure
- **WHEN** the first configured console request fails transiently
- **THEN** the provider displays usage unavailable without quota values
