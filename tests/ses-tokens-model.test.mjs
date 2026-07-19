import assert from "node:assert/strict"
import test from "node:test"

const { createSesTokensPanelModel } = await import("../.tmp-test/ses-tokens-model.mjs")

const assistant = (tokens = {}) => ({
  role: "assistant",
  tokens: {
    input: 0,
    output: 0,
    reasoning: 0,
    cache: { read: 0, write: 0 },
    ...tokens,
  },
})

test("aggregates every assistant turn and all five detailed buckets", () => {
  const model = createSesTokensPanelModel([
    assistant({ input: 1_000, output: 20, reasoning: 30, cache: { read: 4_000, write: 50 } }),
    { role: "user", tokens: { input: 999_999 } },
    assistant({ input: 500, output: 80, reasoning: 70, cache: { read: 2_000, write: 250 } }),
  ])
  assert.deepEqual(model, {
    turns: "2",
    input: "1.5K",
    output: "100",
    reasoning: "100",
    cacheRead: "6K",
    cacheWrite: "300",
    cacheRatio: "3.3×",
    total: "8K",
    summary: [{ text: "Σ 8K / ↻ 2" }],
  })
})

test("counts zero-token assistants and treats missing or non-finite fields as zero", () => {
  const model = createSesTokensPanelModel([
    { role: "assistant" },
    assistant({ input: Number.NaN, output: Number.POSITIVE_INFINITY, reasoning: 0, cache: { read: 0, write: Number.NEGATIVE_INFINITY } }),
  ])
  assert.equal(model.turns, "2")
  assert.deepEqual([model.input, model.output, model.reasoning, model.cacheRead, model.cacheWrite, model.total], ["0", "0", "0", "0", "0", "0"])
  assert.equal(model.cacheRatio, "-")
})

test("handles normal and zero-denominator cache ratios", () => {
  assert.equal(createSesTokensPanelModel([assistant({ input: 3, cache: { read: 2, write: 1 } })]).cacheRatio, "0.5×")
  assert.equal(createSesTokensPanelModel([assistant({ cache: { read: 2, write: 0 } })]).cacheRatio, "∞")
  assert.equal(createSesTokensPanelModel([assistant()]).cacheRatio, "-")
})

test("uses compact uppercase boundaries without trailing decimal zeroes", () => {
  assert.equal(createSesTokensPanelModel([assistant({ input: 1_000 })]).input, "1K")
  assert.equal(createSesTokensPanelModel([assistant({ input: 1_500_000 })]).input, "1.5M")
  assert.equal(createSesTokensPanelModel([assistant({ input: 1_000_000_000 })]).input, "1B")
  assert.deepEqual(createSesTokensPanelModel([]).summary, [{ text: "Σ 0 / ↻ 0" }])
})
