# opencode-quota

> [!NOTE]
> Heavily inspired by:
> - [slkiser/opencode-quota](https://github.com/slkiser/opencode-quota)
> - [farrukh2002/opencode-glm-reset](https://github.com/farrukh2002/opencode-glm-reset)

OpenCode TUI plugins that show quota usage, reset countdowns, rate-limit
status, compact homepage summaries, and `/tokens_*` reports for **Z.AI (GLM)**
and **OpenAI (ChatGPT Plus/Pro)**.

![opencode-quota homepage bottom](img/img0.jpg)

<table>
  <tr>
    <td width="50%">
      <img src="img/img1.jpg" alt="OpenCode Quota TUI sidebar panel" />
    </td>
    <td width="50%">
      <img src="img/img2.jpg" alt="OpenCode Quota TUI sidebar panel extended" />
    </td>
  </tr>
  <tr>
    <td width="50%" align="center">OpenCode Quota TUI sidebar panel</td>
    <td width="50%" align="center">OpenCode Quota TUI sidebar panel extended</td>
  </tr>
</table>

## Features

### Z.AI (`zai-coding-plan`)

- **5H token quota** — remaining %, live countdown to next reset, and absolute
  token counts (`used / total`) when the plan exposes them (Max/Pro).
- **7D weekly limit** — same bar + countdown; shows "Unlimited (Legacy)"
  when the plan has no weekly cap.
- **Peak/off-peak indicator** — Peak (14:00–18:00 SGT, 3x usage)
  vs Off-Peak.
- **Limited indicator** — shows when the 5H quota is exhausted.
- **Heuristic fallback** — if the API is unreachable, scans the session's
  message parts for a reset time and falls back to a clock-based estimate.

### OpenAI (ChatGPT Plus/Pro)

- **5H primary window** — remaining %, reset countdown.
- **7D weekly window** — same bar + countdown.
- **Plan type** — Plus / Pro / Pro Lite / Team.
- **Limited indicator** — shows when rate limit is reached.

### Shared

- **Homepage summary** — each provider plugin also registers a compact homepage
  line, such as `Z.AI: Max; 93%/84%` or `OpenAI: Pro Lite; 96%/84%`.
- **`/tokens_*` commands** — server plugin providing token usage and cost
  reports: `/tokens_today`, `/tokens_daily`, `/tokens_weekly`, `/tokens_monthly`,
  `/tokens_all`, `/tokens_session`, `/tokens_session_all`, `/tokens_between`.
  Reads from `opencode.db` with full models.dev pricing resolution.
- **Color-coded bars** — green above 30% remaining, amber at ≤30%,
  red at ≤10% remaining.
- **Provider names, plan types, and bar labels** use the theme foreground
  colour; only the bar fills and percentages are colour-coded.
- **Smart polling** — checks the quota API every 60s, backing off to 5min
  when the primary window is exhausted.
- **Expandable** — click the header to show weekly / tool / absolute details.
- **Stale handling** — keeps showing the last known data (marked `~stale`)
  through transient fetch failures.

## Local-only usage

This plugin is loaded directly by OpenCode — no build step, no npm publish.

### How TUI plugins load

TUI plugins (`.tsx` files exporting a `tui()` function) are **not** auto-scanned
from `.opencode/plugins/` (that directory is for regular hook plugins only).
They must be registered in `tui.json` via the `plugin` array. The repo-root
`tui.json` does this:

```json
{
  "$schema": "https://opencode.ai/tui.json",
  "plugin": [
    "./opencode-quota-zai.tsx",
    "./opencode-quota-openai.tsx"
  ]
}
```

OpenCode resolves each path relative to `tui.json`, loads the `.tsx` files
with Bun, and resolves imports (`@opencode-ai/plugin/tui`, `@opentui/*`,
`solid-js`) from the repo's `node_modules`.

### `/tokens_*` commands

The server plugin is bundled into `.opencode/plugins/tokens.ts` via esbuild.
Build it with:

```bash
npm run build:tokens
```

The plugin auto-registers `/tokens_*` slash commands via the `config` hook.
No `opencode.json` registration needed — files in `.opencode/plugins/` are
auto-scanned at startup.

### Files

| File                        | Purpose                                                               |
| --------------------------- | --------------------------------------------------------------------- |
| `opencode-quota-shared.tsx` | Shared constants, helpers, `BarRow`, `HomeQuotaLine`                  |
| `opencode-quota-zai.tsx`    | Z.AI (GLM) provider plugin (sidebar + homepage)                       |
| `opencode-quota-openai.tsx` | OpenAI (ChatGPT Plus/Pro) provider plugin (sidebar + homepage)        |
| `opencode-quota-tokens.ts`  | Server plugin entry for `/tokens_*` commands                          |
| `lib/tokens/`               | Vendored token reporting library (from `slkiser/opencode-quota`, MIT) |
| `build-tokens.mjs`          | esbuild bundler producing `.opencode/plugins/tokens.ts`               |
| `tui.json`                  | TUI plugin registration                                               |

### Edit workflow

Edit any `.tsx` file at the repo root, then restart opencode to reload.

```bash
npm install       # install/refresh deps in node_modules
npm run typecheck # tsc --noEmit (informational; runtime resolves via Bun)
npm run build:tokens  # rebuild the /tokens_* server plugin
npm test          # run tests
```

### Global install (optional)

To use across all projects, copy the `.tsx` files and register them in your
global `tui.json` (`~/.config/opencode/tui.json` or `.jsonc`):

```json
{
  "plugin": [
    "~/path/to/opencode-quota-shared.tsx",
    "~/path/to/opencode-quota-zai.tsx",
    "~/path/to/opencode-quota-openai.tsx"
  ]
}
```

For `/tokens_*` commands, copy the built `.opencode/plugins/tokens.ts` to
`~/.config/opencode/plugins/tokens.ts`.

## How it works

### Z.AI

1. Reads the API key from the `zai-coding-plan` provider (falls back to
   `~/.local/share/opencode/auth.json`, then `~/.config/opencode/auth.json`
   and the older `account.json` locations).
2. Polls `https://api.z.ai/api/monitor/usage/quota/limit` every 60s (5min
   when the 5H quota is exhausted).
3. Renders bars + countdowns in the sidebar; expands for absolute counts.

### OpenAI

1. Reads the OAuth access token from the `openai` provider entry in
   `auth.json` (also checks `codex`, `chatgpt`, `opencode` keys).
2. Extracts the `chatgpt_account_id` from the JWT for the
   `ChatGPT-Account-Id` header.
3. Polls `https://chatgpt.com/backend-api/wham/usage` every 60s (5min
   when the primary window is exhausted).
4. Renders plan type + primary (5H) / secondary (7D) / code review windows.

### `/tokens_*` reports

1. Reads assistant messages from `opencode.db` (SQLite, via `bun:sqlite`).
2. Aggregates token usage by model, provider, and session.
3. Resolves USD costs using a bundled models.dev pricing snapshot.
4. Formats a markdown report with summary, model breakdown, and top sessions.
5. Injects the report into the session via `noReply` prompt (no model invocation).
