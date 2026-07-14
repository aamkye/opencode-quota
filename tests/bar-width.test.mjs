import assert from "node:assert/strict"
import test from "node:test"

import { allocateProgressRow } from "../.tmp-test/presentation-layout.mjs"

test("progress rows reserve fixed marker, gaps, and percent columns", () => {
  assert.deepEqual(allocateProgressRow(80), {
    marker: 3,
    beforeBarGap: 0,
    bar: 72,
    beforePercentGap: 1,
    percent: 4,
  })
})

test("progress bars use only flexible space remaining after fixed columns", () => {
  assert.equal(allocateProgressRow(8).bar, 0)
  assert.equal(allocateProgressRow(9).bar, 1)
  assert.equal(allocateProgressRow(10).bar, 2)
  assert.equal(allocateProgressRow(27).bar, 19)
})
