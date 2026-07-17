import assert from "node:assert/strict"
import test from "node:test"

const { renderCompactStatusRow } = await import("../../.tmp-test/compact-status-row-render.mjs")

test("renders the full status label when a scrollbar narrows the row", async () => {
  const frame = (await renderCompactStatusRow(36)).replace(/\n$/u, "")

  assert.equal(frame.length, 36)
  assert.equal(frame.endsWith("Connected"), true)
})
