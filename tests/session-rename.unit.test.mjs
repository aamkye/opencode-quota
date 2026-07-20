import assert from "node:assert/strict"
import test from "node:test"
import { collectRecentUserText, normalizeTitle } from "../.tmp-test/session-rename.js"

test("normalizes one plain-text title with three to eight words", () => {
  assert.equal(normalizeTitle('  "Repair checkout webhook retries"  '), "Repair checkout webhook retries")
  assert.equal(normalizeTitle("Two words"), undefined)
  assert.equal(normalizeTitle("one two three four five six seven eight nine"), undefined)
  assert.equal(normalizeTitle("- Repair checkout webhook retries"), undefined)
  assert.equal(normalizeTitle("Repair checkout\nwebhook retries"), undefined)
})

test("collects only non-empty user text in chronological order", () => {
  const context = collectRecentUserText([
    { info: { id: "u-1", role: "user" }, parts: [{ type: "text", text: "Earlier request" }] },
    { info: { id: "a-1", role: "assistant" }, parts: [{ type: "text", text: "Ignore this reply" }] },
    { info: { id: "u-2", role: "user" }, parts: [{ type: "text", text: "Later clarification" }, { type: "tool" }] },
  ])
  assert.equal(context, "Earlier request\nLater clarification")
})

test("returns no context when user messages have no usable text", () => {
  assert.equal(collectRecentUserText([
    { info: { id: "u-1", role: "user" }, parts: [{ type: "text", text: "   " }] },
    { info: { id: "u-2", role: "user" }, parts: [{ type: "tool" }] },
  ]), undefined)
})

test("keeps the newest characters within the context bound", () => {
  assert.equal(collectRecentUserText([
    { info: { id: "u-1", role: "user" }, parts: [{ type: "text", text: "abcdefghij" }] },
  ], 5), "fghij")
})

test("counts chronological separators inside the context bound", () => {
  assert.equal(collectRecentUserText([
    { info: { id: "u-1", role: "user" }, parts: [{ type: "text", text: "abcdef" }] },
    { info: { id: "u-2", role: "user" }, parts: [{ type: "text", text: "12345" }] },
  ], 8), "ef\n12345")
})
