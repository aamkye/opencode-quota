## Context

The project packages each sidebar feature as an independent Solid TUI plugin registered through `sidebar_content`. MCP, LSP, and TODO share `CompactPanel`, persist collapse state through `api.kv`, and obtain reactive data from `api.state`. The Context panel needs the same lifecycle while deriving metrics from session messages and provider model metadata exposed by the OpenCode TUI API.

The target layout is fixed at the 37-column sidebar contract in `AGENTS.md`. OpenCode already defines the desired metric semantics: cumulative assistant-message cost for spend, the latest token-bearing assistant message for current context consumption, and that message's model context limit for the percentage denominator.

## Goals / Non-Goals

**Goals:**

- Ship Context as a separately registerable plugin between MCP and LSP.
- Mirror OpenCode's context-limit, current-usage, and session-cost semantics.
- Remain reactive as the active session, messages, or model metadata changes.
- Match the shared expanded/collapsed panel behavior, 37-column allocation, and persisted state conventions.
- Render stable placeholders when token or model information is not yet available.

**Non-Goals:**

- Estimate costs from external pricing data or change token-report behavior.
- Fetch provider quota data or add a new OpenCode host API.
- Combine Context with an existing plugin bundle.
- Redesign other sidebar panels beyond assigning slot orders that preserve the required sequence.

## Decisions

### Use a pure Context panel model plus a thin TUI component

A shared model function will accept session messages and provider metadata and return already formatted values for `Tokens`, `Used`, `Spent`, and the collapsed summary. The Solid component will own only session selection, collapse persistence, and rendering. This follows the model/mounted-test split used by MCP, LSP, and TODO and keeps host-shape handling testable without mounting Solid.

Alternatives considered:

- Compute values inline in JSX: smaller initially, but couples host data interpretation to rendering and makes boundary coverage harder.
- Extend the generic quota `PanelRenderer`: rejected because Context has only three right-aligned quantities and matches `CompactPanel` more directly.

### Mirror OpenCode's context metric calculation

Spend will sum `cost` across assistant messages in the active session. Current context tokens will come from the newest assistant message with a non-zero token total. The model context limit will be resolved from the provider/model metadata associated with that message, and usage will be the rounded token-total-to-limit percentage. This avoids presenting cumulative historical tokens as the current model context.

When no token-bearing assistant message or model limit is available, `Tokens` and `Used` will render `-`; an empty or zero-cost session will render `Spent` as `$0.00`. The collapsed summary will use the percentage when known and `-` otherwise.

Alternative considered: sum tokens across every message. This was rejected because it diverges from OpenCode's own context meter and can greatly exceed the active context after compaction.

### Reuse CompactPanel and explicit fixed-width quantity rows

The plugin will use `CompactPanel` for arrows, dividers, summary rendering, and footer behavior. A compact quantity-row primitive or equivalent local row will left-align labels and right-align values without trailing whitespace. Expanded state will use `▼`; collapsed state will use `▶` despite the inconsistent expanded arrow in the `AGENTS.md` example, as confirmed during clarification.

### Register a distinct manifest entry

The manifest, runtime `PluginKey`, package exports, build output, deployment/configuration documentation, and tests will include `context`. Its slot order will place it after MCP and before LSP; later existing entries will move only as required to preserve a deterministic order.

## Risks / Trade-offs

- [Risk] OpenCode SDK message or provider model shapes differ across supported host versions. → Mitigation: isolate shape access in the pure model, use the installed SDK types, and return placeholders for absent metadata.
- [Risk] Token totals can be double-counted if a host-provided total and detailed buckets are combined. → Mitigation: follow OpenCode's canonical token-total helper semantics and test representative message shapes.
- [Risk] Long formatted values can exceed the 37-column panel width. → Mitigation: reuse project compact-number formatting and fixed allocation/truncation rules, with mounted layout assertions.
- [Risk] Inserting a slot changes relative ordering for existing plugins. → Mitigation: update manifest order assertions and avoid changing their rendering or state behavior.

## Migration Plan

Add the new plugin artifact without enabling it implicitly. Existing users opt in through the same plugin registration mechanism as MCP, LSP, and TODO. Rollback consists of removing the Context registration; existing plugins remain independently loadable, and the unused persisted collapse key is harmless.

## Open Questions

None. Exact SDK property paths will be verified against the installed `@opencode-ai/plugin` types during deep design and implementation.
