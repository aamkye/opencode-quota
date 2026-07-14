## Why

The deployed quota panel renders against a fixed 80-cell assumption and loses semantic layout information while composing provider models. This causes clipped percentages and summaries, oversized uncolored bars, misplaced rows, inaccurate OpenAI window labels, and missing right-aligned Z.AI status information.

## Root Cause

- `PanelRenderer` receives a hard-coded width of 80 and precomputes fixed-width text rows that the narrower sidebar clips.
- Header, timer, divider, and provider-header details are flattened without the spacing and alignment required by the panel contract.
- Aggregate composition re-sorts non-window items ahead of window groups and discards provider collapsed-summary status.
- OpenAI labels its primary response window as `5H` instead of deriving the duration from `limit_window_seconds`.
- Progress items do not receive semantic percentage status, and native options do not expose color enablement or thresholds.

## What Changes

- Make quota rows responsive to the actual parent layout, with the bar beginning after the three-cell label and the percentage fixed at the right edge.
- Restore panel-header spacing, the divider below `Quota`, indented reset rows, collapsed summaries, and right-aligned provider status.
- Keep each provider's auxiliary rows after its quota windows and derive OpenAI window labels from API durations.
- Add native TUI options for enabling progress colors and configuring warning/error percentage thresholds.
- Add a configurable provider polling interval with a 10-second default, and refresh/reorder quota providers when the active session model changes.

## Capabilities

### New Capabilities
- `quota-panel-rendering`: Responsive quota panel layout, provider window/status presentation, and configurable progress coloring.

### Modified Capabilities

None.

## Impact

The change affects the presentation contract and renderer, aggregate quota composition and options, provider polling intervals, OpenAI/Z.AI semantic mapping, focused presentation/provider tests, built plugin artifacts, and local deployment output. It does not change provider API endpoints, authentication, quota arithmetic, or token-report behavior.
