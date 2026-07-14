import assert from "node:assert/strict"
import test from "node:test"

const { default: quotaPlugin, composeQuotaPanel, selectedQuotaProviderID } = await import("../.tmp-test/quota-composition.mjs")
const { normalizePanelModel } = await import("../.tmp-test/presentation-renderer.mjs")

function provider({
  id,
  title,
  order,
  freshness = "ready",
  primaryPct,
  secondaryPct,
  windows = ["5H", "7D"],
  groups,
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
    refresh: async () => {},
    setSessionID: () => {},
  }
}

function headers(group) {
  return group.items.filter((item) => item.kind === "header").map((item) => item.title)
}

function item(model, id) {
  return model.groups.flatMap((group) => group.items).find((candidate) => candidate.id === id)
}

async function aggregatePanel(t, options) {
  const registrations = []
  const cleanup = []
  const originalFetch = globalThis.fetch
  const originalReact = globalThis.React
  const originalError = console.error
  globalThis.React = { createElement: (component, props) => ({ component, props }) }
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => ({
      code: 200,
      data: {
        level: "pro",
        limits: [{ type: "TOKENS_LIMIT", unit: 3, percentage: 25, nextResetTime: Date.now() + 60 * 60 * 1000 }],
      },
    }),
  })
  console.error = () => {}
  t.after(() => {
    globalThis.fetch = originalFetch
    globalThis.React = originalReact
    console.error = originalError
  })

  const api = {
    state: {
      provider: [{ id: "zai-coding-plan", key: "test-key" }],
      session: { messages: () => [] },
      part: () => [],
    },
    kv: { get: () => undefined, set: () => {} },
    lifecycle: {
      signal: new AbortController().signal,
      onDispose(fn) {
        cleanup.push(fn)
        return () => {}
      },
    },
    theme: { current: { error: "error", warning: "warning", success: "success", text: "text", textMuted: "muted" } },
    slots: { register: (registration) => registrations.push(registration) },
  }

  await quotaPlugin.tui(api, options)
  t.after(() => cleanup.reverse().forEach((dispose) => dispose()))
  await new Promise((resolve) => setImmediate(resolve))
  const element = registrations[0].slots.sidebar_content({}, { session_id: "session-1" })
  return element.props.model()
}

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

test("orders unknown quota window labels alphabetically after known durations", () => {
  const zai = provider({ id: "zai", title: "Z.AI", order: 110, primaryPct: 50, windows: ["Zeta", "5H", "Alpha"] })
  const model = composeQuotaPanel("zai", [zai])
  const labels = model.groups[0].items.filter((item) => item.kind === "progress").map((item) => item.label)

  assert.deepEqual(labels, ["5H", "Alpha", "Zeta"])
})

test("maps native credential provider IDs to their aggregate adapters", () => {
  const zai = provider({ id: "zai", title: "Z.AI", order: 110 })
  const openai = provider({ id: "openai", title: "OpenAI", order: 120 })

  assert.equal(selectedQuotaProviderID([{ id: "zai-coding-plan" }], [zai, openai]), "zai")
  assert.equal(selectedQuotaProviderID([{ id: "codex" }], [zai, openai]), "openai")
})

test("falls back to remaining descending options when native values are invalid", async (t) => {
  const model = await aggregatePanel(t, { otherProviders: { percentageMode: "invalid", sortDirection: "sideways" } })

  assert.equal(item(model, "zai:5h").value, 75)
})

test("forwards native TUI options into aggregate composition", async (t) => {
  const model = await aggregatePanel(t, { otherProviders: { percentageMode: "used", sortDirection: "asc" } })

  assert.equal(item(model, "zai:5h").value, 25)
})
