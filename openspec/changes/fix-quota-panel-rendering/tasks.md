## 1. Reproduce Rendering Regressions

- [ ] 1.1 Add failing pure and mounted renderer tests for responsive bars, visible right-edge percentages, title spacing, top divider, reset indentation, colored collapsed summary, and right-aligned provider status.
- [ ] 1.2 Add failing composition/provider tests for progress statuses, grouped auxiliary rows, Z.AI Peak/Off-Peak placement, and OpenAI duration-derived labels.
- [ ] 1.3 Add failing native-option tests for color enablement, custom thresholds, and invalid-value fallback.
- [ ] 1.4 Add failing controlled-timer and session-model tests for configurable 10-second polling, immediate selected-provider refresh, and provider reordering.

## 2. Correct Rendering and Mapping

- [ ] 2.1 Replace fixed-width mounted header/progress rendering with parent-responsive OpenTUI flex layout and restore panel framing/reset presentation.
- [ ] 2.2 Preserve progress-led provider groups during aggregate ordering, carry semantic provider status into right-aligned headers, and derive OpenAI labels from API duration.
- [ ] 2.3 Normalize progress color options and apply semantic statuses consistently to bars, percentages, and collapsed summaries.
- [ ] 2.4 Pass the normalized polling interval into provider adapters and reactively resolve, refresh, and prioritize the current session model's provider.

## 3. Verify and Deploy

- [ ] 3.1 Run focused tests, typechecking, the full automated suite, and the three-artifact production build.
- [ ] 3.2 Deploy locally and manually validate normal/collapsed and normal/constrained-width behavior in OpenCode.
- [ ] 3.3 Manually validate the default/custom refresh interval and provider switching from the active session model.
