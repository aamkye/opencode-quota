import assert from "node:assert/strict"
import test from "node:test"
import { createRoot } from "solid-js"

globalThis.React = {
  createElement(type, props, ...children) {
    return { type, props: { ...props, children: children.length === 1 ? children[0] : children } }
  },
}

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

function createTuiApi({ route = { name: "home" } } = {}) {
  const api = {
    commands: [],
    dialogs: [],
    navigations: [],
    prompts: [],
    routes: [],
    keymap: {
      registerLayer(layer) {
        api.commands.push(...(layer.commands ?? []))
        api.layers.push(layer)
      },
    },
    layers: [],
    mode: {
      pushes: [],
      pops: [],
      push(mode) {
        api.mode.pushes.push(mode)
        return () => api.mode.pops.push(mode)
      },
    },
    route: {
      current: route,
      navigate(name, params) {
        api.navigations.push(params ? { name, params } : { name })
      },
      register(routes) {
        api.routes.push(...routes)
      },
    },
    ui: {
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
    routeByName(name) {
      return api.routes.find((route) => route.name === name)
    },
  }
  return api
}

function mountTokenReportRoute(api) {
  let dispose
  let screen
  createRoot((cleanup) => {
    dispose = cleanup
    const element = api.routeByName("aamkye.token-report").render()
    screen = element.type(element.props)
  })
  return { dispose, screen }
}

function routeText(screen) {
  const text = screen.props.children
  return text.type(text.props).props.children
}

async function waitForRouteText(screen, expected) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (routeText(screen) === expected) return
    await new Promise((resolve) => setImmediate(resolve))
  }
  assert.equal(routeText(screen), expected)
}

test("token commands register native slash handlers without a model client", () => {
  const api = createTuiApi({ route: { name: "session", params: { sessionID: "s1" } } })

  registerTokenReportTui(api)

  assert.deepEqual(tokenReportCommands(api).map((command) => command.slashName), TOKEN_COMMANDS)
  assert.deepEqual(api.commands.map((command) => command.slashName), TOKEN_COMMANDS)
  api.commandBySlash("tokens_today").run()
  assert.deepEqual(api.navigations, [{ name: "aamkye.token-report", params: { command: "tokens_today", sessionID: "s1" } }])
  assert.equal(api.prompts.length, 0)
})

test("tokens_between submits a native range prompt and keeps its source session", () => {
  const api = createTuiApi({ route: { name: "session", params: { sessionID: "s1" } } })

  registerTokenReportTui(api)
  api.commandBySlash("tokens_between").run()
  api.dialogs[0].render()
  api.prompts[0].onSubmit("2026-01-01 2026-01-15")

  assert.deepEqual(api.navigations, [{
    name: "aamkye.token-report",
    params: { command: "tokens_between", arguments: "2026-01-01 2026-01-15", sessionID: "s1" },
  }])
  assert.equal(api.prompts.length, 1)
  assert.equal(api.dialogs.at(-1).kind, "clear")
})

test("tokens_between cancellation closes the native dialog without navigating", () => {
  const api = createTuiApi({ route: { name: "session", params: { sessionID: "s1" } } })

  registerTokenReportTui(api)
  api.commandBySlash("tokens_between").run()
  api.dialogs[0].onClose()

  assert.deepEqual(api.navigations, [])
  assert.equal(api.dialogs.at(-1).kind, "clear")
})

test("token report route renders a full-width clipped loading screen without a model client", () => {
  const api = createTuiApi({
    route: { name: "aamkye.token-report", params: { command: "tokens_between", arguments: "not a date" } },
  })

  registerTokenReportTui(api)

  const { dispose, screen } = mountTokenReportRoute(api)
  assert.equal(screen.type, "box")
  assert.equal(screen.props.width, "100%")
  assert.equal(screen.props.overflow, "hidden")
  assert.equal(routeText(screen), "Loading token report...")
  assert.equal(api.prompts.length, 0)
  dispose()
})

test("token report activates a scoped Escape mode and cleans it up with the route", () => {
  const sessionApi = createTuiApi({
    route: { name: "aamkye.token-report", params: { command: "tokens_today", sessionID: "s1" } },
  })
  registerTokenReportTui(sessionApi)
  const escapeLayer = sessionApi.layers.find((layer) => layer.bindings?.[0]?.key === "escape")
  assert.equal(escapeLayer.mode, "aamkye.token-report")

  const { dispose } = mountTokenReportRoute(sessionApi)
  assert.deepEqual(sessionApi.mode.pushes, ["aamkye.token-report"])
  escapeLayer.bindings[0].cmd()
  assert.deepEqual(sessionApi.navigations, [{ name: "session", params: { sessionID: "s1" } }])
  dispose()
  assert.deepEqual(sessionApi.mode.pops, ["aamkye.token-report"])

  const homeApi = createTuiApi({
    route: { name: "aamkye.token-report", params: { command: "tokens_today" } },
  })
  registerTokenReportTui(homeApi)
  const homeEscapeLayer = homeApi.layers.find((layer) => layer.bindings?.[0]?.key === "escape")
  const homeRoute = mountTokenReportRoute(homeApi)
  homeEscapeLayer.bindings[0].cmd()
  assert.deepEqual(homeApi.navigations, [{ name: "home" }])
  homeRoute.dispose()
})

test("token report route renders settled successful computations", async () => {
  globalThis.__tokenTuiCompute = async () => ({
    kind: "invalid_arguments",
    command: "tokens_between",
    error: "controlled success",
  })
  const api = createTuiApi({
    route: { name: "aamkye.token-report", params: { command: "tokens_between" } },
  })

  registerControlledTokenReportTui(api)
  const { dispose, screen } = mountTokenReportRoute(api)
  try {
    await waitForRouteText(
      screen,
      "Invalid arguments for /tokens_between\n\ncontrolled success\n\nExpected: /tokens_between YYYY-MM-DD YYYY-MM-DD\nExample: /tokens_between 2026-01-01 2026-01-15",
    )
  } finally {
    dispose()
    delete globalThis.__tokenTuiCompute
  }
})

test("token report route renders computation errors", async () => {
  globalThis.__tokenTuiCompute = async () => {
    throw new Error("controlled computation failure")
  }
  const api = createTuiApi({
    route: { name: "aamkye.token-report", params: { command: "tokens_today" } },
  })

  registerControlledTokenReportTui(api)
  const { dispose, screen } = mountTokenReportRoute(api)
  try {
    await waitForRouteText(screen, "Token report failed: controlled computation failure")
  } finally {
    dispose()
    delete globalThis.__tokenTuiCompute
  }
})
