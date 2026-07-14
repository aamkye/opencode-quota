## Context

The semantic panel model is correct in broad shape, but the mounted renderer converts it into pre-sized 80-cell strings before OpenTUI knows the sidebar width. The aggregate also flattens provider items in a way that loses window grouping and provider status placement. The fix must preserve the shared-computation boundary and continue loading from the three local built artifacts.

## Goals / Non-Goals

**Goals:**
- Let OpenTUI flex layout size headers, bars, percentages, and status cells against the actual sidebar width.
- Preserve deterministic pure layout normalization for unit tests while ensuring mounted rows do not depend on a guessed width.
- Keep quota-window detail rows together and order windows by their API-reported duration.
- Expose progress color enablement and thresholds through native plugin options.

**Non-Goals:**
- Changing provider authentication, endpoints, quota arithmetic, reset calculations, or token reports.
- Adding new providers or keyboard interaction.
- Replacing the semantic presentation framework.

## Decisions

### Use flex layout for mounted width allocation

Mounted panel headers and progress rows will use fixed marker/percentage cells and a `flexGrow` middle region. The progress bar's filled and empty sections will use proportional zero-basis flex children, so OpenTUI computes their actual widths from the parent. Pure normalization keeps an explicit width input for deterministic tests, but production JSX will no longer receive a hard-coded 80-cell accessor.

This is preferred over terminal-dimension arithmetic because the sidebar width is not exposed by slot props and is not equivalent to terminal width.

### Preserve window groups during aggregate ordering

Composition will sort provider items into a preamble plus progress-led window groups. Known durations sort shortest-first, unknown/tool groups follow in source order, and timer/quantity/table rows stay attached to their progress item. This preserves provider headers at the top and tool usage details at the bottom.

This is preferred over sorting individual items by parsed labels because individual sorting separates detail rows from their owning window.

### Derive OpenAI labels from API duration

OpenAI window labels and stable IDs will be derived from `limit_window_seconds`, using hour/day/month units where exact and a compact duration fallback otherwise. No primary/secondary position will imply `5H` or `7D`.

### Reuse semantic statuses for color

Composition will assign each displayed progress value an `error`, `warning`, or `success` status based on configured remaining-percentage thresholds. `progressColors.enabled` defaults to true; `warningBelow` defaults to 30 and `errorBelow` defaults to 10. Invalid values fall back to defaults, and error is clamped not to exceed warning. Disabling colors omits progress status while preserving layout.

Provider header details continue to carry their own semantic status, allowing Z.AI Peak/Off-Peak to align independently at the right edge.

Only the filled bar segment and percentage receive the threshold status. The label stays neutral and the empty bar uses the muted theme color. Thresholds always evaluate remaining quota, including when the panel displays used percentage.

### Refresh from the active session model

Native options expose `refreshIntervalSeconds`, defaulting to 10. The quota entry normalizes invalid or non-positive values to the default and passes milliseconds into both provider adapters. Provider polling uses this interval while countdown rendering continues on its one-second clock and reset-boundary refreshes remain immediate.

The sidebar stores its current session ID in a signal. Composition resolves the active provider from the latest user message's selected model/provider, then falls back to configured/provider state. A selection change refreshes that adapter and moves its provider group above `Other providers`; the panel does not display the model name.

## Risks / Trade-offs

- [OpenTUI text flex behavior differs across host versions] -> Use only documented percentage/flex properties supported by the installed version and cover mounted JSX shape plus production build activation.
- [Dynamic duration labels create unfamiliar units] -> Prefer exact common units and test 5H, 7D, and longer primary-only windows.
- [Threshold options could be inverted or invalid] -> Normalize all values into 0-100 and enforce `errorBelow <= warningBelow`.
- [Ten-second polling increases provider traffic] -> Keep the interval configurable and preserve timeout, lifecycle cleanup, and reset-boundary controls.

## Migration Plan

Build and deploy the three local artifacts with `npm run deploy:local`, then fully restart OpenCode. Rollback is the previous plugin commit and a repeated local deployment.

## Open Questions

None.
