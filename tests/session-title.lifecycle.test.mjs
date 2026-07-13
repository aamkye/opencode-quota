import assert from "node:assert/strict"
import test from "node:test"
import { createSessionTitleHooks } from "../.tmp-test/session-title.js"

test("config disables only OpenCode's hidden title agent", async () => {
  const hooks = createSessionTitleHooks({})
  const config = { agent: { build: { model: "openai/gpt-5.6" }, title: { model: "openai/gpt-5.6-mini" } } }

  await hooks.config(config)

  assert.deepEqual(config, {
    agent: {
      build: { model: "openai/gpt-5.6" },
      title: { model: "openai/gpt-5.6-mini", disable: true },
    },
    command: {
      "session-rename": {
        template: "/session-rename",
        description: "Rename this session; omit the title to generate one",
      },
    },
  })
})

test("registers the session rename command without changing unrelated config", async () => {
  const hooks = createSessionTitleHooks({})
  const config = { command: { keep: { template: "/keep" } }, agent: { title: { model: "openai/gpt-5.6-mini" } } }

  await hooks.config(config)

  assert.deepEqual(config.command["session-rename"], {
    template: "/session-rename",
    description: "Rename this session; omit the title to generate one",
  })
  assert.equal(config.command.keep.template, "/keep")
  assert.equal(config.agent.title.disable, true)
})

test("updates the active session for a valid supplied title and aborts the command", async () => {
  const calls = []
  const hooks = createSessionTitleHooks({ session: {
    update: async (request) => { calls.push(["update", request]); return { data: {} } },
    prompt: async (request) => { calls.push(["prompt", request]); return { data: {} } },
  } }, () => {})

  await assert.rejects(hooks["command.execute.before"]({
    command: "session-rename", arguments: "  Project planning notes  ", sessionID: "parent-1",
  }), () => true)

  assert.deepEqual(calls, [
    ["update", { path: { id: "parent-1" }, body: { title: "Project planning notes" } }],
    ["prompt", { path: { id: "parent-1" }, body: {
      noReply: true,
      parts: [{ type: "text", text: "Session renamed to \"Project planning notes\".", ignored: true }],
    } }],
  ])
})

test("reports usage without updating for an invalid supplied title and aborts the command", async () => {
  const calls = []
  const hooks = createSessionTitleHooks({ session: {
    update: async (request) => { calls.push(["update", request]); return { data: {} } },
    prompt: async (request) => { calls.push(["prompt", request]); return { data: {} } },
  } }, () => {})

  await assert.rejects(hooks["command.execute.before"]({
    command: "/session-rename", arguments: "Too short", sessionID: "parent-1",
  }), () => true)

  assert.deepEqual(calls, [["prompt", { path: { id: "parent-1" }, body: {
    noReply: true,
    parts: [{ type: "text", text: "Usage: /session-rename [3-8 word title]", ignored: true }],
  } }]])
})

test("warns, reports failure, and aborts when the direct update rejects", async () => {
  const warnings = []
  const calls = []
  const updateError = new Error("update unavailable")
  const hooks = createSessionTitleHooks({ session: {
    update: async () => { throw updateError },
    prompt: async (request) => { calls.push(request); return { data: {} } },
  } }, (...warning) => { warnings.push(warning) })

  await assert.rejects(hooks["command.execute.before"]({
    command: "session-rename", arguments: "Project planning notes", sessionID: "parent-1",
  }), () => true)

  assert.deepEqual(warnings, [["update", "parent-1", updateError]])
  assert.equal(calls.length, 1)
  assert.equal(calls[0].path.id, "parent-1")
  assert.equal(calls[0].body.noReply, true)
  assert.equal(calls[0].body.parts[0].ignored, true)
})

test("warns and aborts when command feedback rejects", async () => {
  const warnings = []
  const feedbackError = new Error("prompt unavailable")
  const hooks = createSessionTitleHooks({ session: {
    update: async () => ({ data: {} }),
    prompt: async () => { throw feedbackError },
  } }, (...warning) => { warnings.push(warning) })

  await assert.rejects(hooks["command.execute.before"]({
    command: "session-rename", arguments: "Project planning notes", sessionID: "parent-1",
  }), () => true)

  assert.deepEqual(warnings, [["feedback", "parent-1", feedbackError]])
})

test("first message uses its selected model and variant, cleans up its child, and titles the parent on first idle", async () => {
  const calls = []
  const client = {
    session: {
      messages: async () => ({ data: [] }),
      create: async ({ body }) => ({ data: { id: "title-child", parentID: body.parentID } }),
      prompt: async (request) => {
        calls.push(["prompt", request])
        return { data: { parts: [{ type: "text", text: "Repair checkout webhook retries" }] } }
      },
      delete: async (request) => {
        calls.push(["delete", request])
        return { data: true }
      },
      update: async (request) => {
        calls.push(["update", request])
        return { data: { id: "parent-1" } }
      },
    },
  }
  const hooks = createSessionTitleHooks(client, () => {})

  await hooks["chat.message"](
    { sessionID: "parent-1", messageID: "message-1", model: { providerID: "openai", modelID: "gpt-5.6" }, variant: "high" },
    { message: { id: "message-1", sessionID: "parent-1", model: { providerID: "openai", modelID: "gpt-5.6" } }, parts: [{ type: "text", text: "The checkout webhook retries forever." }] },
  )
  await hooks.event({ event: { type: "session.idle", properties: { sessionID: "parent-1" } } })
  await hooks["chat.message"](
    { sessionID: "parent-1", messageID: "message-2", model: { providerID: "openai", modelID: "gpt-5.6" } },
    { message: { id: "message-2", sessionID: "parent-1", model: { providerID: "openai", modelID: "gpt-5.6" } }, parts: [{ type: "text", text: "Please add logging." }] },
  )

  assert.deepEqual(calls, [
    ["prompt", { path: { id: "title-child" }, body: {
      model: { providerID: "openai", modelID: "gpt-5.6" }, variant: "high", tools: {},
      system: "Return only a plain-text session title of 3 to 8 words. No quotes, Markdown, punctuation, or explanation.",
      parts: [{ type: "text", text: "Generate a title for this request:\n\nThe checkout webhook retries forever." }],
    } }],
    ["delete", { path: { id: "title-child" } }],
    ["update", { path: { id: "parent-1" }, body: { title: "Repair checkout webhook retries" } }],
  ])
})

test("updates once when first idle arrives before title generation completes", async () => {
  const calls = []
  let resolvePrompt
  let promptStarted
  const prompt = new Promise((resolve) => { resolvePrompt = resolve })
  const started = new Promise((resolve) => { promptStarted = resolve })
  const hooks = createSessionTitleHooks({ session: {
    messages: async () => ({ data: [] }),
    create: async () => ({ data: { id: "title-child" } }),
    prompt: async () => { promptStarted(); return prompt },
    delete: async () => ({ data: true }),
    update: async (request) => { calls.push(request); return { data: { id: "parent-1" } } },
  } }, () => {})

  const generation = hooks["chat.message"](
    { sessionID: "parent-1", messageID: "message-1", model: { providerID: "openai", modelID: "gpt-5.6" } },
    { message: { id: "message-1", sessionID: "parent-1", model: { providerID: "openai", modelID: "gpt-5.6" } }, parts: [{ type: "text", text: "The checkout webhook retries forever." }] },
  )
  await started
  await hooks.event({ event: { type: "session.idle", properties: { sessionID: "parent-1" } } })
  resolvePrompt({ data: { parts: [{ type: "text", text: "Repair checkout webhook retries" }] } })
  await generation
  await hooks.event({ event: { type: "session.idle", properties: { sessionID: "parent-1" } } })

  assert.deepEqual(calls, [{ path: { id: "parent-1" }, body: { title: "Repair checkout webhook retries" } }])
})
