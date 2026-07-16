import assert from "node:assert/strict"
import test from "node:test"

const { default: quotaPlugin } = await import("../.tmp-test/plugin-adapters-quota-fixture.mjs")
const { default: homePlugin } = await import("../.tmp-test/plugin-adapters-home-fixture.mjs")
const { default: tokenPlugin, registerTokenReportTui, tokenReportCommands } = await import("../.tmp-test/plugin-adapters-token-fixture.mjs")

function createLifecycle() {
  const controller = new AbortController()
  let cleanup = []
  let disposed = false

  return {
    api: {
      signal: controller.signal,
      onDispose(fn) {
        if (disposed) return () => {}
        cleanup.push(fn)
        return () => {
          cleanup = cleanup.filter((candidate) => candidate !== fn)
        }
      },
    },
    count() {
      return cleanup.length
    },
    async dispose() {
      if (disposed) return
      disposed = true
      controller.abort()
      const queue = cleanup.reverse()
      cleanup = []
      for (const fn of queue) await fn()
    },
  }
}

function createApi({ route = { name: "home" } } = {}) {
  const lifecycle = createLifecycle()
  const api = {
    lifecycle: lifecycle.api,
    slots: {
      registrations: [],
      register(input) {
        api.slots.registrations.push(input)
      },
    },
    keymap: {
      registrations: [],
      registerLayer(input) {
        api.keymap.registrations.push(input)
      },
    },
    mode: {
      active: [],
      push(mode) {
        api.mode.active.push(mode)
        return () => {
          const index = api.mode.active.lastIndexOf(mode)
          if (index >= 0) api.mode.active.splice(index, 1)
        }
      },
    },
    route: {
      current: route,
      registrations: [],
      register(routes) {
        api.route.registrations.push(...routes)
      },
      navigate() {},
    },
    ui: {
      toasts: [],
      toast(input) {
        api.ui.toasts.push(input)
      },
      dialog: {
        clears: 0,
        replacements: [],
        clear() {
          api.ui.dialog.clears += 1
        },
        replace(render, onClose) {
          api.ui.dialog.replacements.push({ render, onClose })
        },
      },
      DialogPrompt() {
        return null
      },
    },
    client: {
      prompts: [],
      session: {
        async prompt(input) {
          api.client.prompts.push(input)
        },
      },
    },
    state: {
      provider: [],
      session: {
        messages() {
          return []
        },
      },
      part() {
        return []
      },
    },
    event: {
      listeners: [],
      on(type, handler) {
        const listener = { type, handler }
        api.event.listeners.push(listener)
        return () => {
          api.event.listeners = api.event.listeners.filter((candidate) => candidate !== listener)
        }
      },
    },
    kv: {
      store: new Map(),
      get(key, fallback) {
        return api.kv.store.has(key) ? api.kv.store.get(key) : fallback
      },
      set(key, value) {
        api.kv.store.set(key, value)
      },
    },
    theme: {
      current: {
        error: "error",
        warning: "warning",
        success: "success",
        text: "text",
        textMuted: "muted",
      },
    },
  }

  return { api, lifecycle }
}

async function activate(plugin, options, api) {
  await plugin.tui(api, options)
}

test("quota adapter registers only the sidebar surface and cleans up selection listeners", async () => {
  const { api, lifecycle } = createApi()

  try {
    assert.equal(quotaPlugin.id, "aamkye/opencode-tools")
    await activate(quotaPlugin, undefined, api)

    assert.deepEqual(api.slots.registrations.map((registration) => Object.keys(registration.slots)), [["sidebar_content"]])
    assert.deepEqual(api.keymap.registrations, [])
    assert.deepEqual(api.route.registrations, [])
    assert.equal(api.event.listeners.length, 1)
    assert.ok(lifecycle.count() > 0)
  } finally {
    await lifecycle.dispose()
  }

  assert.equal(api.event.listeners.length, 0)
  assert.equal(lifecycle.count(), 0)
})

test("home adapter registers only the home surface and disposes its providers", async () => {
  const { api, lifecycle } = createApi()

  try {
    assert.equal(homePlugin.id, "aamkye/opencode-tools-home")
    await activate(homePlugin, undefined, api)

    assert.deepEqual(api.slots.registrations.map((registration) => Object.keys(registration.slots)), [["home_bottom"]])
    assert.deepEqual(api.keymap.registrations, [])
    assert.deepEqual(api.route.registrations, [])
    assert.equal(api.event.listeners.length, 0)
    assert.ok(lifecycle.count() > 0)
  } finally {
    await lifecycle.dispose()
  }

  assert.equal(api.event.listeners.length, 0)
  assert.equal(lifecycle.count(), 0)
})

test("token adapter registers only the two keymap layers", async () => {
  const { api, lifecycle } = createApi({ route: { name: "session", params: { sessionID: "session-1" } } })

  try {
    assert.equal(tokenPlugin.id, "aamkye/opencode-tools-token-report")
    await activate(tokenPlugin, undefined, api)

    assert.deepEqual(api.slots.registrations, [])
    assert.equal(api.keymap.registrations.length, 2)
    assert.deepEqual(api.keymap.registrations.map((layer) => layer.mode ?? "default"), ["default", "aamkye.token-report-range"])
    assert.deepEqual(tokenReportCommands(api).map((command) => command.slashName), [
      "tokens_today",
      "tokens_daily",
      "tokens_weekly",
      "tokens_monthly",
      "tokens_all",
      "tokens_session",
      "tokens_session_all",
      "tokens_between",
    ])
    assert.equal(api.route.registrations.length, 0)
    assert.equal(api.event.listeners.length, 0)
    assert.equal(lifecycle.count(), 0)
  } finally {
    await lifecycle.dispose()
  }

  assert.equal(api.event.listeners.length, 0)
  assert.equal(lifecycle.count(), 0)
})
