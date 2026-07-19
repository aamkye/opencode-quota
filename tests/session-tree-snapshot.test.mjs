import assert from "node:assert/strict"
import test from "node:test"

const {
  collectSessionTreeIDs,
  indexSessionsByParent,
  loadSessionTreeSnapshot,
} = await import("../.tmp-test/session-tree-snapshot.mjs")

const message = (sessionID, input = 1) => ({
  role: "assistant",
  sessionID,
  tokens: { input, output: 0, reasoning: 0, cache: { read: 0, write: 0 } },
})

test("keeps an omitted root and returns a root-only complete snapshot", async () => {
  const messageCalls = []
  const rootMessage = message("root")
  const snapshot = await loadSessionTreeSnapshot({
    rootSessionID: "root",
    async listSessions() { return [{ id: "unrelated" }] },
    async listMessages(sessionID) {
      messageCalls.push(sessionID)
      return [rootMessage]
    },
  })

  assert.deepEqual(snapshot, { sessionIDs: ["root"], messages: [rootMessage] })
  assert.deepEqual(messageCalls, ["root"])
})

test("traverses deep descendants in deterministic breadth-first order and excludes unrelated sessions", async () => {
  const sessions = [
    { id: "unrelated" },
    { id: "child-a", parentID: "root" },
    { id: "grandchild", parentID: "child-a" },
    { id: "child-b", parentID: "root" },
  ]
  const messageCalls = []
  const snapshot = await loadSessionTreeSnapshot({
    rootSessionID: "root",
    async listSessions() { return sessions },
    async listMessages(sessionID) {
      messageCalls.push(sessionID)
      return [message(sessionID)]
    },
  })

  assert.deepEqual(snapshot.sessionIDs, ["root", "child-a", "child-b", "grandchild"])
  assert.deepEqual(messageCalls, ["root", "child-a", "child-b", "grandchild"])
  assert.deepEqual(snapshot.messages.map(({ sessionID }) => sessionID), snapshot.sessionIDs)
})

test("visits duplicate IDs and malformed parent cycles only once", async () => {
  const sessions = [
    { id: "child", parentID: "root" },
    { id: "child", parentID: "root" },
    { id: "cycle-a", parentID: "child" },
    { id: "root", parentID: "cycle-a" },
    { id: "cycle-b", parentID: "cycle-a" },
    { id: "cycle-a", parentID: "cycle-b" },
  ]
  const byParent = indexSessionsByParent(sessions)
  assert.deepEqual(byParent.get("root"), sessions.slice(0, 2))
  assert.deepEqual(collectSessionTreeIDs("root", byParent), ["root", "child", "cycle-a", "cycle-b"])

  const messageCalls = []
  const snapshot = await loadSessionTreeSnapshot({
    rootSessionID: "root",
    async listSessions() { return sessions },
    async listMessages(sessionID) {
      messageCalls.push(sessionID)
      return [message(sessionID)]
    },
  })

  assert.deepEqual(snapshot.sessionIDs, ["root", "child", "cycle-a", "cycle-b"])
  assert.deepEqual(messageCalls, snapshot.sessionIDs)
})

test("never runs more than four message requests concurrently", async () => {
  const sessions = Array.from({ length: 10 }, (_, index) => ({
    id: `child-${index}`,
    parentID: "root",
  }))
  let active = 0
  let maximum = 0
  let releaseRequests
  const requestsReleased = new Promise((resolve) => { releaseRequests = resolve })
  const messageCalls = []
  const pending = loadSessionTreeSnapshot({
    rootSessionID: "root",
    async listSessions() { return sessions },
    async listMessages(sessionID) {
      messageCalls.push(sessionID)
      active += 1
      maximum = Math.max(maximum, active)
      await requestsReleased
      active -= 1
      return [message(sessionID)]
    },
    concurrency: 100,
  })

  await new Promise((resolve) => setImmediate(resolve))
  assert.equal(active, 4)
  releaseRequests()
  const snapshot = await pending

  assert.equal(maximum, 4)
  assert.equal(messageCalls.length, 11)
  assert.equal(snapshot.messages.length, 11)
})

test("rejects the whole snapshot when one message request fails", async () => {
  let snapshot
  await assert.rejects(async () => {
    snapshot = await loadSessionTreeSnapshot({
      rootSessionID: "root",
      async listSessions() { return [{ id: "child", parentID: "root" }] },
      async listMessages(sessionID) {
        if (sessionID === "child") throw new Error("message request failed")
        return [message(sessionID)]
      },
    })
  }, /message request failed/)

  assert.equal(snapshot, undefined)
})

test("rejects before message requests when the directory list fails", async () => {
  const messageCalls = []
  let snapshot
  await assert.rejects(async () => {
    snapshot = await loadSessionTreeSnapshot({
      rootSessionID: "root",
      async listSessions() { throw new Error("directory request failed") },
      async listMessages(sessionID) {
        messageCalls.push(sessionID)
        return [message(sessionID)]
      },
    })
  }, /directory request failed/)

  assert.equal(snapshot, undefined)
  assert.deepEqual(messageCalls, [])
})
