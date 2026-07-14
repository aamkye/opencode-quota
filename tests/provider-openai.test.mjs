import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import test from "node:test"

const { createOpenAiProvider, fetchOpenAiQuota, mapOpenAiPanelState } = await import("../.tmp-test/provider-openai.mjs")

const now = Date.UTC(2026, 6, 13, 6, 0, 0)

function window(overrides = {}) {
  return {
    used_percent: 25,
    limit_window_seconds: 18_000,
    reset_after_seconds: 3_600,
    reset_at: (now + 3_600_000) / 1_000,
    ...overrides,
  }
}

function quota(overrides = {}) {
  return {
    planType: "Plus",
    primary: window(),
    secondary: null,
    codeReview: null,
    limitReached: false,
    creditsBalance: null,
    creditsUnlimited: false,
    ...overrides,
  }
}

function item(model, id) {
  return model.groups.flatMap((group) => group.items).find((candidate) => candidate.id === id)
}

function quotaResponse(primary = window()) {
  return {
    ok: true,
    json: async () => ({
      plan_type: "plus",
      rate_limit: { primary_window: primary },
    }),
  }
}

function adapterApi() {
  return {
    state: {
      provider: [{ id: "openai", key: "test-token" }],
      session: { messages: () => [] },
      part: () => [],
    },
    kv: { get: () => undefined, set: () => {} },
  }
}

function installFakeClock(t, start) {
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
    const timer = { callback, delay, active: true, unref() {} }
    timeouts.push(timer)
    return timer
  }
  globalThis.clearTimeout = (timer) => {
    timer.active = false
  }
  globalThis.setInterval = (callback, delay = 0) => {
    const timer = { callback, delay, active: true, unref() {} }
    intervals.push(timer)
    return timer
  }
  globalThis.clearInterval = (timer) => {
    timer.active = false
  }
  t.after(() => {
    Date.now = originalNow
    globalThis.setTimeout = originalSetTimeout
    globalThis.clearTimeout = originalClearTimeout
    globalThis.setInterval = originalSetInterval
    globalThis.clearInterval = originalClearInterval
  })

  return {
    timeouts,
    intervals,
    advance(ms) {
      current += ms
    },
  }
}

async function flushEffects() {
  await new Promise((resolve) => setImmediate(resolve))
}

test("maps primary-only OpenAI quota into a semantic panel and compact summary", () => {
  const model = mapOpenAiPanelState({ phase: "ready", data: quota(), now })

  assert.equal(model.id, "openai")
  assert.equal(model.order, 120)
  assert.deepEqual(item(model, "openai:header"), {
    id: "openai:header",
    order: 10,
    kind: "header",
    title: "OpenAI: Plus",
  })
  assert.deepEqual(model.collapsedSummary, { kind: "text", text: "75%", status: "success" })
  assert.deepEqual(item(model, "openai:5h"), {
    id: "openai:5h",
    order: 20,
    kind: "progress",
    label: "5H",
    value: 75,
    total: 100,
  })
  assert.deepEqual(item(model, "openai:5h-reset"), {
    id: "openai:5h-reset",
    order: 30,
    kind: "timer",
    label: "5H reset",
    state: "countdown",
    epoch: now + 3_600_000,
  })
  assert.equal(item(model, "openai:7d"), undefined)
  assert.equal(item(model, "openai:review"), undefined)
  assert.equal(item(model, "openai:credits"), undefined)
})

test("maps secondary OpenAI quota and preserves normalized Plus, Pro, and Pro Lite labels", () => {
  const model = mapOpenAiPanelState({
    phase: "ready",
    data: quota({ planType: "Pro Lite", secondary: window({ used_percent: 40 }) }),
    now,
  })

  assert.equal(item(model, "openai:header").title, "OpenAI: Pro Lite")
  assert.deepEqual(item(model, "openai:7d"), {
    id: "openai:7d",
    order: 50,
    kind: "progress",
    label: "7D",
    value: 60,
    total: 100,
  })
  assert.equal(mapOpenAiPanelState({ phase: "ready", data: quota({ planType: "Plus" }), now }).groups[0].items[0].title, "OpenAI: Plus")
  assert.equal(mapOpenAiPanelState({ phase: "ready", data: quota({ planType: "Pro" }), now }).groups[0].items[0].title, "OpenAI: Pro")
})

test("maps loading, missing authentication, and unavailable OpenAI states", () => {
  assert.equal(item(mapOpenAiPanelState({ phase: "loading", now }), "openai:header").detail, "Loading OpenAI...")
  assert.equal(item(mapOpenAiPanelState({ phase: "unavailable", now, authenticated: false }), "openai:header").detail, "No ChatGPT account linked")
  assert.equal(item(mapOpenAiPanelState({ phase: "unavailable", now, authenticated: true }), "openai:header").detail, "Usage unavailable")
})

test("retains last-known quota and exposes semantic stale and limit status", () => {
  const model = mapOpenAiPanelState({ phase: "stale", data: quota({ limitReached: true }), now })

  assert.equal(item(model, "openai:5h").value, 75)
  assert.deepEqual(item(model, "openai:limited"), {
    id: "openai:limited",
    order: 15,
    kind: "text",
    text: "Limited",
    status: "error",
  })
  assert.deepEqual(item(model, "openai:stale"), {
    id: "openai:stale",
    order: 16,
    kind: "text",
    text: "~stale",
    status: "warning",
  })
})

test("maps full, exhausted, expired, and reset-pending OpenAI windows to timer states", () => {
  const full = mapOpenAiPanelState({ phase: "ready", data: quota({ primary: window({ used_percent: 0 }) }), now })
  const exhausted = mapOpenAiPanelState({ phase: "ready", data: quota({ primary: window({ used_percent: 100 }) }), now })
  const expired = mapOpenAiPanelState({ phase: "ready", data: quota({ primary: window({ used_percent: 25, reset_at: now / 1_000 }) }), now })
  const pending = mapOpenAiPanelState({ phase: "ready", data: quota({ primary: window({ used_percent: 25, reset_at: undefined, reset_after_seconds: 0 }) }), now })

  assert.equal(item(full, "openai:5h-reset").state, "idle")
  assert.equal(item(exhausted, "openai:5h").value, 0)
  assert.equal(item(exhausted, "openai:5h-reset").state, "countdown")
  assert.equal(item(expired, "openai:5h-reset").state, "expired")
  assert.deepEqual(item(pending, "openai:5h-reset"), {
    id: "openai:5h-reset",
    order: 30,
    kind: "timer",
    label: "5H reset",
    state: "unavailable",
  })
})

test("prefers reset_at over reset_after_seconds", () => {
  const resetAt = now + 2_000
  const model = mapOpenAiPanelState({
    phase: "ready",
    data: quota({ primary: window({ reset_at: resetAt / 1_000, reset_after_seconds: 3_600 }) }),
    now,
  })

  assert.equal(item(model, "openai:5h-reset").epoch, resetAt)
})

test("exposes a framework-only OpenAI adapter without layout or slot registration", () => {
  const source = readFileSync("tui/providers/openai.ts", "utf8")
  const shared = existsSync("shared/opencode-tools-shared.ts") ? readFileSync("shared/opencode-tools-shared.ts", "utf8") : ""
  assert.doesNotMatch(source, /@opentui\/solid/)
  assert.doesNotMatch(source, /slots\.register/)
  assert.match(shared, /createOpenAiProvider/)
  assert.equal(typeof createOpenAiProvider, "function")
})

test("exposes reactive freshness and omits the legacy home line while OpenAI data is stale", async (t) => {
  const originalFetch = globalThis.fetch
  let available = true
  globalThis.fetch = async () => available ? quotaResponse() : { ok: false, status: 503 }
  t.after(() => {
    globalThis.fetch = originalFetch
  })

  const adapter = createOpenAiProvider(adapterApi())
  await adapter.refresh()

  assert.equal(adapter.freshness(), "ready")
  assert.deepEqual(adapter.home(), { provider: "OpenAI", plan: "Plus", primaryPct: 75, secondaryPct: undefined })

  available = false
  await adapter.refresh()

  assert.equal(adapter.freshness(), "stale")
  assert.equal(adapter.home(), null)
})

test("expires stale OpenAI data after the stale window", async (t) => {
  const clock = installFakeClock(t, now)
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => quotaResponse()
  t.after(() => {
    globalThis.fetch = originalFetch
  })

  const adapter = createOpenAiProvider(adapterApi())
  await adapter.refresh()
  clock.advance(10 * 60 * 1_000 + 1)
  const tick = clock.intervals.find((timer) => timer.active && timer.delay === 1_000)

  assert.ok(tick)
  tick.callback()
  assert.equal(adapter.freshness(), "unavailable")
  assert.equal(adapter.home(), null)
  assert.equal(item(adapter.panel(), "openai:header").detail, "Usage unavailable")
})

test("refreshes OpenAI quota at its reset boundary", async (t) => {
  const clock = installFakeClock(t, now)
  const originalFetch = globalThis.fetch
  let requests = 0
  globalThis.fetch = async () => {
    requests += 1
    return quotaResponse(window({ reset_at: (now + 15 * 60 * 1_000) / 1_000 }))
  }
  t.after(() => {
    globalThis.fetch = originalFetch
  })

  const adapter = createOpenAiProvider(adapterApi())
  await adapter.refresh()
  await flushEffects()
  const boundary = clock.timeouts.find((timer) => timer.active && timer.delay === 15 * 60 * 1_000)

  assert.ok(boundary)
  const beforeBoundaryRefresh = requests
  boundary.callback()
  await flushEffects()
  assert.equal(requests, beforeBoundaryRefresh + 1)
})

test("uses the JWT account claim in OpenAI usage requests", async (t) => {
  const originalFetch = globalThis.fetch
  const payload = Buffer.from(JSON.stringify({
    "https://api.openai.com/auth": { chatgpt_account_id: "account-from-jwt" },
  })).toString("base64url")
  const token = `header.${payload}.signature`
  let request
  globalThis.fetch = async (url, options) => {
    request = { url, options }
    return quotaResponse()
  }
  t.after(() => {
    globalThis.fetch = originalFetch
  })

  await fetchOpenAiQuota({ access: token })

  assert.equal(request.url, "https://chatgpt.com/backend-api/wham/usage")
  assert.equal(request.options.headers.Authorization, `Bearer ${token}`)
  assert.equal(request.options.headers["ChatGPT-Account-Id"], "account-from-jwt")
})
