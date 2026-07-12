import assert from "node:assert/strict"
import test from "node:test"
import { TitleState, createSessionTitleHooks, hasPriorParentMessages, normalizeTitle } from "../.tmp-test/session-title.js"

const firstMessageInput = {
  sessionID: "parent-1",
  messageID: "message-1",
  model: { providerID: "openai", modelID: "gpt-5.6" },
}

const firstMessageOutput = {
  message: { id: "message-1", sessionID: "parent-1", model: { providerID: "openai", modelID: "gpt-5.6" } },
  parts: [{ type: "text", text: "The checkout webhook retries forever." }],
}

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

test("deletes the child when prompt fails, warns structurally, and never updates the parent", async () => {
  const warnings = []
  const calls = []
  const hooks = createSessionTitleHooks({ session: {
    messages: async () => ({ data: [] }),
    create: async () => ({ data: { id: "child-1" } }),
    prompt: async () => { throw new Error("model unavailable") },
    delete: async () => { calls.push("delete"); return { data: true } },
    update: async () => { calls.push("update"); return { data: {} } },
  } }, (action, sessionID, error) => warnings.push({ action, sessionID, message: String(error) }))

  await hooks["chat.message"](firstMessageInput, firstMessageOutput)
  await hooks.event({ event: { type: "session.idle", properties: { sessionID: "parent-1" } } })
  await hooks["chat.message"](firstMessageInput, firstMessageOutput)

  assert.deepEqual(calls, ["delete"])
  assert.deepEqual(warnings, [{ action: "generate", sessionID: "parent-1", message: "Error: model unavailable" }])
})

test("does not update or retry when child cleanup fails", async () => {
  const warnings = []
  const calls = []
  const hooks = createSessionTitleHooks({ session: {
    messages: async () => ({ data: [] }),
    create: async () => ({ data: { id: "child-1" } }),
    prompt: async () => ({ data: { parts: [{ type: "text", text: "Repair checkout webhook retries" }] } }),
    delete: async () => { calls.push("delete"); throw new Error("delete failed") },
    update: async () => { calls.push("update"); return { data: {} } },
  } }, (action, sessionID, error) => warnings.push({ action, sessionID, message: String(error) }))

  await hooks["chat.message"](firstMessageInput, firstMessageOutput)
  await hooks.event({ event: { type: "session.idle", properties: { sessionID: "parent-1" } } })
  await hooks["chat.message"](firstMessageInput, firstMessageOutput)

  assert.deepEqual(calls, ["delete"])
  assert.deepEqual(warnings, [{ action: "cleanup", sessionID: "parent-1", message: "Error: delete failed" }])
})

test("warns once and never retries when the parent update fails", async () => {
  const warnings = []
  const calls = []
  const hooks = createSessionTitleHooks({ session: {
    messages: async () => ({ data: [] }),
    create: async () => ({ data: { id: "child-1" } }),
    prompt: async () => ({ data: { parts: [{ type: "text", text: "Repair checkout webhook retries" }] } }),
    delete: async () => ({ data: true }),
    update: async () => { calls.push("update"); throw new Error("update failed") },
  } }, (action, sessionID, error) => warnings.push({ action, sessionID, message: String(error) }))

  await hooks["chat.message"](firstMessageInput, firstMessageOutput)
  await hooks.event({ event: { type: "session.idle", properties: { sessionID: "parent-1" } } })
  await hooks.event({ event: { type: "session.idle", properties: { sessionID: "parent-1" } } })
  await hooks["chat.message"](firstMessageInput, firstMessageOutput)

  assert.deepEqual(calls, ["update"])
  assert.deepEqual(warnings, [{ action: "update", sessionID: "parent-1", message: "Error: update failed" }])
})

test("filters child messages while its title prompt is in flight", async () => {
  let resolvePrompt
  let beginPrompt
  let createCalls = 0
  const prompt = new Promise((resolve) => { resolvePrompt = resolve })
  const promptStarted = new Promise((resolve) => { beginPrompt = resolve })
  const hooks = createSessionTitleHooks({ session: {
    messages: async () => ({ data: [] }),
    create: async () => ({ data: { id: `child-${++createCalls}` } }),
    prompt: async () => { beginPrompt(); return prompt },
    delete: async () => ({ data: true }),
    update: async () => ({ data: {} }),
  } }, () => {})

  const parentMessage = hooks["chat.message"](firstMessageInput, firstMessageOutput)
  await promptStarted
  await hooks["chat.message"](
    { ...firstMessageInput, sessionID: "child-1" },
    { ...firstMessageOutput, message: { ...firstMessageOutput.message, sessionID: "child-1" } },
  )
  resolvePrompt({ data: { parts: [{ type: "text", text: "Repair checkout webhook retries" }] } })
  await parentMessage

  assert.equal(createCalls, 1)
})
