import assert from "node:assert/strict"
import test from "node:test"

const {
  allocateCompactTable,
  allocateHeader,
  allocateProgressRow,
} = await import("../.tmp-test/presentation-layout.mjs")
const { sortByOrderThenId } = await import("../.tmp-test/presentation-types.mjs")

test("reserves a spaced marker and the header summary at the right edge", () => {
  assert.deepEqual(allocateHeader(20, "Quota", "51%/80%"), {
    marker: 2,
    label: 10,
    beforeSummaryGap: 1,
    summary: 7,
  })
})

test("starts the flexible progress bar after a three-cell label", () => {
  assert.deepEqual(allocateProgressRow(20), {
    marker: 3,
    beforeBarGap: 0,
    bar: 12,
    beforePercentGap: 1,
    percent: 4,
  })
})

test("hides compact-table identity before trimming the key", () => {
  assert.deepEqual(allocateCompactTable(12, { identity: 4, key: 10, value: 5 }), {
    identity: 0,
    beforeKeyGap: 0,
    key: 6,
    beforeValueGap: 1,
    value: 5,
    valueAlign: "right",
  })
})

test("uses stable IDs to break equal layout order ties", () => {
  assert.deepEqual(sortByOrderThenId([{ id: "zeta", order: 10 }, { id: "alpha", order: 10 }]), [
    { id: "alpha", order: 10 },
    { id: "zeta", order: 10 },
  ])
})
