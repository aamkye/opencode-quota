---
comet_change: fix-quota-panel-rendering
role: technical-design
canonical_spec: openspec
---

# Quota Panel Rendering Design

## Context

The aggregate quota panel converts semantic models into fixed 80-cell rows before OpenTUI lays out the sidebar. A narrower parent clips percentages, collapsed summaries, and provider status cells while leaving long bars. Independent item sorting separates quota detail rows from their windows, and OpenAI assigns labels by response position instead of API duration.

The plugin also polls providers every 60 seconds with constants inside each adapter. It derives provider priority from the provider list rather than the active sidebar session's selected model.

## Goals

- Render headers and progress rows against the actual parent width.
- Restore title spacing, top divider, reset indentation, visible percentages, colored summaries, and right-aligned provider status.
- Keep provider window details together and label OpenAI windows by duration.
- Configure progress colors and provider polling through native plugin options.
- Refresh and prioritize the provider selected by the active session model.

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
- Timer: fixed three-cell indent followed by muted timer text without the redundant window label.
- Standalone quantity: muted label and value unless the item carries an explicit semantic status.

The bar uses two zero-basis flex children. Their grow factors match filled and remaining percentages, so OpenTUI allocates glyph width from the parent. The filled child renders `█` with the threshold color; the empty child renders `░` with `textMuted`.

The renderer inserts a parent-width divider immediately after the panel header. Group dividers remain at group boundaries. Pure normalization keeps explicit widths for deterministic tests, but production JSX does not use those widths to size mounted headers or bars.

## Provider Item Grouping

Composition starts from provider items sorted by semantic order. It partitions them into:

1. Preamble items before the first progress item.
2. Progress-led groups containing that progress item and its following timer, quantity, text, or table details.

Known duration groups sort shortest-first. Unknown groups, including Z.AI tool quota, follow in source order. This keeps provider headers at the top, reset/absolute rows with their windows, and tool usage at the bottom.

Composition applies display mode and progress status after grouping. Disabled colors omit progress status. The selected provider's compact summary continues to supply the collapsed panel percentage and status.

## Provider Mapping

OpenAI derives labels from `limit_window_seconds`. Exact hour, day, week, and 30-day values produce compact labels such as `5H`, `7D`, and `1M`; other durations use the largest exact supported unit or a compact fallback. Stable item IDs derive from duration plus response role so one weekly primary window produces only a `7D` group.

Z.AI maps current Peak/Off-Peak text and semantic status into its header detail. The renderer aligns that detail at the right edge. The existing collapsed summary remains available for home and panel summaries.

## Refresh And Selection Flow

The quota entry normalizes options before constructing adapters and passes `refreshIntervalMs` into both constructors. Each adapter uses it for non-exhausted polling. Exhausted primary quota retains the existing five-minute backoff. Adapters preserve their immediate initial fetch, timeout, stale expiry, one-second state clock, reset-boundary timer, and lifecycle cleanup.

The sidebar slot writes `session_id` into a Solid signal. A memo reads that session's messages and scans newest-to-oldest for the latest user message with a model provider ID. The existing provider-ID mapping resolves native IDs such as `zai-coding-plan`, `openai`, `codex`, and `chatgpt` to adapter IDs. Configured/provider state remains the fallback.

A Solid effect watches the resolved adapter ID. On change, it calls that adapter's `refresh()` once. The aggregate memo consumes the same ID, so the refreshed provider moves to the first group and all other ready/stale providers remain under `Other providers`.

## Error Handling

- Invalid option values fall back without preventing plugin activation.
- Missing sessions, messages, or model metadata use provider-state fallback.
- Unsupported selected providers do not displace supported quota providers.
- A failed selection-triggered refresh follows each adapter's existing stale/unavailable behavior.
- Lifecycle cleanup clears polling and renderer timers.

## Testing

TDD starts with focused failing tests:

- Pure layout and mounted tests assert marker spacing, top divider, three-cell bar start, responsive flex structure, visible percentage, muted timer/quantity metadata, colored summary, and right-aligned provider detail.
- Composition tests assert progress statuses, colors disabled, custom thresholds, remaining-quota semantics in used mode, progress-led grouping, and tool details at the bottom.
- OpenAI tests assert duration-derived labels for weekly-only and multi-window responses. Z.AI tests assert semantic Peak/Off-Peak header detail.
- Controlled-timer adapter tests assert the 10-second default and custom polling interval.
- Session-model tests assert provider fallback, immediate refresh on provider change, and selected-provider reordering without model-name output.

Verification runs focused tests, `npm run typecheck`, `npm test`, `npm run build`, built-artifact activation checks, and `npm run deploy:local`. Manual OpenCode checks cover normal and constrained widths, collapse, provider switching, polling, weekly-only OpenAI data, and Z.AI status/tool placement.

## Risks

- OpenTUI text flex behavior can vary by host version. Typechecking, mounted fixtures, artifact activation, and constrained-width manual validation cover the installed host.
- Ten-second polling increases API traffic. Users can raise the interval; existing timeout and lifecycle controls remain in place.
- Session model metadata may be unavailable before the first user message. Provider-state fallback keeps the panel stable until metadata appears.
