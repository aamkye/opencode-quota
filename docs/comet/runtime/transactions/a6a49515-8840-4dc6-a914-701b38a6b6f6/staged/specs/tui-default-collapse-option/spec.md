# tui-default-collapse-option

Each sidebar TUI plugin accepts an options object with a `defaultState` setting
that controls its collapse state whenever the active session ID changes. A
panel remains interactive while that session stays selected, but no collapse or
disclosure choice is restored after selecting another session.

## Option

```json
["./opencode-tools-context.js", { "defaultState": "collapsed" }]
```

`defaultState` accepts:

- `"expanded"` (default) - panel starts fully expanded.
- `"collapsed"` - panel starts collapsed (header + summary only).
- `"semi-collapsed"` - only SubAgent and Quota; panel starts expanded with the
  secondary section (Rest / Other Providers) collapsed. Ignored for all other
  panels (falls back to `"expanded"`).

## Scenario: active session selection resets all panels

**Trigger:** The active session ID changes, including returning to a session
that was selected earlier in the same OpenCode process.

**Result:** Context, SesTokens, SubAgent, Quota, MCP, LSP, and TODO reset to the
state derived from their own `defaultState`. No plugin restores a prior collapse
choice from persistent or in-memory per-session storage.

## Scenario: toggles remain local to current selection

**Trigger:** A user expands or collapses a panel or supported secondary section
without changing the active session.

**Result:** The chosen state remains visible and interactive until the active
session ID changes. It is not written to collapse-state kv storage.

## Scenario: binary panel with defaultState collapsed

**Trigger:** Context (or LSP, MCP, TODO, SesTokens) is configured with
`{ "defaultState": "collapsed" }`, and an active session is selected.

**Result:** The panel starts collapsed for that session selection.

## Scenario: binary panel with defaultState semi-collapsed

**Trigger:** Context (or LSP, MCP, TODO, SesTokens) is configured with
`{ "defaultState": "semi-collapsed" }`.

**Result:** The value is ignored; the panel starts expanded.

## Scenario: tri-state panel with defaultState semi-collapsed

**Trigger:** SubAgent (or Quota) is configured with
`{ "defaultState": "semi-collapsed" }`, and an active session is selected.

**Result:** The panel starts expanded but the secondary section (Rest / Other
Providers) starts collapsed. SubAgent child details start closed.

## Scenario: no option or invalid value

**Trigger:** Any sidebar plugin has no options object or an unrecognized
`defaultState` value.

**Result:** The panel starts expanded whenever the active session ID changes.

## Applicable plugins

| Plugin | Values accepted |
|--------|----------------|
| Context | `expanded`, `collapsed` |
| SesTokens | `expanded`, `collapsed` |
| SubAgent | `expanded`, `semi-collapsed`, `collapsed` |
| Quota | `expanded`, `semi-collapsed`, `collapsed` |
| MCP | `expanded`, `collapsed` |
| LSP | `expanded`, `collapsed` |
| TODO | `expanded`, `collapsed` |

Home and token-report do not have sidebar panels and do not accept this option.
