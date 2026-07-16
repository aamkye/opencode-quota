## 1. Reproduce Rendering Regressions

- [x] 1.1 Add failing pure and mounted renderer tests for responsive bars, visible right-edge percentages, title spacing, top divider, reset indentation, colored collapsed summary, and right-aligned provider status.
- [x] 1.2 Add failing composition/provider tests for progress statuses, grouped auxiliary rows, Z.AI Peak/Off-Peak placement, and OpenAI duration-derived labels.
- [x] 1.3 Add failing native-option tests for color enablement, custom thresholds, and invalid-value fallback.
- [x] 1.4 Add failing controlled-timer and session-model tests for configurable 10-second polling, immediate selected-provider refresh, and provider reordering.

## 2. Correct Rendering and Mapping

- [x] 2.1 Replace fixed-width mounted header/progress rendering with parent-responsive OpenTUI flex layout and restore panel framing/reset presentation.
- [x] 2.2 Preserve progress-led provider groups during aggregate ordering, carry semantic provider status into right-aligned headers, and derive OpenAI labels from API duration.
- [x] 2.3 Normalize progress color options and apply semantic statuses consistently to bars, percentages, and collapsed summaries.
- [x] 2.4 Pass the normalized polling interval into provider adapters and reactively resolve, refresh, and prioritize the current session model's provider.
- [x] 2.5 Render reset timers and standalone tool quantities with muted text while preserving explicit semantic status overrides.
- [x] 2.6 Render short group-divider marks with the muted theme color.
- [x] 2.7 Render mounted compact tables with parent-responsive clipped non-wrapping flex cells and compose semantically ordered provider items within independent group-local boundaries.
- [x] 2.8 Add compatible segmented provider-header details; present stale OpenAI as warning `stale` and stale Z.AI as colored Peak/Off-Peak, muted ` / `, and warning `stale` with no standalone stale rows; and make credential replacement/removal/disposal plus reset-boundary ownership generation-safe with one replacement request, silent expected aborts, and immediate request/boundary timeout cleanup.
- [ ] 2.9 React to synchronized same-session user-message model changes through the supported TUI event bus even when the host message accessor itself is not reactive, while preserving one refresh per adapter change and lifecycle cleanup.
- [x] 2.10 Make the Z.AI credential-replacement lifecycle regression use its declared fixed clock so Peak/Off-Peak assertions are deterministic across wall-clock verification times.

## 3. Verify and Deploy

- [x] 3.1 Rerun focused segmented-header, responsive-table, group-ordering, credential lifecycle, and generation-owned reset-boundary tests plus typechecking, the full automated suite, and the three-artifact production build.
- [ ] 3.2 Redeploy locally and manually validate normal/collapsed and normal/constrained-width behavior, including the real two-column Z.AI Model/Usage table at 37 cells and exact segmented stale provider headers with no standalone stale rows, in OpenCode.
- [ ] 3.3 Manually revalidate default/custom refresh, active-session provider switching, OpenAI/Z.AI credential replacement/removal, silent expected aborts with retained non-abort diagnostics, and pending-request disposal behavior.
- [x] 3.4 Rebuild, redeploy, and manually validate muted short group dividers.
