import assert from "node:assert/strict"
import test from "node:test"

import { defineTuiPlugin } from "../.tmp-test/plugin-runtime.mjs"

const descriptor = {
  id: "aamkye/opencode-tools/test-runtime",
  key: "quota",
  options: "none",
  outfile: "dist/test-runtime.js",
  source: "tui/test-runtime.ts",
}

function createLifecycle({ aborted = false } = {}) {
  const controller = new AbortController()
  const callbacks = []
  let unregisterCount = 0

  if (aborted) controller.abort()

  return {
    api: {
      lifecycle: {
        signal: controller.signal,
        onDispose(fn) {
          callbacks.push(fn)
          let active = true
          return () => {
            if (!active) return
            active = false
            unregisterCount += 1
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
