import assert from "node:assert/strict"
import test from "node:test"

const { composeQuotaPanel, selectedQuotaProviderID } = await import("../.tmp-test/quota-composition.mjs")

function provider({
  id,
  title,
  order,
  freshness = "ready",
  primaryPct,
  secondaryPct,
  windows = ["5H", "7D"],
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
      groups: [{ id: `${id}:quota`, order: 10, items }],
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
