import assert from "node:assert/strict"
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { resolve } from "node:path"
import test, { after } from "node:test"

const originalProviderEnvironment = {
  HOME: process.env.HOME,
  XDG_CONFIG_HOME: process.env.XDG_CONFIG_HOME,
  XDG_DATA_HOME: process.env.XDG_DATA_HOME,
}
const isolatedProviderHome = mkdtempSync(resolve(tmpdir(), "opencode-tools-zai-provider-"))
process.env.HOME = isolatedProviderHome
process.env.XDG_CONFIG_HOME = isolatedProviderHome
process.env.XDG_DATA_HOME = isolatedProviderHome

const { createZaiProvider, mapZaiPanelState } = await import("../.tmp-test/provider-zai.mjs")

after(async () => {
  await flushEffects()
  for (const [key, value] of Object.entries(originalProviderEnvironment)) {
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
  rmSync(isolatedProviderHome, { recursive: true, force: true })
})

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

function quotaResponse(nextResetTime = now + 60 * 60 * 1000) {
  return {
    ok: true,
    json: async () => ({
      code: 200,
      data: {
        level: "pro",
        limits: [{ type: "TOKENS_LIMIT", unit: 3, percentage: 25, nextResetTime }],
      },
    }),
  }
}

function adapterApi(overrides = {}) {
  return {
    state: {
      provider: [{ id: "zai-coding-plan", key: "test-key" }],
      session: { messages: () => [] },
      part: () => [],
    },
    kv: { get: () => undefined, set: () => {} },
    ...overrides,
  }
}

function createTestAdapter(t, { api = adapterApi(), fetch: testFetch, clock, providerOptions } = {}) {
  const originalFetch = globalThis.fetch
  if (testFetch) globalThis.fetch = testFetch
  const adapter = createZaiProvider(api, providerOptions)
  t.after(async () => {
    try {
      adapter.dispose()
      await flushEffects()
    } finally {
      globalThis.fetch = originalFetch
      clock?.restore()
    }
  })
  return adapter
}

function installFakeClock(start) {
  const originalNow = Date.now
  const originalSetTimeout = globalThis.setTimeout
  const originalClearTimeout = globalThis.clearTimeout
  const originalSetInterval = globalThis.setInterval
  const originalClearInterval = globalThis.clearInterval
  const timeouts = []
  const intervals = []
  let current = start

  Date.now = () => current
  globalThis.setTimeout = (callback, delay = 0) => {
    const timer = { kind: "timeout", callback, delay, active: true, unref() {} }
    timeouts.push(timer)
    return timer
  }
  globalThis.clearTimeout = (timer) => {
    assert.equal(timer?.kind, "timeout", "fake clearTimeout must receive a fake timeout")
    timer.active = false
  }
  globalThis.setInterval = (callback, delay = 0) => {
    const timer = { kind: "interval", callback, delay, active: true, unref() {} }
    intervals.push(timer)
    return timer
  }
  globalThis.clearInterval = (timer) => {
    assert.equal(timer?.kind, "interval", "fake clearInterval must receive a fake interval")
    timer.active = false
  }

  return {
    timeouts,
    intervals,
    advance(ms) {
      current += ms
    },
    restore() {
      const activeTimeouts = timeouts.filter((timer) => timer.active).length
      const activeIntervals = intervals.filter((timer) => timer.active).length
      Date.now = originalNow
      globalThis.setTimeout = originalSetTimeout
      globalThis.clearTimeout = originalClearTimeout
      globalThis.setInterval = originalSetInterval
      globalThis.clearInterval = originalClearInterval
      assert.equal(activeTimeouts, 0, "adapter cleanup must clear fake timeouts before clock restoration")
      assert.equal(activeIntervals, 0, "adapter cleanup must clear fake intervals before clock restoration")
    },
  }
}

async function flushEffects() {
  await new Promise((resolve) => setImmediate(resolve))
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
  assert.deepEqual(model.collapsedSummary, { kind: "text", text: "Peak (3x)", status: "error" })
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
  assert.deepEqual(model.collapsedSummary, { kind: "text", text: "Off-Peak (1x)", status: "success" })
})

test("exposes a framework-only provider adapter and semantic home summary", () => {
  const source = readFileSync("tui/providers/zai.ts", "utf8")
  const shared = existsSync("shared/opencode-tools-shared.ts") ? readFileSync("shared/opencode-tools-shared.ts", "utf8") : ""
  assert.doesNotMatch(source, /@opentui\/solid/)
  assert.doesNotMatch(source, /slots\.register/)
  assert.match(shared, /createZaiProvider/)
  assert.equal(typeof createZaiProvider, "function")
})

test("refreshes selected Z.AI quota when constructed outside a component owner", async (t) => {
  const api = {
    state: {
      provider: [{ id: "zai-coding-plan", key: "test-key" }],
      session: { messages: () => [] },
      part: () => [],
    },
    kv: { get: () => undefined, set: () => {} },
  }

  const adapter = createTestAdapter(t, {
    api,
    fetch: async () => ({
      ok: true,
      json: async () => ({
        code: 200,
        data: {
          level: "pro",
          limits: [{ type: "TOKENS_LIMIT", unit: 3, percentage: 25, nextResetTime: now + 60 * 60 * 1000 }],
        },
      }),
    }),
  })
  await new Promise((resolve) => setTimeout(resolve, 20))
  assert.equal(item(adapter.panel(), "zai:header").title, "Z.AI: Pro")
})

test("exposes reactive provider freshness alongside the compact Z.AI home summary", async (t) => {
  let available = true
  const adapter = createTestAdapter(t, {
    fetch: async () => available ? quotaResponse() : { ok: false },
  })

  await adapter.refresh()
  assert.equal(adapter.freshness(), "ready")
  assert.deepEqual(adapter.home(), { provider: "Z.AI", plan: "Pro", primaryPct: 75, secondaryPct: undefined })

  available = false
  await adapter.refresh()
  assert.equal(adapter.freshness(), "stale")
  assert.equal(adapter.home(), null)
})

test("uses the default and custom provider polling intervals while keeping the one-second clock", async (t) => {
  const defaultClock = installFakeClock(now)
  createTestAdapter(t, { clock: defaultClock, fetch: async () => quotaResponse() })
  await flushEffects()

  assert.ok(defaultClock.intervals.some((timer) => timer.active && timer.delay === 10_000))
  assert.ok(defaultClock.intervals.some((timer) => timer.active && timer.delay === 1_000))
})

test("uses a custom provider polling interval", async (t) => {
  const clock = installFakeClock(now)
  createTestAdapter(t, {
    clock,
    fetch: async () => quotaResponse(),
    providerOptions: { refreshIntervalMs: 2_500 },
  })
  await flushEffects()

  assert.ok(clock.intervals.some((timer) => timer.active && timer.delay === 2_500))
  assert.ok(clock.intervals.some((timer) => timer.active && timer.delay === 1_000))
})

test("skips repeated polling callbacks while a Z.AI refresh is pending and clears timers on dispose", async (t) => {
  const clock = installFakeClock(now)
  let requests = 0
  let resolveFetch
  const pendingResponse = new Promise((resolve) => {
    resolveFetch = resolve
  })
  const adapter = createTestAdapter(t, {
    clock,
    fetch: async () => {
      requests += 1
      return pendingResponse
    },
    providerOptions: { refreshIntervalMs: 2_500 },
  })
  await flushEffects()

  const poll = clock.intervals.find((timer) => timer.active && timer.delay === 2_500)
  assert.ok(poll)
  poll.callback()
  poll.callback()
  await flushEffects()

  adapter.dispose()
  assert.ok(clock.intervals.every((timer) => !timer.active))
  resolveFetch(quotaResponse())
  await flushEffects()
  assert.equal(requests, 1)
})

test("schedules a quota refresh at the 5H reset boundary", async (t) => {
  const clock = installFakeClock(now)
  let requests = 0
  const adapter = createTestAdapter(t, {
    clock,
    fetch: async () => {
      requests += 1
      return quotaResponse(now + 15 * 60 * 1000)
    },
  })

  await adapter.refresh()
  const boundary = clock.timeouts.find((timer) => timer.active && timer.delay === 15 * 60 * 1000)

  assert.ok(boundary)
  const beforeBoundaryRefresh = requests
  boundary.callback()
  await flushEffects()
  assert.equal(requests, beforeBoundaryRefresh + 1)
})

test("expires stale quota data after the stale window", async (t) => {
  const clock = installFakeClock(now)
  const adapter = createTestAdapter(t, {
    clock,
    fetch: async () => quotaResponse(),
  })

  await adapter.refresh()
  clock.advance(10 * 60 * 1000 + 1)
  const tick = clock.intervals.find((timer) => timer.active && timer.delay === 1_000)

  assert.ok(tick)
  tick.callback()
  assert.equal(item(adapter.panel(), "zai:header").title, "Z.AI (est)")
})

test("uses a reset timestamp from session messages when quota data is unavailable", async (t) => {
  const clock = installFakeClock(now)
  const stored = []
  const adapter = createTestAdapter(t, {
    clock,
    fetch: async () => ({ ok: false }),
    api: adapterApi({
      state: {
        provider: [{ id: "zai-coding-plan", key: "test-key" }],
        session: { messages: () => [{ id: "message-1" }] },
        part: () => [{ type: "text", text: "Your limit will reset at 2026-07-13 20:00:00" }],
      },
      kv: { get: () => undefined, set: (key, value) => stored.push([key, value]) },
    }),
  })
  await adapter.refresh()
  adapter.setSessionID("session-1")

  assert.deepEqual(stored, [["quota_zai_baseline_sgt", "2026-07-13 20:00:00"]])
  assert.equal(item(adapter.panel(), "zai:5h-reset").epoch, Date.UTC(2026, 6, 13, 12, 0, 0))
})
