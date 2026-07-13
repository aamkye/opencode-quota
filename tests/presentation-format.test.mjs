import assert from "node:assert/strict"
import test from "node:test"

await import("./compile-presentation.mjs")

const {
  alignText,
  formatBytes,
  formatCount,
  formatCurrency,
  formatDuration,
  formatPercent,
  formatTimer,
  truncateText,
} = await import("../.tmp-test/presentation-format.mjs")

test("formats semantic quantities without layout padding", () => {
  assert.equal(formatCount(1_250), "1.3K")
  assert.equal(formatBytes(1_536), "1.5 KiB")
  assert.equal(formatDuration(3_660_000), "1h 1m")
  assert.equal(formatCurrency(12.5), "$12.50")
})

test("clamps rounded percentages to the display range", () => {
  assert.equal(formatPercent(-1), "0%")
  assert.equal(formatPercent(99.6), "100%")
  assert.equal(formatPercent(Number.NaN), "0%")
})

test("aligns text explicitly and trims at the end by default", () => {
  assert.equal(alignText("50%", 4, "right"), " 50%")
  assert.equal(alignText("50%", 4, "left"), "50% ")
  assert.equal(truncateText("OpenCode Tools", 8), "OpenCod…")
})

test("renders only semantic timer states", () => {
  assert.equal(formatTimer({ state: "unavailable" }), "unavailable")
  assert.equal(formatTimer({ state: "idle" }), "resets in -")
  assert.equal(formatTimer({ state: "countdown", epoch: 3_660_000 }, 0), "resets in 1h 1m")
  assert.equal(formatTimer({ state: "expired" }), "reset pending")
})
