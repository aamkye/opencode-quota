import assert from "node:assert/strict"
import test from "node:test"

import { defineTuiPlugin } from "../.tmp-test/plugin-runtime.mjs"

const descriptor = {
  id: "aamkye/opencode-tools-test-runtime",
  key: "quota",
  options: "none",
  outfile: "dist/test-runtime.js",
  source: "tui/test-runtime.ts",
}

function createLifecycle({ aborted = false, registerThrows = false } = {}) {
  const controller = new AbortController()
  const callbacks = []
  let unregisterCount = 0

  if (aborted) controller.abort()

  return {
    api: {
      lifecycle: {
        signal: controller.signal,
        onDispose(fn) {
          if (registerThrows) {
            throw new Error("registration failed")
          }
          callbacks.push(fn)
          let active = true
          return () => {
            unregisterCount += 1
            if (!active) return
            active = false
            const index = callbacks.indexOf(fn)
            if (index >= 0) callbacks.splice(index, 1)
          }
        },
      },
    },
    count() {
      return callbacks.length
    },
    unregisterCount() {
      return unregisterCount
    },
    async dispose() {
      controller.abort()
      for (const callback of [...callbacks]) await callback()
    },
  }
}

async function rejectionOf(operation) {
  try {
    await operation()
    return { rejected: false }
  } catch (error) {
    return { rejected: true, error }
  }
}

test("defineTuiPlugin exposes the descriptor id and disposes cleanups in LIFO order once", async () => {
  const lifecycle = createLifecycle()
  const events = []
  const module = defineTuiPlugin(descriptor, async (context) => {
    context.onCleanup(() => events.push("first"))
    context.onCleanup(() => events.push("second"))
    return () => events.push("returned")
  })

  await module.tui(lifecycle.api, undefined, undefined)

  assert.equal(module.id, descriptor.id)
  assert.match(descriptor.id, /^aamkye\/opencode-tools-[^/]+$/)
  assert.equal(typeof module.tui, "function")
  assert.equal(lifecycle.count(), 1)

  await lifecycle.dispose()
  await lifecycle.dispose()

  assert.deepEqual(events, ["returned", "second", "first"])
})

test("defineTuiPlugin rolls back registered cleanups and rethrows the activation error", async () => {
  const lifecycle = createLifecycle()
  const events = []
  const module = defineTuiPlugin(descriptor, async (context) => {
    context.onCleanup(() => {
      events.push("cleanup")
      throw new Error("cleanup failed")
    })
    throw new Error("activation failed")
  })

  await assert.rejects(module.tui(lifecycle.api, undefined, undefined), /activation failed/)
  assert.deepEqual(events, ["cleanup"])
  assert.equal(lifecycle.count(), 0)
})

test("defineTuiPlugin drains async cleanups when host registration fails", async () => {
  const lifecycle = createLifecycle({ registerThrows: true })
  const events = []
  const module = defineTuiPlugin(descriptor, async (context) => {
    context.onCleanup(async () => {
      events.push("registered:start")
      await Promise.resolve()
      events.push("registered:end")
    })
    return async () => {
      events.push("returned:start")
      await Promise.resolve()
      events.push("returned:end")
    }
  })

  await assert.rejects(module.tui(lifecycle.api, undefined, undefined), /registration failed/)
  assert.equal(lifecycle.count(), 0)
  assert.equal(lifecycle.unregisterCount(), 0)
  assert.deepEqual(events, [
    "returned:start",
    "returned:end",
    "registered:start",
    "registered:end",
  ])
})

test("defineTuiPlugin drains every cleanup and throws the first cleanup failure", async () => {
  const lifecycle = createLifecycle()
  const events = []
  const module = defineTuiPlugin(descriptor, async (context) => {
    context.onCleanup(() => {
      events.push("first")
      throw new Error("first cleanup failed")
    })
    context.onCleanup(() => {
      events.push("second")
      throw new Error("second cleanup failed")
    })
  })

  await module.tui(lifecycle.api, undefined, undefined)

  await assert.rejects(lifecycle.dispose(), /second cleanup failed/)
  assert.deepEqual(events, ["second", "first"])
})

test("defineTuiPlugin unregisters and cleans immediately when the host lifecycle is already aborted", async () => {
  const lifecycle = createLifecycle({ aborted: true })
  const events = []
  const module = defineTuiPlugin(descriptor, async (context) => {
    context.onCleanup(() => events.push("registered"))
    return () => events.push("returned")
  })

  await module.tui(lifecycle.api, undefined, undefined)

  assert.equal(lifecycle.count(), 0)
  assert.equal(lifecycle.unregisterCount(), 1)
  assert.deepEqual(events, ["returned", "registered"])
})

test("defineTuiPlugin preserves undefined thrown by activation over cleanup failures", async () => {
  const lifecycle = createLifecycle()
  let cleanupCount = 0
  const module = defineTuiPlugin(descriptor, async (context) => {
    context.onCleanup(() => {
      cleanupCount += 1
      throw new Error("cleanup failed")
    })
    throw undefined
  })

  assert.deepEqual(
    await rejectionOf(() => module.tui(lifecycle.api, undefined, undefined)),
    { rejected: true, error: undefined },
  )
  assert.equal(cleanupCount, 1)
})

test("defineTuiPlugin preserves undefined thrown by host registration over cleanup failures", async () => {
  const lifecycle = createLifecycle()
  lifecycle.api.lifecycle.onDispose = () => {
    throw undefined
  }
  let cleanupCount = 0
  const module = defineTuiPlugin(descriptor, async (context) => {
    context.onCleanup(() => {
      cleanupCount += 1
      throw new Error("cleanup failed")
    })
  })

  assert.deepEqual(
    await rejectionOf(() => module.tui(lifecycle.api, undefined, undefined)),
    { rejected: true, error: undefined },
  )
  assert.equal(cleanupCount, 1)
})

test("defineTuiPlugin preserves undefined thrown by immediate cleanup and unregisters once", async () => {
  const lifecycle = createLifecycle({ aborted: true })
  const events = []
  const module = defineTuiPlugin(descriptor, async (context) => {
    context.onCleanup(() => {
      events.push("later error")
      throw new Error("later cleanup failed")
    })
    context.onCleanup(() => {
      events.push("first undefined")
      throw undefined
    })
  })

  assert.deepEqual(
    await rejectionOf(() => module.tui(lifecycle.api, undefined, undefined)),
    { rejected: true, error: undefined },
  )
  assert.equal(lifecycle.unregisterCount(), 1)
  assert.deepEqual(events, ["first undefined", "later error"])
})
