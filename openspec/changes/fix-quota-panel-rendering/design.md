## Context

The semantic panel model is correct in broad shape, but the mounted renderer converts it into pre-sized 80-cell strings before OpenTUI knows the sidebar width. The aggregate also flattens provider items in a way that loses window grouping and provider status placement. The fix must preserve the shared-computation boundary and continue loading from the three local built artifacts.

## Goals / Non-Goals

**Goals:**
- Let OpenTUI flex layout size headers, bars, percentages, and status cells against the actual sidebar width.
- Keep mounted compact tables within the actual sidebar width without using the deterministic fallback allocation.
- Preserve deterministic pure layout normalization for unit tests while ensuring mounted rows do not depend on a guessed width.
- Keep quota-window detail rows together and order windows by their API-reported duration.
- Expose progress color enablement and thresholds through native plugin options.
- Make credential replacement and provider disposal safe for in-flight OpenAI and Z.AI requests.

**Non-Goals:**
- Changing provider authentication, endpoints, quota arithmetic, reset calculations, or token reports.
- Adding new providers or keyboard interaction.
- Replacing the semantic presentation framework.

## Decisions

### Use flex layout for mounted width allocation

Mounted panel headers and progress rows will use fixed marker/percentage cells and a `flexGrow` middle region. The progress bar's filled and empty sections will use proportional zero-basis flex children, so OpenTUI computes their actual widths from the parent. Pure normalization keeps an explicit width input for deterministic tests, but production JSX will no longer receive a hard-coded 80-cell accessor.

This is preferred over terminal-dimension arithmetic because the sidebar width is not exposed by slot props and is not equivalent to terminal width.

Mounted compact tables will bypass deterministic fixed-cell allocation. Each mounted table row will use parent-width flex layout with shrinkable, clipped, non-wrapping cells. Pure `renderPanelLayout()` retains explicit allocations for deterministic tests; only production JSX avoids the fallback width.

### Preserve window groups during aggregate ordering

Composition will sort provider items into a preamble plus progress-led window groups. Known durations sort shortest-first, unknown/tool groups follow in source order, and timer/quantity/table rows stay attached to their progress item. This preserves provider headers at the top and tool usage details at the bottom.

This is preferred over sorting individual items by parsed labels because individual sorting separates detail rows from their owning window.

Items are sorted by semantic `order` before partitioning. Provider panel groups are processed independently and assigned separate aggregate order ranges before concatenation, preventing a later group's preamble or detail rows from being absorbed into an earlier progress-led group.

### Derive OpenAI labels from API duration

OpenAI window labels and stable IDs will be derived from `limit_window_seconds`, using hour/day/month units where exact and a compact duration fallback otherwise. No primary/secondary position will imply `5H` or `7D`.

### Reuse semantic statuses for color

Composition will assign each displayed progress value an `error`, `warning`, or `success` status based on configured remaining-percentage thresholds. `progressColors.enabled` defaults to true; `warningBelow` defaults to 30 and `errorBelow` defaults to 10. Invalid values fall back to defaults, and error is clamped not to exceed warning. Disabling colors omits progress status while preserving layout.

Provider header details continue to carry their own semantic status, allowing Z.AI Peak/Off-Peak to align independently at the right edge.

Only the filled bar segment and percentage receive the threshold status. The label stays neutral and the empty bar uses the muted theme color. Thresholds always evaluate remaining quota, including when the panel displays used percentage.

Timer and standalone quantity rows are subordinate metadata, so the mounted renderer uses `textMuted` when they do not carry an explicit semantic status. An explicit status still overrides that default. Keeping this default in the renderer applies the same hierarchy to reset rows from every provider and to Z.AI tool usage without duplicating presentation policy in each adapter.

Short group dividers are subordinate framing rather than content. Their two `---` text ends use the same `textMuted` theme color while the flexible middle remains empty, preserving the responsive divider width and visual hierarchy.

### Refresh from the active session model

Native options expose `refreshIntervalSeconds`, defaulting to 10. The quota entry normalizes invalid or non-positive values to the default and passes milliseconds into both provider adapters. Non-exhausted provider polling uses this interval while exhausted primary quota retains its five-minute backoff. Countdown rendering continues on its one-second clock and reset-boundary refreshes remain immediate.

The sidebar stores its current session ID in a signal. Composition resolves the active provider from the latest user message's selected model/provider, then falls back to configured/provider state. A selection change refreshes that adapter and moves its provider group above `Other providers`; the panel does not display the model name.

### Own request cancellation at the adapter boundary

OpenAI and Z.AI adapters will own the active request controller and a credential generation. Replacing a non-empty credential marks existing quota stale, invalidates and aborts the old request, and starts exactly one request for the replacement. Responses captured under an older generation cannot publish state. Replacement success publishes new ready data; replacement failure retains the prior data as stale.

Removing a credential clears prior account data and moves the adapter to unavailable. Provider disposal aborts the active request immediately and clears its timeout; existing disposed/generation guards continue preventing late state mutation. This localized ownership is preferred over a shared refresh coordinator because the two adapters retain different authentication discovery and fallback state machines.

## Risks / Trade-offs

- [OpenTUI text flex behavior differs across host versions] -> Use only documented percentage/flex properties supported by the installed version and cover mounted JSX shape plus production build activation.
- [Dynamic duration labels create unfamiliar units] -> Prefer exact common units and test 5H, 7D, and longer primary-only windows.
- [Threshold options could be inverted or invalid] -> Normalize all values into 0-100 and enforce `errorBelow <= warningBelow`.
- [Ten-second polling increases provider traffic] -> Keep the interval configurable and preserve timeout, lifecycle cleanup, and reset-boundary controls.
- [A replaced credential can race an old response] -> Abort the old request and require a matching credential generation before publishing.
- [Mounted table cells can overflow narrow parents] -> Use clipped non-wrapping flex cells and cover three-column contraction in mounted tests.

## Migration Plan

Build and deploy the three local artifacts with `npm run deploy:local`, then fully restart OpenCode. Rollback is the previous plugin commit and a repeated local deployment.

## Open Questions

None.
