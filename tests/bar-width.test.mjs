import assert from "node:assert/strict"
import test from "node:test"

import { buildBar } from "../.tmp-test/opencode-quota-shared.js"

test("bar is fixed 28 cells for all percentages", () => {
  for (const pct of [100, 50, 0]) {
    const bar = buildBar(pct)
    assert.equal(bar.filled.length + bar.empty.length, 28, `bar width for ${pct}%`)
  }
})

test("100% fills all 28, 0% fills none", () => {
  assert.equal(buildBar(100).filled.length, 28)
  assert.equal(buildBar(100).empty.length, 0)
  assert.equal(buildBar(0).filled.length, 0)
  assert.equal(buildBar(0).empty.length, 28)
})

test("percentage right-aligned to 4 chars", () => {
  assert.equal(`${(100).toFixed(0)}%`.padStart(4, " "), "100%")
  assert.equal(`${(50).toFixed(0)}%`.padStart(4, " "), " 50%")
  assert.equal(`${(0).toFixed(0)}%`.padStart(4, " "), "  0%")
})
