---
comet_change: fix-quota-panel-rendering
role: technical-design
canonical_spec: openspec
archived-with: 2026-07-16-fix-quota-panel-rendering
status: final
---

# Quota Panel Rendering Design

## Context

The aggregate quota panel converts semantic models into fixed 80-cell rows before OpenTUI lays out the sidebar. A narrower parent clips percentages, collapsed summaries, and provider status cells while leaving long bars. Independent item sorting separates quota detail rows from their windows, and OpenAI assigns labels by response position instead of API duration.

The plugin also polls providers every 60 seconds with constants inside each adapter. It derives provider priority from the provider list rather than the active sidebar session's selected model.

Final whole-change review found four remaining boundary gaps: mounted tables still consumed the 80-cell fallback, aggregate composition trusted physical item order and flattened provider groups, credential replacement could publish an old in-flight response, and provider disposal did not abort active OpenAI/Z.AI requests.

## Goals

- Render headers and progress rows against the actual parent width.
- Render mounted compact tables within the actual parent width.
- Restore title spacing, top divider, reset indentation, visible percentages, colored summaries, and right-aligned provider status.
- Keep provider window details together and label OpenAI windows by duration.
- Configure progress colors and provider polling through native plugin options.
- Refresh and prioritize the provider selected by the active session model.
- Preserve stale quota safely during credential replacement and abort active requests on disposal.

## Non-Goals

- Change provider endpoints, authentication, quota arithmetic, timeout handling, or reset-boundary behavior.
- Display the selected model name in the quota panel.
- Add providers, keyboard collapse controls, or token-report changes.

## Option Contract

The quota entry accepts these top-level native options:

```json
{
  "refreshIntervalSeconds": 10,
  "progressColors": {
    "enabled": true,
    "errorBelow": 10,
    "warningBelow": 30
  },
  "otherProviders": {
    "percentageMode": "remaining",
    "sortDirection": "desc"
  }
}
```

`refreshIntervalSeconds` accepts positive finite numbers and defaults to 10. `progressColors.enabled` defaults to true. Thresholds normalize into 0-100, and normalization enforces `errorBelow <= warningBelow`. Invalid values use defaults.

Thresholds evaluate remaining quota even when `percentageMode` displays used quota. The filled bar and percentage receive the semantic status. The label uses normal text and the empty segment uses muted text.

## Responsive Renderer

The mounted renderer will stop using a guessed `availableCells` value. OpenTUI receives these row structures:

- Panel header: fixed two-cell marker (`"▼ "` or `"▶ "`), flexible title, fixed summary.
- Progress: fixed three-cell label, flexible bar, one-cell separator, fixed four-cell percentage.
- Provider header: flexible title and fixed right-aligned detail/status.
- Segmented provider header: optional ordered detail segments, each with its own semantic status, rendered at the same right-aligned edge.
- Timer: fixed three-cell indent followed by muted timer text without the redundant window label.
- Standalone quantity: muted label and value unless the item carries an explicit semantic status.

The bar uses two zero-basis flex children. Their grow factors match filled and remaining percentages, so OpenTUI allocates glyph width from the parent. The filled child renders `█` with the threshold color; the empty child renders `░` with `textMuted`.

The renderer inserts a parent-width divider immediately after the panel header. Group dividers remain at group boundaries, with both short `---` ends rendered in `textMuted`. Pure normalization keeps explicit widths for deterministic tests, but production JSX does not use those widths to size mounted headers or bars.

Mounted compact tables also bypass deterministic fixed-cell allocation. Production rows use `width="100%"` with shrinkable, clipped, non-wrapping flex cells so a three-column row contracts with its parent. The pure render model retains `CompactTableAllocation` for deterministic layout tests.

## Provider Item Grouping

Composition starts from provider items sorted by semantic order. It partitions them into:

1. Preamble items before the first progress item.
2. Progress-led groups containing that progress item and its following timer, quantity, text, or table details.

Known duration groups sort shortest-first. Unknown groups, including Z.AI tool quota, follow in source order. This keeps provider headers at the top, reset/absolute rows with their windows, and tool usage at the bottom.

Before partitioning, each panel group's items are sorted by semantic `order`. Each group is partitioned and ordered independently, then concatenated into a provider-specific aggregate range. Group boundaries therefore cannot cause a later preamble or detail item to attach to an earlier window.

Composition applies display mode and progress status after grouping. Disabled colors omit progress status. The selected provider's compact summary continues to supply the collapsed panel percentage and status.

## Provider Mapping

OpenAI derives labels from `limit_window_seconds`. Exact hour, day, week, and 30-day values produce compact labels such as `5H`, `7D`, and `1M`; other durations use the largest exact supported unit or a compact fallback. Stable item IDs derive from duration plus response role so one weekly primary window produces only a `7D` group.

Z.AI maps current Peak/Off-Peak text and semantic status into its header detail. The renderer aligns that detail at the right edge. The existing collapsed summary remains available for home and panel summaries.

Header details retain the existing single-string path and add optional semantic text segments. Stale OpenAI emits one warning-colored `stale` segment. Stale Z.AI emits its colored Peak/Off-Peak segment, a `textMuted` ` / ` separator, and a warning-colored `stale` segment. Neither provider emits the previous standalone `~stale` row.

## Refresh And Selection Flow

The quota entry normalizes options before constructing adapters and passes `refreshIntervalMs` into both constructors. Each adapter uses it for non-exhausted polling. Exhausted primary quota retains the existing five-minute backoff. Adapters preserve their immediate initial fetch, timeout, stale expiry, one-second state clock, reset-boundary timer, and lifecycle cleanup.

The sidebar slot writes `session_id` into a Solid signal. A memo reads that session's messages and scans newest-to-oldest for the latest user message with a model provider ID. The existing provider-ID mapping resolves native IDs such as `zai-coding-plan`, `openai`, `codex`, and `chatgpt` to adapter IDs. Configured/provider state remains the fallback.

A Solid effect watches the resolved adapter ID. On change, it calls that adapter's `refresh()` once. The aggregate memo consumes the same ID, so the refreshed provider moves to the first group and all other ready/stale providers remain under `Other providers`.

## Credential And Request Lifecycle

Each OpenAI/Z.AI adapter owns its active abort controller and credential generation. Replacing a non-empty credential while quota exists immediately marks that quota stale, aborts and invalidates the old request, and starts one replacement request. Only a response whose captured generation still matches may publish. Success replaces stale data and returns to ready; failure leaves the previous quota stale.

Credential removal clears the prior account's quota and moves the provider to unavailable. Disposal aborts the active request and clears its timeout immediately. The existing disposed guard remains a second boundary against late fulfillment or rejection.

Abort is an expected control-flow result for credential replacement, timeout ownership, and disposal. Fetch helpers return without logging an error when their signal is aborted; non-abort transport and parsing failures retain existing diagnostics.

## Error Handling

- Invalid option values fall back without preventing plugin activation.
- Missing sessions, messages, or model metadata use provider-state fallback.
- Unsupported selected providers do not displace supported quota providers.
- A failed selection-triggered refresh follows each adapter's existing stale/unavailable behavior.
- Credential replacement failures retain previous quota as stale; removed credentials clear it.
- Lifecycle cleanup aborts active requests and clears request, polling, and renderer timers.

## Testing

TDD starts with focused failing tests:

- Pure layout and mounted tests assert marker spacing, top divider, muted short group dividers, three-cell bar start, responsive flex structure, visible percentage, muted timer/quantity metadata, colored summary, and right-aligned provider detail.
- Mounted tests assert a three-column table contracts through clipped, non-wrapping flex cells without the fallback allocation.
- Composition tests assert progress statuses, colors disabled, custom thresholds, remaining-quota semantics in used mode, progress-led grouping, and tool details at the bottom.
- Composition tests physically shuffle semantic item order and use multiple provider groups to prove partitioning remains group-local.
- OpenAI tests assert duration-derived labels for weekly-only and multi-window responses. Z.AI tests assert semantic Peak/Off-Peak header detail.
- Provider and mounted tests assert right-aligned segmented stale headers: OpenAI warning `stale`, and Z.AI colored Peak/Off-Peak plus muted separator plus warning `stale`, with no standalone stale row.
- Controlled-timer adapter tests assert the 10-second default and custom polling interval.
- Deferred-request tests replace credentials mid-flight and verify stale transition, old-generation suppression, one replacement request, failure retention, and credential removal for both providers.
- Disposal tests leave requests unresolved and assert immediate signal abortion, cleared timeouts, and inert late settlement.
- Session-model tests assert provider fallback, immediate refresh on provider change, and selected-provider reordering without model-name output.

Verification runs focused tests, `npm run typecheck`, `npm test`, `npm run build`, built-artifact activation checks, and `npm run deploy:local`. Manual OpenCode checks cover normal and constrained widths, collapse, provider switching, polling, weekly-only OpenAI data, and Z.AI status/tool placement.

## Risks

- OpenTUI text flex behavior can vary by host version. Typechecking, mounted fixtures, artifact activation, and constrained-width manual validation cover the installed host.
- Ten-second polling increases API traffic. Users can raise the interval; existing timeout and lifecycle controls remain in place.
- Session model metadata may be unavailable before the first user message. Provider-state fallback keeps the panel stable until metadata appears.
- Credential replacement can race old responses. Abort ownership plus generation checks prevent cross-account publication while preserving stale display semantics.

## Implementation Divergence

Final review and restarted-host validation exposed three cross-layer assumptions that
were not represented in the original design. The validated implementation keeps the
specified behavior while changing these internal boundaries:

- **Submitted-model selection uses the public user event payload.** OpenCode can
  deliver `message.updated` before `api.state.session.messages()` exposes the new
  message. The selection root therefore records only the active event's session and
  provider IDs and resolves them through the existing adapter/fallback mapping. An
  actual session change clears that event selection. Initial selection still scans
  synchronized messages, and unsent prompt-model selection remains unavailable
  because the public TUI API does not expose it.
- **Collapsed quota uses a semantic provider summary.** OpenAI and Z.AI deliberately
  hide stale data from the legacy home-slot accessor while retaining it in the quota
  panel. Their optional `quotaSummary` accessor supplies the aggregate with current
  or retained percentages independently of home-slot visibility, preserving stale
  collapsed summaries and OpenCode GO's existing fallback path.
- **Exhausted polling is credential-generation owned.** Retained quota from a
  replaced credential remains visible as stale, but it can select the five-minute
  exhausted backoff only when it belongs to the current credential generation. A
  failed first request for replacement credentials retries at the configured/default
  interval instead of inheriting the old account's exhausted state.
- **The aggregate secondary-provider header is subordinate metadata.** The stable
  `other-providers` group marker and title use `textMuted`; ordinary group headers
  retain their existing foreground behavior.
