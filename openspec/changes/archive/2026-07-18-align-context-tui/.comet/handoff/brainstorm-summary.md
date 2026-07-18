# Brainstorm Summary

- Change: align-context-tui
- Date: 2026-07-18

## Confirmed Technical Approach

- Keep the dedicated Context model and `CompactPanel` presentation boundary.
- Extend the current presentation-ready model rather than returning raw numbers or migrating Context to the generic `PanelModel` renderer.
- Represent context limit and consumed tokens separately.
- Continue summing finite assistant costs and select the newest positive-token assistant message exactly as today.
- Format limits with the existing compact default and consumed tokens with two compact decimal places.
- When a token-bearing assistant message has no valid model context limit, show the known token count while rendering `Limit -`, `Used -`, and collapsed summary `-`.
- For zero spend, mute only the right-aligned `$0.00` value; keep the `Spent` label in normal text.
- Apply the same success/warning/error threshold status to both expanded `Used` and the collapsed summary.
- Use success below 40%, warning from 40% through 60%, and error above 60%; preserve usage overflow.
- Render expanded rows in the canonical order: `Limit`, `Tokens`, `Used`, `Spent`.
- Preserve the loadable-entry import boundary by type-re-exporting `PanelStatus` from `shared/opencode-tools-shared.ts` and importing it there in `tui/context.tsx`.

## Key Trade-offs and Risks

- The model must preserve useful partial data instead of treating a missing limit as a wholly unavailable state.
- The broader file surface is intentional: canonical rules, user documentation, model logic, presentation, and focused tests must agree.
- Keeping presentation-ready strings in the model is less architecturally pure than a numeric domain model, but it matches the existing feature boundary and minimizes regression risk.
- A direct type import initially passed focused tests but failed the repository's shared-boundary architecture test; the facade re-export adds no runtime code.

## Testing Strategy

- Model tests cover the separate values, two-decimal token formatting, partial data, non-finite inputs, overflow, and 39/40/60/61 status boundaries.
- Mounted tests cover four-row rendering, expanded `Used` color, collapsed summary color, muted zero-spend value, reactivity, persistence, and 37-cell alignment.
- Documentation tests keep the README and canonical `AGENTS.md` Context examples aligned.
- Final verification runs focused tests, type checking, the full test suite, and plugin build.
- The existing shared-boundary failure is the RED case for the facade correction.

## Spec Patches

None. The canonical `AGENTS.md` contract already defines the requested behavior; the Design Doc will record clarified edge cases.
