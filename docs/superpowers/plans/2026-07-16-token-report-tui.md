---
change: fix-token-command-hook
design-doc: docs/superpowers/specs/2026-07-16-token-report-tui-design.md
base-ref: ec15a054a9a042f446cffca6f54131bfbf59f60c
---

# Token Report TUI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Execute interactive `/tokens*` commands locally and display reports in a full-screen TUI route without a model request or session-history message.

**Architecture:** A new TUI-only token-report module registers the eight `slashName` commands and owns a route that computes through the shared report facade. The combined quota artifact imports that module; deployment removes the server token artifact and the `opencode.json` command entries that route into OpenCode's model pipeline.

**Tech Stack:** TypeScript, Solid/OpenTUI, `@opencode-ai/plugin/tui`, esbuild, Node test runner.

## Global Constraints

- Interactive `/tokens*` execution must not call a model, `session.prompt`, or create any session message.
- `/tokens_between` collects `YYYY-MM-DD YYYY-MM-DD` through native TUI input; cancellation changes nothing.
- The report route returns to its source session on Escape, or to home without one.
- `opencode run --command` is intentionally unsupported for token reports.
- Do not commit unless the user explicitly requests it.

---

### Task 1: Implement TUI-Native Token Reports

**Files:**
- Create: `tui/token-report.tsx`
- Modify: `opencode-plugin-tui.d.ts`
- Modify: `tests/compile-presentation.mjs`
- Create: `tests/token-tui.test.mjs`
- Delete: `tests/token-plugin.test.mjs`

**Interfaces:**
- Consumes: `computeTokenReport`, `renderTokenReport`, `TOKEN_REPORT_COMMANDS`, and `TokenReportCommandId` from `shared/opencode-tools-shared.js`.
- Produces: `registerTokenReportTui(api)` and testable `tokenReportCommands(api)` registration data.
- Produces: route name `aamkye.token-report` with parameters `{ command: TokenReportCommandId; arguments?: string; sessionID?: string }`.

- [x] **Step 1: Write failing native-command tests**

Create `tests/token-tui.test.mjs` with a fake TUI API that records keymap layers, route registrations, dialog calls, and navigation. Assert all eight commands have matching `slashName` values, route navigation includes the active session ID, and no fake `client.session.prompt` is called.

```js
test("token commands register native slash handlers without a model client", () => {
  const api = createTuiApi({ route: { name: "session", params: { sessionID: "s1" } } })
  registerTokenReportTui(api)

  assert.deepEqual(api.commands.map((command) => command.slashName), TOKEN_COMMANDS)
  api.commandBySlash("tokens_today").run()
  assert.deepEqual(api.navigations, [{ name: "aamkye.token-report", params: { command: "tokens_today", sessionID: "s1" } }])
  assert.equal(api.prompts.length, 0)
})
```

Add cases for native `/tokens_between` prompt submission, cancellation, a successful rendered route, a computation error route, Escape returning to session, and Escape returning home when no session ID exists.

- [x] **Step 2: Run the focused test to verify RED**

Run: `node tests/compile-presentation.mjs && node --test tests/token-tui.test.mjs`

Expected: FAIL because `tui/token-report.tsx` and its exported registration helpers do not exist.

- [x] **Step 3: Extend the local TUI API declaration**

In `opencode-plugin-tui.d.ts`, add only the host APIs used by the new module:

```ts
keymap: { registerLayer(input: { commands: TuiCommand[]; bindings?: TuiBinding[] }): void }
route: { current: { name: string; params?: Record<string, unknown> }; register(routes: TuiRoute[]): void; navigate(name: string, params?: Record<string, unknown>): void }
ui: { dialog: { replace(render: () => JSX.Element, onClose?: () => void): void; clear(): void } ; DialogPrompt: (props: TuiPromptProps) => JSX.Element }
```

Define the narrow local `TuiCommand`, `TuiRoute`, and `TuiPromptProps` interfaces around actual runtime calls. Do not declare unrelated host APIs.

- [x] **Step 4: Implement `tui/token-report.tsx`**

Register one keymap layer containing the eight native commands. For seven argument-free commands, capture `api.route.current.params?.sessionID` when the active route is `session`, then navigate directly. For `tokens_between`, open `api.ui.DialogPrompt`; its submit callback closes the dialog and navigates with the submitted range, while cancellation only closes the dialog.

Register the report route once. It computes with:

```ts
const data = await computeTokenReport({ command, arguments, sessionID })
const text = renderTokenReport(data)
```

Render loading, report, and caught-error text inside a full-width clipped column. Add a route-scoped keymap layer with Escape that navigates to `session` with the saved session ID or `home` when none exists. Do not import or call any server-client API.

- [x] **Step 5: Run the focused test to verify GREEN**

Run: `node tests/compile-presentation.mjs && node --test tests/token-tui.test.mjs`

Expected: PASS with command registration, route rendering, range input, cancellation, error, and return-navigation coverage.

### Task 2: Compose Token Reports Into the Combined TUI Artifact

**Files:**
- Modify: `build-plugins.mjs`
- Modify: `tests/plugin-build.test.mjs`
- Modify: `tests/shared-boundary.test.mjs`
- Delete: `opencode-tools-tokens.ts`

**Interfaces:**
- Consumes: `registerTokenReportTui(api)` from `tui/token-report.tsx`.
- Produces: a single `dist/opencode-tools-quota.js` TUI module that owns quota, home, and token-report registration.
- Removes: `dist/plugins/opencode-tools-tokens.js` and its server-plugin default function.

- [ ] **Step 1: Write failing artifact expectations**

Update `tests/plugin-build.test.mjs` so `expectedArtifacts` contains only the shared and combined TUI files. Require the quota build metafile to include `tui/token-report.tsx`, require the combined artifact to expose only a TUI module, and assert no token server artifact is emitted.

- [ ] **Step 2: Run the focused artifact test to verify RED**

Run: `node tests/compile-presentation.mjs && node --test tests/plugin-build.test.mjs`

Expected: FAIL because the build still emits and imports the standalone server token plugin.

- [ ] **Step 3: Replace the standalone entry with combined registration**

In `build-plugins.mjs`, import `registerTokenReportTui` in the quota stdin entry and call it after quota and home setup:

```js
import { registerTokenReportTui } from "./tui/token-report.tsx"
// inside plugin.tui(api, options)
await quota.tui(api, options)
await home.tui(api, options)
await registerTokenReportTui(api)
```

Remove the `tokens` esbuild target and return only `{ shared, quota }`. Delete `opencode-tools-tokens.ts`. Update source-boundary assertions so token computation remains in the shared facade and the TUI route remains presentation/registration-only.

- [ ] **Step 4: Run the focused artifact test to verify GREEN**

Run: `node tests/compile-presentation.mjs && node --test tests/plugin-build.test.mjs tests/shared-boundary.test.mjs`

Expected: PASS; generated output contains one shared artifact and one host-runtime TUI artifact, with no server token plugin.

### Task 3: Remove Model-Backed Deployment Paths

**Files:**
- Modify: `deploy-plugins.mjs`
- Modify: `tests/plugin-deploy.test.mjs`
- Modify: `openspec/changes/fix-token-command-hook/tasks.md`

**Interfaces:**
- Consumes: the combined `dist/opencode-tools-quota.js` artifact.
- Produces: local and global deployments that remove stale token server artifacts and all managed `tokens_*` `opencode.json` entries.

- [ ] **Step 1: Write failing deployment cleanup tests**

Seed fixture `opencode.json` with unrelated commands and all eight managed `tokens_*` commands. After deployment, assert unrelated commands remain, `tokens_*` commands are absent, `plugins/opencode-tools-tokens.js` is absent, and the deployment snapshot is idempotent.

- [ ] **Step 2: Run the focused deployment test to verify RED**

Run: `node --test tests/plugin-deploy.test.mjs`

Expected: FAIL because deployment still writes the model-backed command configuration and token server artifact.

- [ ] **Step 3: Implement managed command and artifact removal**

Remove token-artifact copying and token command registration from `deploy-plugins.mjs`. Add the legacy token artifact to managed cleanup. When writing `opencode.json`, delete only the eight managed `tokens_*` keys, preserve all other fields and commands, and remove an empty `command` object only when deployment created no unrelated command entries.

- [ ] **Step 4: Run focused and full verification**

Run: `node --test tests/plugin-deploy.test.mjs && npm test && npm run typecheck && npm run build && npm run deploy:local && opencode debug config`

Expected: all tests, typecheck, and build pass; deployed config has no `tokens_*` server commands; restarting the OpenCode TUI exposes the native `/tokens*` slash commands and opens reports without model activity.

- [ ] **Step 5: Update task evidence**

Mark Tasks 2.1 through 2.3 complete only after the commands above pass. Record the no-model route behavior and the intentional CLI limitation in the verification report.

## Plan Review

- Spec coverage: Tasks 1-3 cover native slash discovery, local route rendering, no history/model invocation, date-range input, Escape navigation, artifact composition, and removal of model-backed deployment.
- Placeholder scan: no unresolved implementation or validation steps remain.
- Type consistency: all TUI route, command, and prompt interfaces are introduced in Task 1 before use by later tasks.
