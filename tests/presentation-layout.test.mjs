import assert from "node:assert/strict"
import test from "node:test"

await import("./compile-presentation.mjs")

const {
  allocateCompactTable,
  allocateHeader,
  allocateProgressRow,
} = await import("../.tmp-test/presentation-layout.mjs")
const { sortByOrderThenId } = await import("../.tmp-test/presentation-types.mjs")

test("reserves the header summary in the final cell", () => {
  assert.deepEqual(allocateHeader(20, "Quota", "51%/80%"), {
    marker: 1,
    label: 11,
    beforeSummaryGap: 1,
    summary: 7,
  })
})

test("keeps progress columns fixed and assigns the remainder to the bar", () => {
  assert.deepEqual(allocateProgressRow(20), {
    marker: 3,
    beforeBarGap: 1,
    bar: 11,
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
