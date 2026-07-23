import assert from "node:assert/strict"
import test from "node:test"

const {
  alignText,
  formatBytes,
  formatCount,
  formatCurrency,
  formatDuration,
  formatPercent,
  formatTimer,
  pathBasename,
  truncateText,
} = await import("../.tmp-test/presentation-format.mjs")

test("formats semantic quantities without layout padding", () => {
  assert.equal(formatBytes(1_536), "1.5 KiB")
  assert.equal(formatDuration(3_660_000), "1h 1m")
  assert.equal(formatCurrency(12.5), "$12.50")
})

test("formats compact counts with up to two useful decimal places", () => {
  for (const [value, expected] of [
    [1_234, "1.23K"],
    [1_200, "1.2K"],
    [1_000, "1K"],
    [388_820_000, "388.82M"],
    [1_234_567_000, "1.23B"],
    [-1_234, "-1.23K"],
  ]) assert.equal(formatCount(value), expected)

  assert.equal(formatCount(1_250, 1), "1.3K", "explicit precision remains supported")
})

test("keeps finite edge behavior and promotes rounded compact units", () => {
  assert.equal(formatCount(999), "999")
  assert.equal(formatCount(999.6), "1000")
  assert.equal(formatCount(Number.NaN), "0")
  assert.equal(formatCount(Number.POSITIVE_INFINITY), "0")
  assert.equal(formatCount(999_999), "1M")
  assert.equal(formatCount(-999_999), "-1M")
  assert.equal(formatCount(999_999_999), "1B")
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

test("returns the final path segment and ignores trailing separators", () => {
  assert.equal(pathBasename("/Users/aam/Projects/priv/opencode-tools"), "opencode-tools")
  assert.equal(pathBasename("/srv/app/"), "app")
  assert.equal(pathBasename("relative-dir"), "relative-dir")
  assert.equal(pathBasename("/"), "")
  assert.equal(pathBasename("///"), "")
  assert.equal(pathBasename(""), "")
  assert.equal(pathBasename(undefined), "")
})
