# Outcome

Each sidebar TUI plugin accepts an options object with a `defaultState` setting
that controls whether the panel starts expanded, semi-collapsed, or collapsed.
The README documents the option for every plugin.

# Scope

- Shared utility to read a `defaultState` option (`"expanded"` | `"semi-collapsed"`
  | `"collapsed"`) from plugin options and feed it as the fallback for
  `api.kv.get(COLLAPSED_KEY, …)`.
- Each sidebar panel (Context, SesTokens, SubAgent, Quota, MCP, LSP, TODO) uses
  the configured default instead of the hard-coded `false`.
- SubAgent and Quota also apply the default to their secondary section
  (Rest / Other Providers) so that `"semi-collapsed"` starts the panel expanded
  with the secondary section collapsed.
- Manifest options type extended so non-quota plugins can accept an options
  object alongside their string entry.
- README updated with the new option, its values, and which panels support
  `"semi-collapsed"`.

# Non-goals

- Not changing how user toggles persist (kv still wins over the configured
  default once the user has toggled).
- Not adding new intermediate visual states to panels that lack a secondary
  section.
- Not adding the option to home or token-report (no sidebar panel).

# Acceptance examples

- Context with `{ "defaultState": "collapsed" }` starts collapsed on first load
  (before the user toggles).
- SubAgent with `{ "defaultState": "semi-collapsed" }` starts with the panel
  expanded and the Rest section collapsed.
- LSP with `{ "defaultState": "expanded" }` (or no option) starts expanded —
  unchanged from today.
- A user who toggles a panel and reloads sees their persisted choice, not the
  configured default.
- README documents `defaultState` with its three values and notes which panels
  support `"semi-collapsed"`.

# Constraints and invariants

- The persisted kv toggle always wins over the configured default.
- `"expanded"` remains the implicit default when no option is supplied.
- The option name is `defaultState`.

# Decisions

- The configured `defaultState` replaces the hard-coded `false` as the kv
  fallback — it sets the initial state only; the user's first toggle persists and
  overrides on subsequent loads.
- Binary panels (Context, LSP, MCP, TODO, SesTokens) accept only `"expanded"`
  (default) and `"collapsed"`; `"semi-collapsed"` is ignored for them. Only
  SubAgent and Quota accept all three values.

# Open questions

_None._ Confirmed: binary panels (Context, LSP, MCP, TODO, SesTokens) accept only
`"expanded"` and `"collapsed"`; `"semi-collapsed"` is silently ignored for them
(falls back to expanded). Only SubAgent and Quota accept all three values.

# Verification expectations

- `npm run typecheck` passes.
- `npm test` passes.
- Unit tests cover the default-state resolution utility.
- README changes are reviewed for accuracy.
