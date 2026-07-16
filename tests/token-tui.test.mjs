import assert from "node:assert/strict"
import test from "node:test"

globalThis.React = {
  createElement(type, props, ...children) {
    return { type, props: { ...props, children: children.length === 1 ? children[0] : children } }
  },
}

const { registerTokenReportTui, tokenReportCommands } = await import("../.tmp-test/token-tui.mjs")

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

  const route = api.routeByName("aamkye.token-report")
  const element = route.render()
  const screen = element.type(element.props)
  assert.equal(screen.type, "box")
  assert.equal(screen.props.width, "100%")
  assert.equal(screen.props.overflow, "hidden")
  assert.equal(screen.props.children.type, "text")
  assert.equal(screen.props.children.props.children, "Loading token report...")
  assert.equal(api.prompts.length, 0)
})

test("token report Escape returns to its source session or home", () => {
  const sessionApi = createTuiApi({
    route: { name: "aamkye.token-report", params: { command: "tokens_today", sessionID: "s1" } },
  })
  registerTokenReportTui(sessionApi)
  sessionApi.layers.at(-1).bindings[0].cmd()
  assert.deepEqual(sessionApi.navigations, [{ name: "session", params: { sessionID: "s1" } }])

  const homeApi = createTuiApi({
    route: { name: "aamkye.token-report", params: { command: "tokens_today" } },
  })
  registerTokenReportTui(homeApi)
  homeApi.layers.at(-1).bindings[0].cmd()
  assert.deepEqual(homeApi.navigations, [{ name: "home" }])
})
