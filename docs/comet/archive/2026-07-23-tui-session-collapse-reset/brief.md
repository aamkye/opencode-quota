# Outcome

All sidebar TUI plugins use the same session-scoped collapse behavior. A new
active session starts from that plugin's configured `defaultState`; if the
option is absent or invalid, it starts from the plugin's documented built-in
default.

# Scope

- Context, SesTokens, SubAgent, Quota, MCP, LSP, and TODO reset their panel
  collapse state when the active session boundary selected below is crossed.
- SubAgent and Quota also reset their secondary Rest / Other Providers state.
- SubAgent resets any expanded child detail to its built-in closed default.
- Remove persistent collapse-state influence from `api.kv`; configuration and
  built-in defaults determine each session's initial state consistently.
- Preserve user toggles while the current active session remains selected.
- Update the canonical default-collapse specification, README, and mounted
  behavior tests.

# Non-goals

- Not changing the supported `defaultState` values.
- Not changing panel contents, ordering, summaries, or visual layouts.
- Not changing non-collapse kv data such as SubAgent retained failures.

# Acceptance examples

- Context configured `collapsed`: entering a session starts Context collapsed;
  toggling expands it for the current session.
- SubAgent configured `semi-collapsed`: entering a session starts the panel
  expanded with Rest collapsed.
- No `defaultState`: entering a session starts each panel at its documented
  built-in default (`expanded`).
- Quota, MCP, LSP, TODO, Context, SesTokens, and SubAgent follow the same reset
  boundary; no plugin restores a previous process-persistent collapse toggle.

# Constraints and invariants

- Configuration is the first source of defaults; invalid or absent values use
  the documented built-in default.
- Collapse toggles remain interactive during the current session.
- All seven sidebar plugins use the same session reset contract.

# Decisions

- Remove cross-session collapse persistence through `api.kv`.
- Built-in fallback remains `expanded` when `defaultState` is absent or invalid.
- Reset on every active-session selection, including returning to a previously
  opened session. No panel or child disclosure state is restored after the
  active session ID changes.

# Open questions

_None._

# Verification expectations

- Mounted tests cover session changes for every sidebar plugin.
- Tests cover configured and built-in defaults, including tri-state panels.
- `npm run typecheck` and `npm test` pass.
