import assert from "node:assert/strict"
import test from "node:test"

const { createSesTokensSource } = await import("../.tmp-test/ses-tokens-source.mjs")

const eventTypes = [
  "message.updated",
  "message.removed",
  "session.created",
  "session.updated",
  "session.deleted",
  "tui.session.select",
]

function deferred() {
  let resolve
  let reject
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, reject, resolve }
}

function snapshot(...sessionIDs) {
  return { sessionIDs, messages: [] }
}

async function settle() {
  await new Promise((resolve) => setImmediate(resolve))
}

function createScheduler() {
  const timers = []
  return {
    setTimer(callback, delay) {
      const timer = { callback, cancelled: false, delay }
      timers.push(timer)
      return timer
    },
    clearTimer(timer) {
      timer.cancelled = true
    },
    pendingDelays() {
      return timers.filter((timer) => !timer.cancelled).map((timer) => timer.delay)
    },
    scheduledDelays() {
      return timers.map((timer) => timer.delay)
    },
    async runNext(delay) {
      const timer = timers.find((candidate) => !candidate.cancelled && candidate.delay === delay)
      assert.ok(timer, `missing pending ${delay} ms timer`)
      timer.cancelled = true
      timer.callback()
      await settle()
    },
  }
}

function createRegistrar() {
  const handlers = new Map()
  const unsubscribeCounts = new Map()
  return {
    onEvent(type, handler) {
      assert.equal(handlers.has(type), false, `${type} registered more than once`)
      handlers.set(type, handler)
      unsubscribeCounts.set(type, 0)
      let unsubscribed = false
      return () => {
        if (unsubscribed) return
        unsubscribed = true
        unsubscribeCounts.set(type, unsubscribeCounts.get(type) + 1)
        if (handlers.get(type) === handler) handlers.delete(type)
      }
    },
    emit(event) {
      handlers.get(event.type)?.(event)
    },
    registeredTypes() {
      return [...handlers.keys()]
    },
    unsubscribeCount(type) {
      return unsubscribeCounts.get(type) ?? 0
    },
  }
}

function createHarness(loadSnapshot) {
  const scheduler = createScheduler()
  const events = createRegistrar()
  const source = createSesTokensSource({
    loadSnapshot,
    onEvent: events.onEvent,
    setTimer: scheduler.setTimer,
    clearTimer: scheduler.clearTimer,
  })
  return { events, scheduler, source }
}

async function exhaustRetries(scheduler) {
  for (const delay of [2_000, 4_000, 8_000]) await scheduler.runNext(delay)
}

test("loads a non-empty initial target immediately and skips an empty target", async () => {
  const complete = snapshot("root", "child")
  const calls = []
  const { events, source } = createHarness(async (sessionID) => {
    calls.push(sessionID)
    return complete
  })

  assert.deepEqual(events.registeredTypes(), eventTypes)
  assert.equal(source.state(), undefined)
  source.setSessionID("")
  assert.equal(source.state(), undefined)
  assert.deepEqual(calls, [])

  source.setSessionID("root")
  assert.deepEqual(source.state(), { phase: "loading", sessionID: "root" })
  assert.deepEqual(calls, ["root"])
  await settle()
  assert.deepEqual(source.state(), { phase: "ready", sessionID: "root", snapshot: complete })

  source.setSessionID("root")
  assert.deepEqual(calls, ["root"])
  source.setSessionID("")
  assert.equal(source.state(), undefined)
  assert.deepEqual(calls, ["root"])
  source.dispose()
})

test("coalesces relevant message events into one 200 ms refresh", async () => {
  const first = snapshot("root", "child")
  const second = snapshot("root", "child")
  const results = [first, second]
  const calls = []
  const { events, scheduler, source } = createHarness(async (sessionID) => {
    calls.push(sessionID)
    return results.shift()
  })
  source.setSessionID("root")
  await settle()

  events.emit({ type: "message.updated", properties: { sessionID: "child" } })
  events.emit({ type: "message.removed", properties: { sessionID: "root" } })
  assert.deepEqual(scheduler.pendingDelays(), [200])
  assert.deepEqual(calls, ["root"])

  await scheduler.runNext(200)
  assert.deepEqual(calls, ["root", "root"])
  assert.deepEqual(source.state(), { phase: "ready", sessionID: "root", snapshot: second })
  source.dispose()
})

test("ignores message events outside the last complete subtree", async () => {
  const complete = snapshot("root", "child")
  const calls = []
  const { events, scheduler, source } = createHarness(async (sessionID) => {
    calls.push(sessionID)
    return complete
  })
  source.setSessionID("root")
  await settle()

  events.emit({ type: "message.updated", properties: { sessionID: "outside" } })
  events.emit({ type: "message.removed", properties: { sessionID: "outside" } })
  events.emit({ type: "session.created", properties: { sessionID: "new", info: { id: "new", parentID: "outside" } } })
  events.emit({ type: "session.updated", properties: { sessionID: "outside", info: { id: "outside", parentID: "other" } } })
  events.emit({ type: "session.deleted", properties: { sessionID: "outside", info: { id: "outside" } } })

  assert.deepEqual(scheduler.pendingDelays(), [])
  assert.deepEqual(calls, ["root"])
  assert.deepEqual(source.state(), { phase: "ready", sessionID: "root", snapshot: complete })
  source.dispose()
})

test("refreshes for created updated and deleted descendant topology", async () => {
  const complete = snapshot("root", "child")
  const calls = []
  const { events, scheduler, source } = createHarness(async (sessionID) => {
    calls.push(sessionID)
    return complete
  })
  source.setSessionID("root")
  await settle()

  for (const event of [
    { type: "session.created", properties: { sessionID: "new", info: { id: "new", parentID: "child" } } },
    { type: "session.updated", properties: { sessionID: "outside", info: { id: "child", parentID: "other" } } },
    { type: "session.updated", properties: { sessionID: "root", info: { id: "outside", parentID: "other" } } },
    { type: "session.deleted", properties: { sessionID: "child", info: { id: "child" } } },
  ]) {
    events.emit(event)
    assert.deepEqual(scheduler.pendingDelays(), [200])
    await scheduler.runNext(200)
  }

  assert.equal(calls.length, 5)
  assert.deepEqual(source.state(), { phase: "ready", sessionID: "root", snapshot: complete })
  source.dispose()
})

test("switches immediately for slot and non-empty select targets", async () => {
  const root = snapshot("root")
  const slotResult = deferred()
  const selectResult = deferred()
  const results = [Promise.resolve(root), slotResult.promise, selectResult.promise]
  const calls = []
  const { events, source } = createHarness((sessionID) => {
    calls.push(sessionID)
    return results.shift()
  })
  source.setSessionID("root")
  await settle()

  source.setSessionID("slot")
  assert.deepEqual(source.state(), { phase: "loading", sessionID: "slot" })
  assert.deepEqual(calls, ["root", "slot"])

  events.emit({ type: "tui.session.select", properties: { sessionID: "selected" } })
  assert.deepEqual(source.state(), { phase: "loading", sessionID: "selected" })
  assert.deepEqual(calls, ["root", "slot", "selected"])
  events.emit({ type: "tui.session.select", properties: { sessionID: "" } })
  events.emit({ type: "tui.session.select", properties: { sessionID: "selected" } })
  assert.deepEqual(calls, ["root", "slot", "selected"])

  slotResult.resolve(snapshot("slot"))
  selectResult.resolve(snapshot("selected"))
  await settle()
  assert.deepEqual(source.state(), { phase: "ready", sessionID: "selected", snapshot: await selectResult.promise })
  source.dispose()
})

test("does not publish an old generation after a session switch", async () => {
  const oldResult = deferred()
  const newResult = deferred()
  const results = [oldResult.promise, newResult.promise]
  const { source } = createHarness(() => results.shift())

  source.setSessionID("old")
  source.setSessionID("new")
  oldResult.resolve(snapshot("old"))
  await settle()
  assert.deepEqual(source.state(), { phase: "loading", sessionID: "new" })

  const current = snapshot("new", "child")
  newResult.resolve(current)
  await settle()
  assert.deepEqual(source.state(), { phase: "ready", sessionID: "new", snapshot: current })
  source.dispose()
})

test("does not let an event-superseded request replace a newer snapshot", async () => {
  const initial = snapshot("root", "child")
  const olderResult = deferred()
  const newerResult = deferred()
  const results = [Promise.resolve(initial), olderResult.promise, newerResult.promise]
  const { events, scheduler, source } = createHarness(() => results.shift())
  source.setSessionID("root")
  await settle()

  events.emit({ type: "message.updated", properties: { sessionID: "child" } })
  await scheduler.runNext(200)
  events.emit({ type: "message.updated", properties: { sessionID: "root" } })
  await scheduler.runNext(200)

  const newer = snapshot("root", "new-child")
  newerResult.resolve(newer)
  await settle()
  assert.deepEqual(source.state(), { phase: "ready", sessionID: "root", snapshot: newer })

  olderResult.resolve(snapshot("root", "old-child"))
  await settle()
  assert.deepEqual(source.state(), { phase: "ready", sessionID: "root", snapshot: newer })
  source.dispose()
})

test("retries after 2 4 and 8 seconds then becomes unavailable", async () => {
  const calls = []
  const { scheduler, source } = createHarness(async (sessionID) => {
    calls.push(sessionID)
    throw new Error("unavailable")
  })
  source.setSessionID("root")
  await settle()
  assert.deepEqual(source.state(), { phase: "loading", sessionID: "root" })

  await exhaustRetries(scheduler)
  assert.deepEqual(scheduler.scheduledDelays(), [2_000, 4_000, 8_000])
  assert.deepEqual(calls, ["root", "root", "root", "root"])
  assert.deepEqual(source.state(), { phase: "unavailable", sessionID: "root" })
  source.dispose()
})

test("retains a ready snapshot as stale after exhausted background retries", async () => {
  const complete = snapshot("root", "child")
  let calls = 0
  const { events, scheduler, source } = createHarness(async () => {
    calls += 1
    if (calls === 1) return complete
    throw new Error("background unavailable")
  })
  source.setSessionID("root")
  await settle()

  events.emit({ type: "message.updated", properties: { sessionID: "child" } })
  await scheduler.runNext(200)
  assert.deepEqual(source.state(), { phase: "ready", sessionID: "root", snapshot: complete })
  await exhaustRetries(scheduler)
  assert.deepEqual(source.state(), { phase: "stale", sessionID: "root", snapshot: complete })
  source.dispose()
})

test("recovers stale to ready with a later complete snapshot", async () => {
  const first = snapshot("root", "child")
  const recovered = snapshot("root", "new-child")
  let calls = 0
  const { events, scheduler, source } = createHarness(async () => {
    calls += 1
    if (calls === 1) return first
    if (calls <= 5) throw new Error("background unavailable")
    return recovered
  })
  source.setSessionID("root")
  await settle()
  events.emit({ type: "message.removed", properties: { sessionID: "child" } })
  await scheduler.runNext(200)
  await exhaustRetries(scheduler)
  assert.deepEqual(source.state(), { phase: "stale", sessionID: "root", snapshot: first })

  events.emit({ type: "session.created", properties: { sessionID: "new-child", info: { id: "new-child", parentID: "root" } } })
  await scheduler.runNext(200)
  assert.deepEqual(source.state(), { phase: "ready", sessionID: "root", snapshot: recovered })
  source.dispose()
})

test("disposal during retry clears timers unsubscribes events and blocks updates", async () => {
  const calls = []
  const notifications = []
  const { events, scheduler, source } = createHarness(async (sessionID) => {
    calls.push(sessionID)
    throw new Error("unavailable")
  })
  source.subscribe(() => notifications.push(source.state()))
  source.setSessionID("root")
  await settle()
  assert.deepEqual(scheduler.pendingDelays(), [2_000])
  events.emit({ type: "message.updated", properties: { sessionID: "root" } })
  assert.deepEqual(scheduler.pendingDelays(), [2_000, 200])

  source.dispose()
  source.dispose()
  assert.deepEqual(scheduler.pendingDelays(), [])
  assert.deepEqual(events.registeredTypes(), [])
  for (const type of eventTypes) assert.equal(events.unsubscribeCount(type), 1)

  const stateAtDisposal = source.state()
  const notificationCount = notifications.length
  source.setSessionID("later")
  events.emit({ type: "tui.session.select", properties: { sessionID: "later" } })
  await settle()
  assert.deepEqual(calls, ["root"])
  assert.equal(source.state(), stateAtDisposal)
  assert.equal(notifications.length, notificationCount)
})
