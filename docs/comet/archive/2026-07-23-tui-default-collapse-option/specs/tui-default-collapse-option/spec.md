# tui-default-collapse-option

Each sidebar TUI plugin accepts an options object with a `defaultState` setting
that controls the panel's initial collapse state on first load (before the user
toggles). The persisted kv toggle always wins once the user has interacted.

## Option

```json
["./opencode-tools-context.js", { "defaultState": "collapsed" }]
```

`defaultState` accepts:

- `"expanded"` (default) — panel starts fully expanded.
- `"collapsed"` — panel starts collapsed (header + summary only).
- `"semi-collapsed"` — **only SubAgent and Quota**; panel starts expanded with
  the secondary section (Rest / Other Providers) collapsed. Ignored for all other
  panels (falls back to `"expanded"`).

## Scenario: binary panel with defaultState collapsed

**Trigger:** Context (or LSP, MCP, TODO, SesTokens) configured with
`{ "defaultState": "collapsed" }` and no prior kv toggle.

**Result:** The panel starts collapsed on first load. Once the user toggles, the
kv-persisted value wins on subsequent loads.

## Scenario: binary panel with defaultState semi-collapsed

**Trigger:** Context (or LSP, MCP, TODO, SesTokens) configured with
`{ "defaultState": "semi-collapsed" }`.

**Result:** The value is ignored; the panel starts expanded (same as no option or
`"expanded"`).

## Scenario: tri-state panel with defaultState semi-collapsed

**Trigger:** SubAgent (or Quota) configured with
`{ "defaultState": "semi-collapsed" }` and no prior kv toggle.

**Result:** The panel starts expanded but the secondary section (Rest / Other
Providers) starts collapsed.

## Scenario: no option or invalid value

**Trigger:** Any sidebar plugin with no options object, or with an unrecognized
`defaultState` value.

**Result:** The panel starts expanded — unchanged from prior behavior.

## Scenario: persisted toggle wins

**Trigger:** Any sidebar plugin where the user has previously toggled the panel
(kv value exists).

**Result:** The persisted kv value is used regardless of the configured
`defaultState`.

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
