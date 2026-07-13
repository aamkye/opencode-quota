import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const { createZaiProvider, mapZaiPanelState } = await import("../.tmp-test/provider-zai.mjs")

const now = Date.UTC(2026, 6, 13, 6, 0, 0)

function quota(overrides = {}) {
  return {
    level: "Pro",
    tokenUsedPct: 25,
    tokenRemainingPct: 75,
    tokenNextResetEpoch: now + 60 * 60 * 1000,
    tokenAbsolute: { usedPct: 25, remainingPct: 75, nextResetEpoch: now + 60 * 60 * 1000, used: 250, total: 1_000 },
    weeklyLimit: {
      usedPct: 40,
      remainingPct: 60,
      nextResetEpoch: now + 6 * 24 * 60 * 60 * 1000,
      absolute: { usedPct: 40, remainingPct: 60, nextResetEpoch: now + 6 * 24 * 60 * 60 * 1000, used: 4_000, total: 10_000 },
    },
    timeLimit: {
      usedPct: 30,
      remainingPct: 70,
      nextResetEpoch: now + 2 * 60 * 60 * 1000,
      total: 50,
      used: 15,
      usageDetails: [{ modelCode: "glm-4.7", usage: 12 }],
    },
    ...overrides,
  }
}

function item(model, id) {
  return model.groups.flatMap((group) => group.items).find((candidate) => candidate.id === id)
}

test("maps ready Z.AI quota into semantic windows, values, and peak status", () => {
  const model = mapZaiPanelState({ phase: "ready", data: quota(), now })

  assert.equal(model.id, "zai")
  assert.equal(model.order, 110)
  assert.deepEqual(item(model, "zai:header"), {
    id: "zai:header",
    order: 10,
    kind: "header",
    title: "Z.AI: Pro",
    detail: "Peak (3x)",
    status: "error",
  })
  assert.deepEqual(item(model, "zai:5h"), {
    id: "zai:5h",
    order: 20,
    kind: "progress",
    label: "5H",
    value: 75,
    total: 100,
  })
  assert.deepEqual(item(model, "zai:7d"), {
    id: "zai:7d",
    order: 50,
    kind: "progress",
    label: "7D",
    value: 60,
    total: 100,
  })
  assert.equal(item(model, "zai:5h-used").value, 250)
  assert.equal(item(model, "zai:5h-total").value, 1_000)
  assert.equal(item(model, "zai:time-used").value, 15)
  assert.equal(item(model, "zai:time-total").value, 50)
  assert.equal(item(model, "zai:time-models").kind, "table")
})

test("maps loading and unavailable Z.AI states without hiding the provider", () => {
  assert.equal(item(mapZaiPanelState({ phase: "loading", now }), "zai:header").detail, "Loading Z.AI...")
  assert.equal(item(mapZaiPanelState({ phase: "unavailable", now }), "zai:header").detail, "No Z.AI account linked")
})

test("retains ready values and exposes stale state after a transient failure", () => {
  const ready = mapZaiPanelState({ phase: "ready", data: quota(), now })
  const stale = mapZaiPanelState({ phase: "stale", data: quota(), now })

  assert.deepEqual(item(stale, "zai:5h"), item(ready, "zai:5h"))
  assert.deepEqual(item(stale, "zai:7d"), item(ready, "zai:7d"))
  assert.deepEqual(item(stale, "zai:stale"), {
    id: "zai:stale",
    order: 15,
    kind: "text",
    text: "~stale",
    status: "warning",
  })
})

test("uses idle timers for unused full windows and countdown timers for exhausted windows", () => {
  const full = mapZaiPanelState({ phase: "ready", data: quota({ tokenUsedPct: 0, tokenRemainingPct: 100 }), now })
  const exhausted = mapZaiPanelState({ phase: "ready", data: quota({ tokenUsedPct: 100, tokenRemainingPct: 0 }), now })

  assert.equal(item(full, "zai:5h-reset").state, "idle")
  assert.equal(item(exhausted, "zai:5h").value, 0)
  assert.deepEqual(item(exhausted, "zai:5h-reset"), {
    id: "zai:5h-reset",
    order: 30,
    kind: "timer",
    label: "5H reset",
    state: "countdown",
    epoch: now + 60 * 60 * 1000,
  })
})

test("marks reset-boundary windows expired and maps off-peak to the success theme key", () => {
  const boundary = Date.UTC(2026, 6, 13, 0, 0, 0)
  const model = mapZaiPanelState({
    phase: "ready",
    data: quota({ tokenNextResetEpoch: boundary }),
    now: boundary,
  })

  assert.equal(item(model, "zai:5h-reset").state, "expired")
  assert.equal(item(model, "zai:header").detail, "Off-Peak (1x)")
  assert.equal(item(model, "zai:header").status, "success")
})

test("exposes a framework-only provider adapter and semantic home summary", () => {
  const source = readFileSync("tui/providers/zai.ts", "utf8")
  assert.doesNotMatch(source, /@opentui\/solid/)
  assert.doesNotMatch(source, /slots\.register/)
  assert.equal(typeof createZaiProvider, "function")
})

test("refreshes selected Z.AI quota when constructed outside a component owner", async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => ({
      code: 200,
      data: {
        level: "pro",
        limits: [{ type: "TOKENS_LIMIT", unit: 3, percentage: 25, nextResetTime: now + 60 * 60 * 1000 }],
      },
    }),
  })
  const api = {
    state: {
      provider: [{ id: "zai-coding-plan", key: "test-key" }],
      session: { messages: () => [] },
      part: () => [],
    },
    kv: { get: () => undefined, set: () => {} },
  }

  try {
    const adapter = createZaiProvider(api)
    await new Promise((resolve) => setTimeout(resolve, 20))
    assert.equal(item(adapter.panel(), "zai:header").title, "Z.AI: Pro")
  } finally {
    globalThis.fetch = originalFetch
  }
})
