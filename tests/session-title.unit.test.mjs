import assert from "node:assert/strict"
import test from "node:test"
import { TitleState, hasPriorParentMessages, normalizeTitle } from "../.tmp-test/session-title.js"

test("normalizes one plain-text title with three to eight words", () => {
  assert.equal(normalizeTitle('  "Repair checkout webhook retries"  '), "Repair checkout webhook retries")
  assert.equal(normalizeTitle("Two words"), undefined)
  assert.equal(normalizeTitle("one two three four five six seven eight nine"), undefined)
  assert.equal(normalizeTitle("- Repair checkout webhook retries"), undefined)
  assert.equal(normalizeTitle("Repair checkout\nwebhook retries"), undefined)
})

test("recognizes only the initial parent message", () => {
  assert.equal(hasPriorParentMessages([], "message-1"), false)
  assert.equal(hasPriorParentMessages([{ info: { id: "message-1" } }], "message-1"), false)
  assert.equal(hasPriorParentMessages([{ info: { id: "message-0" } }], "message-1"), true)
})

test("begins generation only from a claimed parent", () => {
  const state = new TitleState()
  assert.equal(state.claim("parent-1"), true)
  state.beginGeneration("parent-1")
  assert.equal(state.stage("parent-1"), "generating")
})

test("coordinates an early first idle with a later candidate exactly once", () => {
  const state = new TitleState()
  assert.equal(state.claim("parent-1"), true)
  state.registerChild("parent-1", "child-1")
  assert.equal(state.isChild("child-1"), true)
  assert.equal(state.onFirstIdle("parent-1"), undefined)
  assert.equal(state.complete("parent-1", "Repair checkout webhook retries"), "Repair checkout webhook retries")
  state.finishUpdate("parent-1")
  assert.equal(state.onFirstIdle("parent-1"), undefined)
  assert.equal(state.claim("parent-1"), false)
})

test("releases temporary children after cleanup", () => {
  const state = new TitleState()
  state.claim("parent-1")
  state.registerChild("parent-1", "child-1")
  state.releaseChild("child-1")
  assert.equal(state.isChild("child-1"), false)
})

test("does not retry after generation, cleanup, or update failure", () => {
  for (const parentID of ["generation", "cleanup", "update"]) {
    const state = new TitleState()
    assert.equal(state.claim(parentID), true)
    state.fail(parentID)
    assert.equal(state.stage(parentID), "handled")
    assert.equal(state.claim(parentID), false)
  }
})
