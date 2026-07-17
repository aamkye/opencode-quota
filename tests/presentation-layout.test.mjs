import assert from "node:assert/strict"
import test from "node:test"

const {
  allocateCompactTable,
  allocateHeader,
  allocateProgressRow,
  allocateStatusRow,
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

test("status allocation preserves full labels within 37 cells", () => {
  for (const label of ["Connected", "Disabled", "Failed", "Needs auth", "Needs client ID", "Unknown"]) {
    const allocation = allocateStatusRow(37, label.length)

    assert.equal(Object.values(allocation).reduce((total, width) => total + width, 0), 37)
    assert.equal(allocation.bullet, 2)
    assert.equal(allocation.beforeLabelGap, 1)
    assert.equal(allocation.label, label.length)
    assert.equal(allocation.name, 37 - 2 - 1 - label.length)
  }
})

test("status allocation reserves the right edge before the bullet and name", () => {
  assert.deepEqual(allocateStatusRow(5.9, 3), {
    bullet: 1,
    name: 0,
    beforeLabelGap: 1,
    label: 3,
  })
  assert.deepEqual(allocateStatusRow(-1, 3), {
    bullet: 0,
    name: 0,
    beforeLabelGap: 0,
    label: 0,
  })
})

test("uses stable IDs to break equal layout order ties", () => {
  assert.deepEqual(sortByOrderThenId([{ id: "zeta", order: 10 }, { id: "alpha", order: 10 }]), [
    { id: "alpha", order: 10 },
    { id: "zeta", order: 10 },
  ])
})
