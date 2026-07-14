import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { resolve } from "node:path"
import test, { after } from "node:test"

const originalProviderEnvironment = {
  HOME: process.env.HOME,
  XDG_CONFIG_HOME: process.env.XDG_CONFIG_HOME,
  XDG_DATA_HOME: process.env.XDG_DATA_HOME,
}
const isolatedProviderHome = mkdtempSync(resolve(tmpdir(), "opencode-tools-quota-composition-"))
process.env.HOME = isolatedProviderHome
process.env.XDG_CONFIG_HOME = isolatedProviderHome
process.env.XDG_DATA_HOME = isolatedProviderHome

const { default: quotaPlugin, composeQuotaPanel, normalizeQuotaOptions, selectedQuotaProviderID, selectedSessionQuotaProviderID } = await import("../.tmp-test/quota-composition.mjs")
const { createQuotaSelectionHost, mountQuotaSelection } = await import("../.tmp-test/quota-selection.mjs")
const { normalizePanelModel } = await import("../.tmp-test/presentation-renderer.mjs")

after(async () => {
  await flushEffects()
  for (const [key, value] of Object.entries(originalProviderEnvironment)) {
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
  rmSync(isolatedProviderHome, { recursive: true, force: true })
})

async function flushEffects() {
  await Promise.resolve()
  await new Promise((resolve) => setImmediate(resolve))
}

function provider({
  id,
  title,
  order,
  freshness = "ready",
  primaryPct,
  secondaryPct,
  windows = ["5H", "7D"],
  groups,
  onRefresh = async () => {},
  onDispose = () => {},
}) {
  const items = [
    { id: `${id}:header`, order: 10, kind: "header", title },
    ...windows.flatMap((label, index) => [
      { id: `${id}:${label}`, order: 20 + index * 20, kind: "progress", label, value: primaryPct ?? 0, total: 100 },
      { id: `${id}:${label}:reset`, order: 30 + index * 20, kind: "timer", label: `${label} reset`, state: "idle" },
    ]),
  ]

  return {
    id,
    order,
    panel: () => ({
      id,
      order,
      title,
      collapsedSummary: typeof primaryPct === "number" ? { kind: "text", text: `${primaryPct}%` } : undefined,
      groups: groups ?? [{ id: `${id}:quota`, order: 10, items }],
    }),
    home: () => typeof primaryPct === "number" ? { provider: title, plan: "Plan", primaryPct, secondaryPct } : null,
    freshness: () => freshness,
    refresh: onRefresh,
    setSessionID: () => {},
    dispose: onDispose,
  }
}

function headers(group) {
  return group.items.filter((item) => item.kind === "header").map((item) => item.title)
}

function item(model, id) {
  return model.groups.flatMap((group) => group.items).find((candidate) => candidate.id === id)
}

test("normalizes native polling and progress color defaults", () => {
  assert.deepEqual(normalizeQuotaOptions(), {
    percentageMode: "remaining",
    sortDirection: "desc",
    refreshIntervalMs: 10_000,
    progressColors: { enabled: true, errorBelow: 10, warningBelow: 30 },
  })
})

test("normalizes custom thresholds and rejects invalid native options", () => {
  assert.deepEqual(normalizeQuotaOptions({
    refreshIntervalSeconds: 2.5,
    progressColors: { enabled: false, errorBelow: -5, warningBelow: 120 },
    otherProviders: { percentageMode: "used", sortDirection: "asc" },
  }), {
    percentageMode: "used",
    sortDirection: "asc",
    refreshIntervalMs: 2_500,
    progressColors: { enabled: false, errorBelow: 0, warningBelow: 100 },
  })

  assert.deepEqual(normalizeQuotaOptions({
    refreshIntervalSeconds: 0,
    progressColors: { enabled: "yes", errorBelow: 80, warningBelow: 20 },
  }), {
    percentageMode: "remaining",
    sortDirection: "desc",
    refreshIntervalMs: 10_000,
    progressColors: { enabled: true, errorBelow: 10, warningBelow: 30 },
  })
})

test("colors progress by remaining quota even when displaying used quota", () => {
  const selected = provider({ id: "zai", title: "Z.AI", order: 110, primaryPct: 8, secondaryPct: 25 })
  const model = composeQuotaPanel("zai", [selected], {
    percentageMode: "used",
    progressColors: { errorBelow: 10, warningBelow: 30 },
  })

  assert.equal(item(model, "zai:5H").value, 92)
  assert.equal(item(model, "zai:5H").status, "error")
  assert.equal(item(model, "zai:7D").status, "error")
  assert.equal(model.collapsedSummary.text, "92%/75%")
  assert.equal(model.collapsedSummary.status, "error")
})

test("uses custom thresholds and omits semantic status when colors are disabled", () => {
  const selected = provider({ id: "zai", title: "Z.AI", order: 110, primaryPct: 40 })
  const warning = composeQuotaPanel("zai", [selected], {
    progressColors: { errorBelow: 20, warningBelow: 50 },
  })
  const disabled = composeQuotaPanel("zai", [selected], {
    progressColors: { enabled: false },
  })

  assert.equal(item(warning, "zai:5H").status, "warning")
  assert.equal(warning.collapsedSummary.status, "warning")
  assert.equal("status" in item(disabled, "zai:5H"), false)
  assert.equal("status" in disabled.collapsedSummary, false)
})

async function aggregatePanel(t, options, observations = { intervals: [], requests: [] }) {
  const registrations = []
  const cleanup = []
  const originalFetch = globalThis.fetch
  const originalSetInterval = globalThis.setInterval
  const originalClearInterval = globalThis.clearInterval
  const originalReact = globalThis.React
  const originalError = console.error
  const testFetch = async (url, requestOptions) => {
    if (url === "https://api.z.ai/api/monitor/usage/quota/limit") {
      observations.requests.push({ provider: "zai", authorization: requestOptions.headers.Authorization })
      return {
        ok: true,
        json: async () => ({
          code: 200,
          data: {
            level: "pro",
            limits: [{ type: "TOKENS_LIMIT", unit: 3, percentage: 25, nextResetTime: Date.now() + 60 * 60 * 1000 }],
          },
        }),
      }
    }
    if (url === "https://chatgpt.com/backend-api/wham/usage") {
      observations.requests.push({ provider: "openai", authorization: requestOptions.headers.Authorization })
      return {
        ok: true,
        json: async () => ({
          plan_type: "plus",
          rate_limit: {
            primary_window: { used_percent: 25, limit_window_seconds: 18_000, reset_after_seconds: 3_600 },
          },
        }),
      }
    }
    throw new Error(`Unexpected quota URL: ${url}`)
  }
  globalThis.React = { createElement: (component, props) => ({ component, props }) }
  globalThis.fetch = testFetch
  globalThis.setInterval = (callback, delay, ...args) => {
    const timer = originalSetInterval(callback, delay, ...args)
    observations.intervals.push({ timer, callback, delay, active: true })
    return timer
  }
  globalThis.clearInterval = (timer) => {
    const interval = observations.intervals.find((candidate) => candidate.timer === timer)
    if (interval) interval.active = false
    return originalClearInterval(timer)
  }
  console.error = () => {}
  t.after(async () => {
    try {
      for (const dispose of cleanup.reverse()) await dispose()
      await flushEffects()
    } finally {
      globalThis.fetch = originalFetch
      globalThis.setInterval = originalSetInterval
      globalThis.clearInterval = originalClearInterval
      globalThis.React = originalReact
      console.error = originalError
    }
  })

  const api = {
    state: {
      provider: [
        { id: "zai-coding-plan", key: "test-zai-key" },
        { id: "openai", key: "test-openai-token" },
      ],
      session: { messages: () => [] },
      part: () => [],
    },
    kv: { get: () => undefined, set: () => {} },
    lifecycle: {
      signal: new AbortController().signal,
      onDispose(fn) {
        cleanup.push(() => {
          assert.equal(globalThis.fetch, testFetch, "adapter cleanup must run before fetch restoration")
          fn()
        })
        return () => {}
      },
    },
    theme: { current: { error: "error", warning: "warning", success: "success", text: "text", textMuted: "muted" } },
    slots: { register: (registration) => registrations.push(registration) },
  }

  await quotaPlugin.tui(api, options)
  await flushEffects()
  const element = registrations[0].slots.sidebar_content({}, { session_id: "session-1" })
  await flushEffects()
  return element.props.model()
}

test("forwards normalized refreshIntervalSeconds to both providers", async (t) => {
  const observations = { intervals: [], requests: [] }
  await aggregatePanel(t, { refreshIntervalSeconds: 2.5 }, observations)
  const activePolls = observations.intervals.filter((timer) => timer.active && timer.delay === 2_500)

  assert.equal(activePolls.length, 2)
  const polledProviders = []
  for (const poll of activePolls) {
    const requestCount = observations.requests.length
    poll.callback()
    await flushEffects()
    const requests = observations.requests.slice(requestCount)
    assert.equal(requests.length, 1)
    polledProviders.push(requests[0])
  }
  assert.deepEqual(polledProviders.sort((left, right) => left.provider.localeCompare(right.provider)), [
    { provider: "openai", authorization: "Bearer test-openai-token" },
    { provider: "zai", authorization: "Bearer test-zai-key" },
  ])
  assert.equal(observations.intervals.filter((timer) => timer.active && timer.delay === 2_500).length, 2)
})

test("keeps the selected supported provider first while loading or unavailable", () => {
  const openai = provider({ id: "openai", title: "OpenAI", order: 120, primaryPct: 75 })

  for (const freshness of ["loading", "unavailable"]) {
    const zai = provider({ id: "zai", title: "Z.AI", order: 110, freshness })
    const model = composeQuotaPanel("zai", [openai, zai])

    assert.equal(model.title, "Quota")
    assert.equal(model.groups[0].id, "zai:quota")
    assert.deepEqual(headers(model.groups[0]), ["Z.AI"])
    assert.equal(model.groups[1].header.title, "Other providers")
    assert.deepEqual(headers(model.groups[1]), ["OpenAI"])
  }
})

test("uses remaining percentages and descending secondary order by default", () => {
  const zai = provider({ id: "zai", title: "Z.AI", order: 110, primaryPct: 60, secondaryPct: 40 })
  const alpha = provider({ id: "alpha", title: "Alpha", order: 130, primaryPct: 20 })
  const beta = provider({ id: "beta", title: "Beta", order: 140, primaryPct: 80 })
  const unavailable = provider({ id: "offline", title: "Offline", order: 100, freshness: "unavailable", primaryPct: 99 })

  const model = composeQuotaPanel("zai", [alpha, unavailable, beta, zai])
  const others = model.groups.find((group) => group.id === "other-providers")

  assert.equal(model.collapsedSummary.text, "60%/40%")
  assert.deepEqual(headers(others), ["Beta", "Alpha"])
  assert.ok(!headers(others).includes("Offline"))
})

test("falls back to descending selected metrics when sort direction is invalid", () => {
  const zai = provider({ id: "zai", title: "Z.AI", order: 110, primaryPct: 50 })
  const alpha = provider({ id: "alpha", title: "Alpha", order: 130, primaryPct: 20 })
  const beta = provider({ id: "beta", title: "Beta", order: 140, primaryPct: 80 })
  const gamma = provider({ id: "gamma", title: "Gamma", order: 150, primaryPct: 40 })

  const model = composeQuotaPanel("zai", [alpha, beta, gamma, zai], {
    percentageMode: "used",
    sortDirection: "sideways",
  })
  const others = model.groups.find((group) => group.id === "other-providers")

  assert.deepEqual(headers(others), ["Alpha", "Gamma", "Beta"])
})

test("uses selected used percentages and ascending secondary order when configured", () => {
  const openai = provider({ id: "openai", title: "OpenAI", order: 120, primaryPct: 70, secondaryPct: 20 })
  const alpha = provider({ id: "alpha", title: "Alpha", order: 130, primaryPct: 20 })
  const beta = provider({ id: "beta", title: "Beta", order: 140, primaryPct: 80 })

  const model = composeQuotaPanel("openai", [alpha, beta, openai], {
    percentageMode: "used",
    sortDirection: "asc",
  })
  const others = model.groups.find((group) => group.id === "other-providers")

  assert.equal(model.groups[0].id, "openai:quota")
  assert.equal(model.collapsedSummary.text, "30%/80%")
  assert.deepEqual(headers(others), ["Beta", "Alpha"])
  assert.equal(others.items.find((item) => item.id === "beta:5H").value, 20)
})

test("orders configured secondary metrics by direction and keeps each header with its quota rows", () => {
  const zai = provider({ id: "zai", title: "Z.AI", order: 110, primaryPct: 50 })
  const alpha = provider({
    id: "alpha",
    title: "Alpha",
    order: 130,
    primaryPct: 70,
    groups: [
      {
        id: "alpha:secondary",
        order: 10,
        items: [
          { id: "alpha:header", order: 10, kind: "header", title: "Alpha" },
          { id: "alpha:7D", order: 20, kind: "progress", label: "7D", value: 70, total: 100 },
          { id: "alpha:7D:reset", order: 30, kind: "timer", label: "7D reset", state: "idle" },
        ],
      },
      {
        id: "alpha:primary",
        order: 20,
        items: [
          { id: "alpha:5H", order: 20, kind: "progress", label: "5H", value: 70, total: 100 },
          { id: "alpha:5H:reset", order: 30, kind: "timer", label: "5H reset", state: "idle" },
        ],
      },
    ],
  })
  const beta = provider({ id: "beta", title: "Beta", order: 140, primaryPct: 40 })
  const gamma = provider({ id: "gamma", title: "Gamma", order: 150, primaryPct: 70 })

  const model = composeQuotaPanel("zai", [beta, gamma, alpha, zai], {
    percentageMode: "used",
    sortDirection: "asc",
  })
  const others = normalizePanelModel(model).groups.find((group) => group.id === "other-providers")

  assert.deepEqual(others.items.map((entry) => entry.id), [
    "alpha:header", "alpha:5H", "alpha:5H:reset", "alpha:7D", "alpha:7D:reset",
    "gamma:header", "gamma:5H", "gamma:5H:reset", "gamma:7D", "gamma:7D:reset",
    "beta:header", "beta:5H", "beta:5H:reset", "beta:7D", "beta:7D:reset",
  ])
})

test("orders every quota window shortest-first", () => {
  const zai = provider({ id: "zai", title: "Z.AI", order: 110, primaryPct: 50, windows: ["1M", "5H", "7D"] })
  const model = composeQuotaPanel("zai", [zai])
  const labels = model.groups[0].items.filter((item) => item.kind === "progress").map((item) => item.label)

  assert.deepEqual(labels, ["5H", "7D", "1M"])
})

test("keeps window details attached and leaves unknown tool quota last", () => {
  const zai = provider({
    id: "zai",
    title: "Z.AI",
    order: 110,
    primaryPct: 75,
    groups: [{
      id: "zai:quota",
      order: 10,
      items: [
        { id: "zai:header", order: 10, kind: "header", title: "Z.AI: Pro", detail: "Peak (3x)", status: "error" },
        { id: "zai:7d", order: 50, kind: "progress", label: "7D", value: 60, total: 100 },
        { id: "zai:7d-reset", order: 60, kind: "timer", label: "7D reset", state: "idle" },
        { id: "zai:7d-used", order: 61, kind: "quantity", label: "7D used", value: 4000, unit: "count" },
        { id: "zai:5h", order: 20, kind: "progress", label: "5H", value: 75, total: 100 },
        { id: "zai:5h-reset", order: 30, kind: "timer", label: "5H reset", state: "idle" },
        { id: "zai:5h-used", order: 31, kind: "quantity", label: "5H used", value: 250, unit: "count" },
        { id: "zai:time", order: 80, kind: "progress", label: "T", value: 70, total: 100 },
        { id: "zai:time-reset", order: 90, kind: "timer", label: "Tool reset", state: "idle" },
        { id: "zai:time-models", order: 95, kind: "table", columns: [], rows: [] },
      ],
    }],
  })

  const items = composeQuotaPanel("zai", [zai]).groups[0].items
  assert.deepEqual(items.map((entry) => entry.id), [
    "zai:header",
    "zai:5h", "zai:5h-reset", "zai:5h-used",
    "zai:7d", "zai:7d-reset", "zai:7d-used",
    "zai:time", "zai:time-reset", "zai:time-models",
  ])
})

test("keeps unknown quota window labels in source order after known durations", () => {
  const zai = provider({ id: "zai", title: "Z.AI", order: 110, primaryPct: 50, windows: ["Zeta", "5H", "Alpha"] })
  const model = composeQuotaPanel("zai", [zai])
  const labels = model.groups[0].items.filter((item) => item.kind === "progress").map((item) => item.label)

  assert.deepEqual(labels, ["5H", "Zeta", "Alpha"])
})

test("maps native credential provider IDs to their aggregate adapters", () => {
  const zai = provider({ id: "zai", title: "Z.AI", order: 110 })
  const openai = provider({ id: "openai", title: "OpenAI", order: 120 })

  assert.equal(selectedQuotaProviderID([{ id: "zai-coding-plan" }], [zai, openai]), "zai")
  assert.equal(selectedQuotaProviderID([{ id: "codex" }], [zai, openai]), "openai")
})

test("resolves the newest supported user model and falls back without usable metadata", () => {
  const zai = provider({ id: "zai", title: "Z.AI", order: 110 })
  const openai = provider({ id: "openai", title: "OpenAI", order: 120 })
  const providers = [zai, openai]

  assert.equal(selectedSessionQuotaProviderID([
    { id: "m1", role: "user", model: { providerID: "zai-coding-plan", modelID: "glm-4.7" } },
    { id: "m2", role: "assistant" },
    { id: "m3", role: "user", model: { providerID: "codex", modelID: "gpt-5" } },
  ], providers, "zai"), "openai")
  assert.equal(selectedSessionQuotaProviderID([], providers, "zai"), "zai")
  assert.equal(selectedSessionQuotaProviderID([
    { id: "m4", role: "user", model: { providerID: "unsupported", modelID: "other" } },
  ], providers, "zai"), "zai")
})

test("reacts to host messages without refreshing repeated or same-provider sidebar selections", async () => {
  const refreshes = []
  const zai = provider({ id: "zai", title: "Z.AI", order: 110, primaryPct: 60, onRefresh: async () => refreshes.push("zai") })
  const openai = provider({ id: "openai", title: "OpenAI", order: 120, primaryPct: 70, onRefresh: async () => refreshes.push("openai") })
  const host = createQuotaSelectionHost({
    provider: [{ id: "zai-coding-plan" }],
    messages: {
      "session-1": [{ id: "z1", role: "user", model: { providerID: "zai-coding-plan", modelID: "glm-4.7" } }],
    },
  })

  const selection = mountQuotaSelection(host.api, [zai, openai])

  try {
    selection.renderSidebar("session-1")
    await flushEffects()
    selection.renderSidebar("session-1")
    await flushEffects()
    host.setMessages("session-1", [
      { id: "z2", role: "user", model: { providerID: "zai-coding-plan", modelID: "glm-4.7-flash" } },
    ])
    await flushEffects()
    host.setMessages("session-1", [
      { id: "o1", role: "user", model: { providerID: "openai", modelID: "gpt-5" } },
    ])
    await flushEffects()

    assert.deepEqual(refreshes, ["zai", "openai"])
    const model = composeQuotaPanel(selection.selectedProviderID(), [zai, openai])
    assert.equal(model.groups[0].id, "openai:quota")
    assert.equal(model.groups[1].header.title, "Other providers")
    assert.equal(JSON.stringify(model).includes("gpt-5"), false)
  } finally {
    await host.dispose()
  }
})

test("uses reactive fallback for unreadable messages and stops refreshing after lifecycle disposal", async () => {
  const refreshes = []
  const disposals = []
  const zai = provider({
    id: "zai",
    title: "Z.AI",
    order: 110,
    onRefresh: async () => refreshes.push("zai"),
    onDispose: () => disposals.push("zai"),
  })
  const openai = provider({
    id: "openai",
    title: "OpenAI",
    order: 120,
    onRefresh: async () => refreshes.push("openai"),
    onDispose: () => disposals.push("openai"),
  })
  const providers = [zai, openai]
  const host = createQuotaSelectionHost({
    provider: [{ id: "zai-coding-plan" }],
    messages: {
      "session-1": [{ id: "o1", role: "user", model: { providerID: "openai", modelID: "gpt-5" } }],
    },
  })
  host.api.lifecycle.onDispose(() => providers.forEach((adapter) => adapter.dispose()))
  const selection = mountQuotaSelection(host.api, providers)

  selection.renderSidebar("session-1")
  await flushEffects()
  host.setUnreadableMessages(true)
  await flushEffects()
  assert.equal(selection.selectedProviderID(), "zai")
  host.setProvider([{ id: "openai" }])
  await flushEffects()

  assert.equal(selection.selectedProviderID(), "openai")
  assert.deepEqual(refreshes, ["openai", "zai", "openai"])
  assert.equal(host.lifecycleCount(), 2)

  await host.dispose()
  host.setProvider([{ id: "zai-coding-plan" }])
  host.setUnreadableMessages(false)
  host.setMessages("session-1", [
    { id: "z2", role: "user", model: { providerID: "zai-coding-plan", modelID: "glm-4.7" } },
  ])
  await flushEffects()

  assert.deepEqual(refreshes, ["openai", "zai", "openai"])
  assert.deepEqual(disposals, ["zai", "openai"])
})

test("disposes the selection root when lifecycle registration fails during activation", async () => {
  const host = createQuotaSelectionHost({
    provider: [{ id: "zai-coding-plan" }],
    messages: {},
    disposeRegistrationError: new Error("lifecycle registration failed"),
  })
  const zai = provider({ id: "zai", title: "Z.AI", order: 110 })

  assert.throws(
    () => mountQuotaSelection(host.api, [zai]),
    /lifecycle registration failed/,
  )
  const readsAfterFailure = host.providerReadCount()
  host.setProvider([{ id: "openai" }])
  await flushEffects()

  assert.equal(host.providerReadCount(), readsAfterFailure)
})

test("does not retain a selection root when activation reaches an already disposed lifecycle", async () => {
  const host = createQuotaSelectionHost({
    provider: [{ id: "zai-coding-plan" }],
    messages: {},
  })
  const zai = provider({ id: "zai", title: "Z.AI", order: 110 })
  await host.dispose()

  mountQuotaSelection(host.api, [zai])
  const readsAfterActivation = host.providerReadCount()
  host.setProvider([{ id: "openai" }])
  await flushEffects()

  assert.equal(host.providerReadCount(), readsAfterActivation)
})

test("falls back to remaining descending options when native values are invalid", async (t) => {
  const model = await aggregatePanel(t, { otherProviders: { percentageMode: "invalid", sortDirection: "sideways" } })

  assert.equal(item(model, "zai:5h").value, 75)
})

test("forwards native TUI options into aggregate composition", async (t) => {
  const model = await aggregatePanel(t, { otherProviders: { percentageMode: "used", sortDirection: "asc" } })

  assert.equal(item(model, "zai:5h").value, 25)
})
