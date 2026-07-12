import assert from "node:assert/strict"
import test from "node:test"
import { createSessionTitleHooks } from "../.tmp-test/session-title.js"

test("first message uses its selected model, cleans up its child, and titles the parent on first idle", async () => {
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
    { sessionID: "parent-1", messageID: "message-1", model: { providerID: "openai", modelID: "gpt-5.6" } },
    { message: { id: "message-1", sessionID: "parent-1", model: { providerID: "openai", modelID: "gpt-5.6" } }, parts: [{ type: "text", text: "The checkout webhook retries forever." }] },
  )
  await hooks.event({ event: { type: "session.idle", properties: { sessionID: "parent-1" } } })
  await hooks["chat.message"](
    { sessionID: "parent-1", messageID: "message-2", model: { providerID: "openai", modelID: "gpt-5.6" } },
    { message: { id: "message-2", sessionID: "parent-1", model: { providerID: "openai", modelID: "gpt-5.6" } }, parts: [{ type: "text", text: "Please add logging." }] },
  )

  assert.deepEqual(calls, [
    ["prompt", { path: { id: "title-child" }, body: {
      model: { providerID: "openai", modelID: "gpt-5.6" }, tools: {},
      system: "Return only a plain-text session title of 3 to 8 words. No quotes, Markdown, punctuation, or explanation.",
      parts: [{ type: "text", text: "Generate a title for this request:\n\nThe checkout webhook retries forever." }],
    } }],
    ["delete", { path: { id: "title-child" } }],
    ["update", { path: { id: "parent-1" }, body: { title: "Repair checkout webhook retries" } }],
  ])
})
