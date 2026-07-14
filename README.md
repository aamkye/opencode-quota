# opencode-tools

> [!NOTE]
> Heavily inspired by:
> - [the upstream project](https://github.com/slkiser/opencode-quota)
> - [farrukh2002/opencode-glm-reset](https://github.com/farrukh2002/opencode-glm-reset)

OpenCode TUI plugins that show quota usage, reset countdowns, rate-limit
status, compact homepage summaries, and `/tokens_*` reports for **Z.AI (GLM)**
and **OpenAI (ChatGPT Plus/Pro)**.

![opencode-tools homepage bottom](img/img0.jpg)

<table>
  <tr>
    <td width="50%">
      <img src="img/img1.jpg" alt="OpenCode Tools TUI sidebar panel" />
    </td>
    <td width="50%">
      <img src="img/img2.jpg" alt="OpenCode Tools TUI sidebar panel extended" />
    </td>
  </tr>
  <tr>
    <td width="50%" align="center">OpenCode Tools TUI sidebar panel</td>
    <td width="50%" align="center">OpenCode Tools TUI sidebar panel extended</td>
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

The plugins are built and loaded only from local files. This package is not
published to npm, and OpenCode is never configured with an npm package spec.

### Build and deploy

Build the three minified ESM artifacts:

```bash
npm run build:plugins
```

Deploy to this repository's `.opencode/` directory or the resolved global
OpenCode config directory (`$XDG_CONFIG_HOME/opencode`, defaulting to
`~/.config/opencode`):

```bash
npm run deploy:local
npm run deploy:global
```

Both deploy commands rebuild first, replace obsolete opencode-tools/quota/token
entries, and preserve unrelated TUI plugins. Local deployment also removes
managed source entries from the project-root `tui.json`, because OpenCode loads
it together with `.opencode/tui.json`; options in the selected `.opencode`
config take precedence. Repeating either command produces the same files and
configuration. Fully restart OpenCode after deployment.

### Artifact layout

```text
dist/
├── opencode-tools-shared.js
├── opencode-tools-quota.js
└── plugins/
    └── opencode-tools-tokens.js
```

| File | Responsibility |
| --- | --- |
| `opencode-tools-shared.js` | Imported-only quota/provider and token computation; it is not registered as a plugin. |
| `opencode-tools-quota.js` | Sole TUI plugin; registers sidebar and home slots and imports `./opencode-tools-shared.js`. |
| `plugins/opencode-tools-tokens.js` | Regular OpenCode plugin for `/tokens_*`; imports `../opencode-tools-shared.js`. |

`solid-js`, `@opentui/*`, `@opencode-ai/plugin`, host SDK modules, and
Node/Bun built-ins remain external and are provided by the OpenCode host.

### Session title plugin

Build the global hook plugin with `npm run build:session-title`. Deploy it with
`npm run deploy:session-title`; this copies only `dist/session-title.ts` to
`~/.config/opencode/plugins/session-title.ts`, which OpenCode auto-loads at
startup. Restart OpenCode after deployment. The plugin generates a one-time,
3-8 word title from the first message's selected model; later messages do not
change that title.

### Source files

| File                        | Purpose                                                               |
| --------------------------- | --------------------------------------------------------------------- |
| `tui/quota.tsx`             | Aggregate sidebar registration and quota composition                  |
| `tui/home.tsx`              | Compact homepage registration and formatter                           |
| `tui/providers/`            | Z.AI and OpenAI provider adapters                                     |
| `opencode-tools-tokens.ts`  | Server plugin entry for `/tokens_*` commands                          |
| `lib/tokens/`               | Vendored token reporting library ([upstream](https://github.com/slkiser/opencode-quota), MIT) |
| `build-plugins.mjs`         | Builds the three minified local ESM artifacts                          |
| `deploy-plugins.mjs`        | Idempotently deploys local/global artifacts and updates `tui.json`    |

### Edit workflow

Edit the relevant source, redeploy, then fully restart OpenCode to reload.

```bash
npm install       # install/refresh deps in node_modules
npm run typecheck # tsc --noEmit (informational; runtime resolves via Bun)
npm run build:plugins # rebuild all three local artifacts
npm run deploy:local # rebuild and deploy into this repository
npm test          # run tests
```

## Breaking migration

This project was renamed to `opencode-tools`. Replace every prior project path,
TUI entry, package name, token plugin filename, and build command with the paths
shown above. Legacy files and aliases are intentionally not provided.

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
