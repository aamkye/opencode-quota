## Why

The Context sidebar implementation no longer matches the layout contract in `AGENTS.md`: it labels the model context limit as `Tokens`, omits actual token usage and the `Limit` row, and does not apply the required usage or zero-cost colors. This makes the panel misleading and leaves documented behavior unimplemented.

## What Changes

- Separate the model context limit from the current session token count.
- Render the expanded Context panel as `Limit`, `Tokens`, `Used`, and `Spent`.
- Color the collapsed usage summary green below 40%, yellow from 40% through 60%, and red above 60%.
- Mute the zero-cost `Spent` value.
- Align Context documentation and regression coverage with the canonical TUI layout.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. The behavior is already specified by the repository's canonical TUI layout rules.

## Impact

The change affects the Context feature model and sidebar presentation, its focused model and mounted tests, and the README layout example. It does not change plugin exports, host APIs, persistence keys, or configuration.
