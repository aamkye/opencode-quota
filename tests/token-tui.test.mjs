import assert from "node:assert/strict"
import test from "node:test"

const { registerTokenReportTui, tokenReportCommands } = await import("../.tmp-test/token-tui.mjs")
const { registerTokenReportTui: registerControlledTokenReportTui } = await import("../.tmp-test/token-tui-controlled.mjs")

const TOKEN_COMMANDS = [
  "tokens_today",
  "tokens_daily",
  "tokens_weekly",
  "tokens_monthly",
  "tokens_all",
  "tokens_session",
  "tokens_session_all",
  "tokens_between",
]

function createTuiApi({ route = { name: "home" }, prompt } = {}) {
  const api = {
    commands: [],
    dialogs: [],
    prompts: [],
    routes: [],
    sessionPrompts: [],
    toasts: [],
    client: {
      session: {
        async prompt(input) {
          api.sessionPrompts.push(input)
          await prompt?.(input)
        },
      },
    },
    keymap: {
      registerLayer(layer) {
        api.commands.push(...(layer.commands ?? []))
        api.layers.push(layer)
      },
    },
    layers: [],
    mode: {
      active: [],
      pushes: [],
      pops: [],
      push(mode) {
        api.mode.pushes.push(mode)
        api.mode.active.push(mode)
        return () => {
          api.mode.pops.push(mode)
          api.mode.active.splice(api.mode.active.lastIndexOf(mode), 1)
        }
      },
    },
    route: {
      current: route,
      register(routes) {
        api.routes.push(...routes)
      },
    },
    ui: {
      toast(input) {
        api.toasts.push(input)
      },
      DialogPrompt(props) {
        api.prompts.push(props)
        return null
      },
      dialog: {
        clear() {
          api.dialogs.push({ kind: "clear" })
        },
        replace(render, onClose) {
          api.dialogs.push({ kind: "replace", render, onClose })
        },
      },
    },
    commandBySlash(slashName) {
      return api.commands.find((command) => command.slashName === slashName)
    },
    dispatchKey(key) {
      for (const mode of api.mode.active.toReversed()) {
        const binding = api.layers
          .find((layer) => layer.mode === mode)
          ?.bindings
          ?.find((candidate) => candidate.key === key)
        if (binding?.cmd instanceof Function) return binding.cmd()
      }
    },
  }
  return api
}

test("token commands register native slash handlers without a model client", () => {
  const api = createTuiApi({ route: { name: "session", params: { sessionID: "s1" } } })

  registerTokenReportTui(api)

  assert.deepEqual(tokenReportCommands(api).map((command) => command.slashName), TOKEN_COMMANDS)
  assert.deepEqual(api.commands.map((command) => command.slashName), TOKEN_COMMANDS)
  assert.deepEqual(api.routes, [])
})

test("token commands persist a no-reply report in the active session", async () => {
  globalThis.__tokenTuiCompute = async () => ({
    kind: "invalid_arguments",
    command: "tokens_between",
    error: "controlled report",
  })
  const api = createTuiApi({ route: { name: "session", params: { sessionID: "s1" } } })

  try {
    registerControlledTokenReportTui(api)
    await api.commandBySlash("tokens_today").run()

    assert.deepEqual(api.sessionPrompts, [{
      path: { id: "s1" },
      body: { noReply: true, parts: [{ type: "text", text: "Invalid arguments for /tokens_between\n\ncontrolled report\n\nExpected: /tokens_between YYYY-MM-DD YYYY-MM-DD\nExample: /tokens_between 2026-01-01 2026-01-15" }] },
    }])
  } finally {
    delete globalThis.__tokenTuiCompute
  }
})

test("token command without a session shows a toast without a client call", async () => {
  const api = createTuiApi()

  registerControlledTokenReportTui(api)
  await api.commandBySlash("tokens_today").run()

  assert.equal(api.sessionPrompts.length, 0)
  assert.deepEqual(api.toasts, [{ message: "Open a session to view token usage" }])
})

test("tokens_between Enter confirms the native prompt", async () => {
  globalThis.__tokenTuiCompute = async () => ({
    kind: "invalid_arguments",
    command: "tokens_between",
    error: "controlled report",
  })
  const api = createTuiApi({ route: { name: "session", params: { sessionID: "s1" } } })

  try {
    registerControlledTokenReportTui(api)
    api.commandBySlash("tokens_between").run()
    api.dialogs[0].render()
    api.route.current = { name: "home" }
    const result = api.prompts[0].onConfirm("2026-01-01 2026-01-15")
    assert.equal(result, undefined)
    await new Promise((resolve) => setImmediate(resolve))

    assert.equal(api.sessionPrompts.length, 1)
    assert.equal(api.sessionPrompts[0].path.id, "s1")
    assert.equal(api.sessionPrompts[0].body.noReply, true)
    assert.equal(api.dialogs.at(-1).kind, "clear")
    assert.deepEqual(api.mode.pops, [api.mode.pushes[0]])
  } finally {
    delete globalThis.__tokenTuiCompute
  }
})

test("tokens_between Escape dispatches through the active range mode while its dialog is open", () => {
  const api = createTuiApi({ route: { name: "session", params: { sessionID: "s1" } } })

  registerControlledTokenReportTui(api)
  api.commandBySlash("tokens_between").run()
  assert.equal(api.mode.pushes.length, 1)
  const rangeMode = api.mode.pushes[0]
  api.dialogs[0].render()
  assert.deepEqual(api.mode.active, [rangeMode])
  api.dispatchKey("escape")

  assert.equal(api.dialogs.at(-1).kind, "clear")
  assert.deepEqual(api.mode.pops, [rangeMode])
  assert.deepEqual(api.mode.active, [])
  assert.equal(api.sessionPrompts.length, 0)
})

test("token command persists a computation error in the active session", async () => {
  globalThis.__tokenTuiCompute = async () => {
    throw new Error("controlled computation failure")
  }
  const api = createTuiApi({
    route: { name: "session", params: { sessionID: "s1" } },
  })

  registerControlledTokenReportTui(api)
  try {
    await api.commandBySlash("tokens_today").run()
    assert.deepEqual(api.sessionPrompts, [{
      path: { id: "s1" },
      body: { noReply: true, parts: [{ type: "text", text: "Token report failed: controlled computation failure" }] },
    }])
  } finally {
    delete globalThis.__tokenTuiCompute
  }
})

test("token command shows a toast when its no-reply write is rejected", async () => {
  globalThis.__tokenTuiCompute = async () => ({
    kind: "invalid_arguments",
    command: "tokens_between",
    error: "controlled report",
  })
  const api = createTuiApi({
    route: { name: "session", params: { sessionID: "s1" } },
    prompt: async () => { throw new Error("controlled write failure") },
  })

  try {
    registerControlledTokenReportTui(api)
    await api.commandBySlash("tokens_today").run()

    assert.equal(api.sessionPrompts.length, 1)
    assert.deepEqual(api.toasts, [{ message: "Unable to save token report" }])
  } finally {
    delete globalThis.__tokenTuiCompute
  }
})
