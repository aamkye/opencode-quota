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
    tokens: "1K",
    used: "105%",
    spent: "$1.00",
    summary: "105%",
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
    tokens: "-",
    used: "-",
    spent: "$0.00",
    summary: "-",
  })
  assert.deepEqual(createContextPanelModel([{ role: "user" }], [provider(1_000)]), {
    tokens: "-",
    used: "-",
    spent: "$0.00",
    summary: "-",
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
      tokens: "-",
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
    tokens: "200",
    used: "25%",
    spent: "$0.13",
    summary: "25%",
  })
})

test("formats compact limits and rounds usage to the nearest integer", () => {
  const messages = [assistant({ tokens: { input: 205_000, output: 0, reasoning: 0, cache: { read: 0, write: 0 } } })]
  assert.deepEqual(createContextPanelModel(messages, [provider(322_000)]), {
    tokens: "322K",
    used: "64%",
    spent: "$0.00",
    summary: "64%",
  })
  assert.equal(createContextPanelModel(messages, [provider(1_500_000)]).tokens, "1.5M")
})
