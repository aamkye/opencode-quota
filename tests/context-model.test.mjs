import assert from "node:assert/strict"
import test from "node:test"

const { createContextPanelModel } = await import("../.tmp-test/context-model.mjs")

function assistant(overrides = {}) {
  return {
    role: "assistant",
    providerID: "openai",
    modelID: "gpt-test",
    cost: 0,
    tokens: {
      total: 999_999,
      input: 0,
      output: 0,
      reasoning: 0,
      cache: { read: 0, write: 0 },
    },
    ...overrides,
  }
}

function provider(context, id = "openai", modelID = "gpt-test") {
  return { id, models: { [modelID]: { limit: { context } } } }
}

test("uses all detailed buckets from the newest positive assistant and preserves overflow", () => {
  const messages = [
    assistant({ cost: 0.4, tokens: { total: 1, input: 900, output: 0, reasoning: 0, cache: { read: 0, write: 0 } } }),
    { role: "user", cost: 999, tokens: { input: 999_999 } },
    assistant({
      cost: 0.6,
      tokens: { total: 7, input: 200, output: 300, reasoning: 100, cache: { read: 250, write: 200 } },
    }),
  ]

  assert.deepEqual(createContextPanelModel(messages, [provider(1_000)]), {
    limit: "1K",
    tokens: "1.05K",
    used: "105%",
    spent: "$1.00",
    summary: "105%",
    usageStatus: "error",
  })
})

test("ignores a newer zero-token assistant and uses the newest positive post-compaction total", () => {
  const messages = [
    assistant({ tokens: { input: 800, output: 0, reasoning: 0, cache: { read: 0, write: 0 } } }),
    assistant({ tokens: { input: 321, output: 1, reasoning: 0, cache: { read: 0, write: 0 } } }),
    assistant({ tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } } }),
  ]

  assert.equal(createContextPanelModel(messages, [provider(500)]).used, "64%")
})

test("returns placeholders and zero spend without a token-bearing assistant", () => {
  assert.deepEqual(createContextPanelModel([], []), {
    limit: "-",
    tokens: "-",
    used: "-",
    spent: "$0.00",
    summary: "-",
    spentStatus: "textMuted",
  })
  assert.deepEqual(createContextPanelModel([{ role: "user" }], [provider(1_000)]), {
    limit: "-",
    tokens: "-",
    used: "-",
    spent: "$0.00",
    summary: "-",
    spentStatus: "textMuted",
  })
})

test("keeps spend when provider, model, or context limit is unavailable", () => {
  const messages = [assistant({ cost: 1.25, tokens: { input: 10, output: 0, reasoning: 0, cache: { read: 0, write: 0 } } })]
  for (const providers of [
    [],
    [{ id: "other", models: {} }],
    [{ id: "openai", models: {} }],
    [provider(0)],
    [provider(Number.POSITIVE_INFINITY)],
  ]) {
    assert.deepEqual(createContextPanelModel(messages, providers), {
      limit: "-",
      tokens: "10",
      used: "-",
      spent: "$1.25",
      summary: "-",
    })
  }
})

test("ignores non-finite buckets and costs without mutating inputs", () => {
  const messages = Object.freeze([
    Object.freeze(assistant({
      cost: Number.NaN,
      tokens: Object.freeze({
        input: Number.NaN,
        output: 25,
        reasoning: Number.POSITIVE_INFINITY,
        cache: Object.freeze({ read: 25, write: Number.NEGATIVE_INFINITY }),
      }),
    })),
    Object.freeze(assistant({ cost: 0.125, tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } } })),
  ])

  assert.deepEqual(createContextPanelModel(messages, [provider(200)]), {
    limit: "200",
    tokens: "50",
    used: "25%",
    spent: "$0.13",
    summary: "25%",
    usageStatus: "success",
  })
})

test("formats compact limits and rounds usage to the nearest integer", () => {
  const messages = [assistant({ tokens: { input: 322_120, output: 0, reasoning: 0, cache: { read: 0, write: 0 } } })]
  assert.deepEqual(createContextPanelModel(messages, [provider(500_000)]), {
    limit: "500K",
    tokens: "322.12K",
    used: "64%",
    spent: "$0.00",
    summary: "64%",
    usageStatus: "error",
    spentStatus: "textMuted",
  })
  assert.equal(createContextPanelModel(messages, [provider(1_500_000)]).limit, "1.5M")
})

test("colors collapsed usage at the documented percentage boundaries", () => {
  for (const [input, status] of [[39, "success"], [40, "warning"], [60, "warning"], [61, "error"]]) {
    assert.equal(createContextPanelModel([assistant({ tokens: { input, output: 0, reasoning: 0, cache: { read: 0, write: 0 } } })], [provider(100)]).usageStatus, status)
  }
})
