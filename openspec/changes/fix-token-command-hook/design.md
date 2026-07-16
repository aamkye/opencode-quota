## Context

OpenCode's server `command.execute.before` hook can mutate output prompt parts but cannot cancel execution. Every server command continues to the model prompt pipeline, so the hook cannot satisfy no-model report generation.

## Fix

Register the eight token commands from the combined TUI plugin's keymap layer. Commands require the active session route, compute and render reports locally, then persist them with OpenCode's no-reply session prompt API so no model response is scheduled. Commands without a session show a toast and do nothing. `/tokens_between` uses a native TUI range prompt with explicit Enter submission and Escape cancellation.

Remove the server token plugin artifact and its declarative `opencode.json` commands during deployment. The interactive TUI owns discovery and execution, so no command template enters the model pipeline.

## Risks

Interactive token reports require the OpenCode TUI; CLI command execution remains model-backed and is intentionally unsupported. Tests lock no-model command registration, persistent message writes, no-session handling, range input controls, and deployment cleanup.
