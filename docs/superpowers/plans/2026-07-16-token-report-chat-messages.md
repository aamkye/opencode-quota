---
change: fix-token-command-hook
design-doc: docs/superpowers/specs/2026-07-16-token-report-tui-design.md
base-ref: bd5380d
---

# Token Report Chat Messages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist locally generated token reports as no-model messages in the active chat and make the date-range prompt accept Enter and Escape reliably.

**Architecture:** Replace the report route with an async command helper that computes and renders locally, then calls OpenCode's supported no-reply session prompt API. Keep the native range input, but give its lifetime a dedicated mode so Escape clears it; the host DialogPrompt owns Enter-to-submit.

**Tech Stack:** TypeScript, Solid/OpenTUI, `@opencode-ai/plugin/tui`, Node test runner.

## Global Constraints

- Commands require the active `session` route; otherwise show a toast and make no state change.
- Persist reports only with `client.session.prompt` and `body.noReply: true`; never schedule a model response.
- `/tokens_between` accepts `YYYY-MM-DD YYYY-MM-DD`; Escape cancels without a client call and Enter submits the current native prompt value.
- Remove the standalone report route and route-scoped Escape binding.
- Preserve the intentionally unsupported `opencode run --command` path and deployment cleanup.

---

### Task 1: Add Failing Message and Dialog Tests

**Files:**
- Modify: `tests/token-tui.test.mjs`
- Modify: `tests/compile-presentation.mjs`
- Modify: `tests/token-tui-dependencies.fixture.ts`

**Interfaces:**
- Consumes: `registerTokenReportTui(api)` and the controlled report dependencies fixture.
- Produces: a fake TUI API with `client.session.prompt`, `ui.toast`, dialog-mode tracking, and native prompt callbacks for Task 2.

- [ ] **Step 1: Extend the fake TUI API with observable client and toast calls**

```js
client: {
  session: {
    prompt: async (input) => api.sessionPrompts.push(input),
  },
},
ui: {
  toast: { show: (input) => api.toasts.push(input) },
  // retain DialogPrompt and dialog test doubles
}
```

- [ ] **Step 2: Add failing command behavior tests**

```js
test("token commands persist a no-reply report in the active session", async () => {
  const api = createTuiApi({ route: { name: "session", params: { sessionID: "s1" } } })
  registerControlledTokenReportTui(api)
  await api.commandBySlash("tokens_today").run()
  assert.deepEqual(api.sessionPrompts, [{
    path: { id: "s1" },
    body: { noReply: true, parts: [{ type: "text", text: "# Tokens used (Today)" }] },
  }])
  assert.equal(api.navigations.length, 0)
})

test("token command without a session shows a toast without a client call", async () => {
  const api = createTuiApi()
  registerControlledTokenReportTui(api)
  await api.commandBySlash("tokens_today").run()
  assert.equal(api.sessionPrompts.length, 0)
  assert.equal(api.toasts.length, 1)
})
```

- [ ] **Step 3: Add failing range control tests**

```js
test("tokens_between Enter submits the native prompt", async () => {
  // invoke the recorded DialogPrompt onSubmit with a valid range
  // assert one noReply prompt for the original session and a cleared dialog
})

test("tokens_between Escape closes its dialog mode without a client call", () => {
  // invoke the registered range-mode Escape binding
  // assert dialog clear, mode pop, no session prompt, and no navigation
})
```

- [ ] **Step 4: Run focused tests to verify RED**

Run: `node tests/compile-presentation.mjs && node --test tests/token-tui.test.mjs`

Expected: FAIL because the current implementation navigates to `aamkye.token-report`, has no client/toast interaction, and has no range-dialog mode binding.

### Task 2: Persist Reports and Remove the Route

**Files:**
- Modify: `tui/token-report.tsx`
- Modify: `opencode-plugin-tui.d.ts`
- Modify: `tests/token-tui.test.mjs`

**Interfaces:**
- Consumes: `computeTokenReport`, `renderTokenReport`, `TOKEN_REPORT_COMMANDS`, and active session IDs.
- Produces: command handlers that return `Promise<void>` and persist reports with `api.client.session.prompt`.

- [ ] **Step 1: Add the narrow host declarations used by the command handlers**

```ts
client: {
  session: {
    prompt(input: {
      path: { id: string }
      body: { noReply: true; parts: Array<{ type: "text"; text: string }> }
    }): Promise<unknown>
  }
}
ui: { toast: { show(input: { title: string }): void }; /* existing dialog API */ }
```

- [ ] **Step 2: Replace route navigation with one local persistence helper**

```ts
async function persistReport(api: TuiPluginApi, sessionID: string, command: TokenReportCommandId, argumentsValue?: string) {
  const data = await computeTokenReport({ command, arguments: argumentsValue, sessionID })
  await api.client.session.prompt({
    path: { id: sessionID },
    body: { noReply: true, parts: [{ type: "text", text: renderTokenReport(data) }] },
  })
}
```

Commands without `sourceSessionID(api)` must call `api.ui.toast.show({ title: "Open a session to view token usage" })` and return. Caught compute errors must be rendered with `renderTokenReport`-compatible text and persisted through the same no-reply call.

- [ ] **Step 3: Give the range prompt a dedicated mode and remove route code**

```ts
const RANGE_MODE = "aamkye.token-report-range"
const popMode = api.mode.push(RANGE_MODE)
api.ui.dialog.replace(
  () => api.ui.DialogPrompt({ title: "Token report date range", onSubmit: submit }),
  () => { popMode(); api.ui.dialog.clear() },
)
```

Register an Escape binding for `RANGE_MODE` that invokes the active dialog close callback. Keep Enter owned by `DialogPrompt`'s `onSubmit`; its handler clears the dialog, pops the mode, and awaits `persistReport`. Remove `TokenReportRoute`, `TokenReportRouteParams`, `ROUTE_NAME`, `REPORT_MODE`, the report route registration, and all route-navigation assertions.

- [ ] **Step 4: Run focused tests to verify GREEN**

Run: `node tests/compile-presentation.mjs && node --test tests/token-tui.test.mjs`

Expected: PASS with durable no-reply message writes, no-session toast, Enter range submission, Escape cancellation, and no report route registration.

- [ ] **Step 5: Run regression checks and commit**

Run: `npm test && npm run typecheck && npm run build`

Expected: PASS. Commit: `fix(tui): persist token reports in chat`.

## Plan Review

- Spec coverage: Tasks 1-2 cover persistence, no-model delivery, no-session behavior, Enter/Escape dialog controls, route removal, and full regression verification.
- Placeholder scan: no unresolved implementation or validation steps remain.
- Type consistency: the plan adds only the narrow `client.session.prompt` and `ui.toast.show` declarations consumed by the command helper.
