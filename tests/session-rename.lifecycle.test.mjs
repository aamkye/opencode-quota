import assert from "node:assert/strict"
import test from "node:test"
import { createSessionRenameHooks } from "../.tmp-test/session-rename.js"

async function handledError(promise) {
  let error
  try {
    await promise
  } catch (caught) {
    error = caught
  }
  assert.ok(error instanceof Error)
  assert.equal(error.message, "session rename handled")
  return error
}

test("config disables only OpenCode's hidden title agent", async () => {
  const hooks = createSessionRenameHooks({})
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
  const hooks = createSessionRenameHooks({})
  const config = { command: { keep: { template: "/keep" } }, agent: { title: { model: "openai/gpt-5.6-mini" } } }

  await hooks.config(config)

  assert.deepEqual(config.command["session-rename"], {
    template: "/session-rename",
    description: "Rename this session; omit the title to generate one",
  })
  assert.equal(config.command.keep.template, "/keep")
  assert.equal(config.agent.title.disable, true)
})

test("updates the active session for a valid supplied title and aborts the command silently", async () => {
  const calls = []
  const hooks = createSessionRenameHooks({ session: {
    update: async (request) => { calls.push(["update", request]); return { data: {} } },
    prompt: async (request) => { calls.push(["prompt", request]); return { data: {} } },
  } }, () => {})

  await handledError(hooks["command.execute.before"]({
    command: "session-rename", arguments: "  Project planning notes  ", sessionID: "parent-1",
  }))

  assert.deepEqual(calls, [
    ["update", { path: { id: "parent-1" }, body: { title: "Project planning notes" } }],
  ])
})

test("posts a specific error without updating for an invalid supplied title and aborts the command", async () => {
  const calls = []
  const hooks = createSessionRenameHooks({ session: {
    update: async (request) => { calls.push(["update", request]); return { data: {} } },
    prompt: async (request) => { calls.push(["prompt", request]); return { data: {} } },
  } }, () => {})

  await handledError(hooks["command.execute.before"]({
    command: "/session-rename", arguments: "Too short", sessionID: "parent-1",
  }))

  assert.deepEqual(calls, [["prompt", { path: { id: "parent-1" }, body: {
    noReply: true,
    parts: [{ type: "text", text: 'The session name "Too short" is invalid: it must be 3 to 8 words, but has 2.', ignored: true }],
  } }]])
})

test("warns and stays silent when the direct update rejects", async () => {
  const warnings = []
  const calls = []
  const updateError = new Error("update unavailable")
  const hooks = createSessionRenameHooks({ session: {
    update: async () => { throw updateError },
    prompt: async (request) => { calls.push(request); return { data: {} } },
  } }, (...warning) => { warnings.push(warning) })

  await handledError(hooks["command.execute.before"]({
    command: "session-rename", arguments: "Project planning notes", sessionID: "parent-1",
  }))

  assert.deepEqual(warnings, [["update", "parent-1", updateError]])
  assert.deepEqual(calls, [])
})

test("warns and stays silent when the direct update resolves with an error", async () => {
  const warnings = []
  const calls = []
  const updateError = new Error("update unavailable")
  const hooks = createSessionRenameHooks({ session: {
    update: async () => ({ data: undefined, error: updateError }),
    prompt: async (request) => { calls.push(request); return { data: {} } },
  } }, (...warning) => { warnings.push(warning) })

  await handledError(hooks["command.execute.before"]({
    command: "session-rename", arguments: "Project planning notes", sessionID: "parent-1",
  }))

  assert.deepEqual(warnings, [["update", "parent-1", updateError]])
  assert.deepEqual(calls, [])
})

test("logs default warnings as exact structured JSON", async () => {
  const warnings = []
  const originalWarn = console.warn
  console.warn = (...args) => { warnings.push(args) }

  try {
    const hooks = createSessionRenameHooks({ session: {
      update: async () => { throw new Error("update unavailable") },
      prompt: async () => ({ data: {} }),
    } })

    await handledError(hooks["command.execute.before"]({
      command: "session-rename", arguments: "Project planning notes", sessionID: "parent-1",
    }))
  } finally {
    console.warn = originalWarn
  }

  assert.equal(warnings.length, 1)
  assert.equal(warnings[0].length, 1)
  assert.deepEqual(JSON.parse(warnings[0][0]), {
    plugin: "session-rename",
    action: "update",
    sessionID: "parent-1",
    message: "update unavailable",
  })
})

test("warns and aborts when the invalid-title error prompt rejects", async () => {
  const warnings = []
  const feedbackError = new Error("prompt unavailable")
  const hooks = createSessionRenameHooks({ session: {
    prompt: async () => { throw feedbackError },
  } }, (...warning) => { warnings.push(warning) })

  await handledError(hooks["command.execute.before"]({
    command: "session-rename", arguments: "Too short", sessionID: "parent-1",
  }))

  assert.deepEqual(warnings, [["feedback", "parent-1", feedbackError]])
})

test("warns and aborts when the invalid-title error prompt resolves with an error", async () => {
  const warnings = []
  const feedbackError = new Error("prompt unavailable")
  const hooks = createSessionRenameHooks({ session: {
    prompt: async () => ({ data: undefined, error: feedbackError }),
  } }, (...warning) => { warnings.push(warning) })

  await handledError(hooks["command.execute.before"]({
    command: "session-rename", arguments: "Too short", sessionID: "parent-1",
  }))

  assert.deepEqual(warnings, [["feedback", "parent-1", feedbackError]])
})

test("generated rename resolves its model from the latest user message, cleans up its child, and aborts the command silently", async () => {
  const calls = []
  const hooks = createSessionRenameHooks({ session: {
    messages: async (request) => {
      calls.push(["messages", request])
      return { data: [
        { info: { id: "user-1", role: "user", model: { providerID: "openai", modelID: "gpt-5.6-mini" } }, parts: [{ type: "text", text: "First user request" }] },
        { info: { id: "assistant-1", role: "assistant" }, parts: [{ type: "text", text: "Do not include this" }] },
        { info: { id: "user-2", role: "user", model: { providerID: "openai", modelID: "gpt-5.6", variant: "high" } }, parts: [{ type: "text", text: "Latest user request" }] },
      ] }
    },
    create: async (request) => {
      calls.push(["create", request])
      return { data: { id: "title-child" } }
    },
    prompt: async (request) => {
      calls.push(["prompt", request])
      return request.body.noReply
        ? { data: {} }
        : { data: { parts: [{ type: "text", text: "Plan reliable background jobs" }] } }
    },
    delete: async (request) => { calls.push(["delete", request]); return { data: true } },
    update: async (request) => { calls.push(["update", request]); return { data: {} } },
  } }, () => {})

  await handledError(hooks["command.execute.before"]({
    command: "session-rename", arguments: "   ", sessionID: "parent-1",
  }))

  assert.deepEqual(calls, [
    ["messages", { path: { id: "parent-1" } }],
    ["create", { body: { parentID: "parent-1", title: "Session title" } }],
    ["prompt", { path: { id: "title-child" }, body: {
      model: { providerID: "openai", modelID: "gpt-5.6" }, variant: "high", tools: {},
      system: "Return only a plain-text session title of 3 to 8 words. No quotes, Markdown, punctuation, or explanation.",
      parts: [{ type: "text", text: "Generate a title for this request:\n\nFirst user request\nLatest user request" }],
    } }],
    ["delete", { path: { id: "title-child" } }],
    ["update", { path: { id: "parent-1" }, body: { title: "Plan reliable background jobs" } }],
  ])
})

test("generated rename failure boundaries leave the parent unchanged and abort the command", async (t) => {
  const cases = [
    {
      name: "Messages unavailable",
      setup: (session) => { session.messages = async () => ({}) },
      warning: "generate",
      cleanup: 0,
      creates: 0,
    },
    {
      name: "No usable user text",
      setup: (session) => { session.messages = async () => ({ data: [
        { info: { id: "assistant-1", role: "assistant" }, parts: [{ type: "text", text: "Ignore" }] },
        { info: { id: "user-1", role: "user" }, parts: [{ type: "text", text: "   " }, { type: "file" }] },
      ] }) },
      warning: "generate",
      cleanup: 0,
      creates: 0,
    },
    {
      name: "Model unavailable",
      setup: (session) => { session.messages = async () => ({ data: [
        { info: { id: "user-1", role: "user" }, parts: [{ type: "text", text: "Rename this session" }] },
      ] }) },
      warning: "generate",
      cleanup: 0,
      creates: 0,
    },
    {
      name: "Child creation failure",
      setup: (session, calls) => { session.create = async (request) => { calls.push(["create", request]); return {} } },
      warning: "generate",
      cleanup: 0,
      creates: 1,
    },
    {
      name: "Invalid model output",
      setup: (session, calls) => { session.prompt = async (request) => {
        calls.push(["prompt", request])
        return request.body.noReply
          ? { data: {} }
          : { data: { parts: [{ type: "text", text: "Too short" }] } }
      } },
      warning: "generate",
      cleanup: 1,
      creates: 1,
    },
    {
      name: "Parent update failure",
      setup: (session, calls) => { session.update = async (request) => {
        calls.push(["update", request])
        throw new Error("update unavailable")
      } },
      warning: "update",
      cleanup: 1,
      creates: 1,
    },
    {
      name: "Parent update resolved error",
      setup: (session, calls) => { session.update = async (request) => {
        calls.push(["update", request])
        return { data: undefined, error: new Error("update unavailable") }
      } },
      warning: "update",
      cleanup: 1,
      creates: 1,
    },
    {
      name: "Child cleanup failure",
      setup: (session, calls) => { session.delete = async (request) => {
        calls.push(["delete", request])
        throw new Error("cleanup unavailable")
      } },
      warning: "cleanup",
      cleanup: 1,
      creates: 1,
    },
    {
      name: "Child cleanup resolved error",
      setup: (session, calls) => { session.delete = async (request) => {
        calls.push(["delete", request])
        return { data: undefined, error: new Error("cleanup unavailable") }
      } },
      warning: "cleanup",
      cleanup: 1,
      creates: 1,
    },
  ]

  for (const scenario of cases) {
    await t.test(scenario.name, async () => {
      const calls = []
      const warnings = []
      const session = {
        messages: async (request) => {
          calls.push(["messages", request])
          return { data: [{ info: { id: "user-1", role: "user", model: { providerID: "openai", modelID: "gpt-5.6" } }, parts: [{ type: "text", text: "Rename this session" }] }] }
        },
        create: async (request) => { calls.push(["create", request]); return { data: { id: "title-child" } } },
        prompt: async (request) => {
          calls.push(["prompt", request])
          return request.body.noReply
            ? { data: {} }
            : { data: { parts: [{ type: "text", text: "Plan reliable background jobs" }] } }
        },
        delete: async (request) => { calls.push(["delete", request]); return { data: true } },
        update: async (request) => { calls.push(["update", request]); return { data: {} } },
      }
      scenario.setup?.(session, calls)
      const hooks = createSessionRenameHooks({ session }, (...warning) => { warnings.push(warning) })

      await handledError(hooks["command.execute.before"]({
        command: "session-rename", arguments: "", sessionID: "parent-1",
      }))

      assert.equal(warnings.length, 1)
      assert.equal(warnings[0][0], scenario.warning)
      assert.equal(calls.filter(([name]) => name === "create").length, scenario.creates)
      assert.equal(calls.filter(([name]) => name === "delete").length, scenario.cleanup)
      assert.equal(calls.filter(([name]) => name === "update").length, scenario.warning === "update" ? 1 : 0)
      const feedback = calls.filter(([name, request]) => name === "prompt" && request.body.noReply)
      assert.equal(feedback.length, 0)
    })
  }
})

test("reuses one handled Error sentinel across repeated commands", async () => {
  const hooks = createSessionRenameHooks({ session: {
    prompt: async () => ({ data: {} }),
  } }, () => {})
  const execute = hooks["command.execute.before"]

  const first = await handledError(execute({
    command: "session-rename", arguments: "Too short", sessionID: "parent-1",
  }))
  const second = await handledError(execute({
    command: "/session-rename", arguments: "Still short", sessionID: "parent-2",
  }))

  assert.strictEqual(second, first)
})

test("exposes command-only hooks and cannot mutate sessions without command execution", async () => {
  const calls = []
  const hooks = createSessionRenameHooks({ session: {
    create: async () => { calls.push("create"); return { data: { id: "child-1" } } },
    update: async () => { calls.push("update"); return { data: {} } },
  } }, () => {})

  assert.deepEqual(Object.keys(hooks), ["config", "command.execute.before"])
  await Promise.resolve()
  assert.deepEqual(calls, [])
})
