---
comet_change: fix-token-command-hook
role: technical-design
canonical_spec: openspec
---

# Token Report TUI Commands

## Goal

Run every `/tokens*` command locally and persist its rendered result in the active chat without scheduling a model response.

## Architecture

The combined TUI plugin registers the eight token commands through OpenCode's keymap API. Each command has a `slashName` so it remains visible in TUI slash completion, and its `run` handler requires the active session route. Commands invoked without an active session show a toast and make no change.

Argument-free commands call the shared `computeTokenReport` and `renderTokenReport` functions directly, then write the rendered result through OpenCode's supported no-reply session prompt API. This creates a durable context message without scheduling a model response. No server plugin hook or OpenCode command-template entry participates in this path.

`/tokens_between` opens a native TUI prompt for the required `YYYY-MM-DD YYYY-MM-DD` range under a dedicated dialog mode. Escape clears the prompt without changing the session. Enter submits the current value, closes the prompt, then computes and persists the report through the same no-reply path.

## Error Handling

Invalid arguments and report-computation failures are rendered and persisted through the same no-reply path. Commands without an active session show a toast rather than creating a session or message.

## Deployment

Deployment stops generating the token server artifact and removes the declarative `tokens_*` entries that previously routed execution into OpenCode's model command pipeline. It retains the combined TUI artifact, which owns token command discovery in the interactive application.

`opencode run --command tokens_today` is intentionally unsupported after this change because the CLI command API uses the server prompt pipeline and cannot satisfy the no-LLM guarantee.

## Tests

- Verify all eight native command registrations expose the expected slash names.
- Verify commands persist a rendered report through the no-reply client call without scheduling a model response.
- Verify `/tokens_between` accepts Enter submission and Escape cancellation through its native prompt.
- Verify commands invoked without an active session show a toast and make no client call.
- Verify deployment no longer creates model-backed token command configuration or a token server plugin artifact.
