import { spawnSync } from "node:child_process"
import assert from "node:assert/strict"
import { dirname, resolve } from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"

import { acquireService, defineTuiPlugin } from "../.tmp-test/plugin-runtime.mjs"

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..")

function runPluginRuntimeContractCheck() {
  return spawnSync(
    process.execPath,
    [
      resolve(rootDir, "node_modules/typescript/bin/tsc"),
      "--noEmit",
      "--ignoreConfig",
      "--pretty",
      "false",
      "--strict",
      "--target",
      "ES2022",
      "--module",
      "ESNext",
      "--moduleResolution",
      "bundler",
      "--jsx",
      "preserve",
      "--jsxImportSource",
      "@opentui/solid",
      "--types",
      "node",
      "--skipLibCheck",
      "opencode-plugin-tui.d.ts",
      "tests/plugin-runtime-contract.fixture.ts",
    ],
    { cwd: rootDir, encoding: "utf8" },
  )
}

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

test("shared ServiceFactory contract exposes disposal for object services", () => {
  const result = runPluginRuntimeContractCheck()
  assert.equal(result.status, 0, [result.stdout, result.stderr].filter(Boolean).join("\n"))
})

test("acquireService shares leases per api and disposes on final release", async () => {
  const apiA = createLifecycle().api
  const apiB = createLifecycle().api
  const key = Symbol("shared-service")
  let creations = 0
  let disposals = 0

  const factory = () => ({
    id: ++creations,
    dispose() {
      disposals += 1
    },
  })

  const first = acquireService(apiA, key, factory)
  const second = acquireService(apiA, key, factory)
  const otherApi = acquireService(apiB, key, factory)

  assert.equal(first.value, second.value)
  assert.notEqual(first.value, otherApi.value)
  assert.equal(creations, 2)

  await first.release()
  await first.release()
  assert.equal(disposals, 0)

  await second.release()
  assert.equal(disposals, 1)

  await second.release()
  assert.equal(disposals, 1)

  await otherApi.release()
  assert.equal(disposals, 2)
})

test("acquireService retries failed factory calls and replaces services during reentrant disposal", async () => {
  const api = createLifecycle().api
  const retryKey = Symbol("retry-service")
  const reentrantKey = Symbol("reentrant-service")
  let retryAttempts = 0

  assert.throws(() => acquireService(api, retryKey, () => {
    retryAttempts += 1
    throw new Error(`factory failed ${retryAttempts}`)
  }), /factory failed 1/)

  const retried = acquireService(api, retryKey, () => ({
    id: ++retryAttempts,
    dispose() {},
  }))
  assert.equal(retryAttempts, 2)
  assert.equal(retried.value.id, 2)
  await retried.release()

  let creations = 0
  let disposals = 0
  let reentrantLease
  const factory = () => {
    const id = ++creations
    return {
      id,
      dispose() {
        disposals += 1
        if (id === 1) reentrantLease = acquireService(api, reentrantKey, factory)
      },
    }
  }

  const original = acquireService(api, reentrantKey, factory)
  await original.release()

  assert.equal(disposals, 1)
  assert.equal(creations, 2)
  assert.ok(reentrantLease)
  assert.notEqual(reentrantLease.value, original.value)
  assert.equal(reentrantLease.value.id, 2)

  await reentrantLease.release()
  assert.equal(disposals, 2)
})

test("defineTuiPlugin activation context releases acquired service leases on cleanup", async () => {
  const lifecycle = createLifecycle()
  const key = Symbol("context-service")
  let creations = 0
  let disposals = 0
  let firstLeaseValue
  let secondLeaseValue

  const module = defineTuiPlugin(descriptor, async (context) => {
    const first = context.acquireService(key, () => ({
      id: ++creations,
      dispose() {
        disposals += 1
      },
    }))
    const second = context.acquireService(key, () => ({
      id: ++creations,
      dispose() {
        disposals += 1
      },
    }))
    firstLeaseValue = first.value
    secondLeaseValue = second.value
  })

  await module.tui(lifecycle.api, undefined, undefined)

  assert.equal(creations, 1)
  assert.equal(firstLeaseValue, secondLeaseValue)
  assert.equal(disposals, 0)

  await lifecycle.dispose()
  assert.equal(disposals, 1)
})

test("defineTuiPlugin activation context replaces reentrant services during cleanup", async () => {
  const lifecycle = createLifecycle()
  const key = Symbol("context-reentrant-service")
  let creations = 0
  let disposals = 0
  let firstValue
  let replacementValue

  const module = defineTuiPlugin(descriptor, async (context) => {
    const factory = () => {
      const id = ++creations
      return {
        id,
        dispose() {
          disposals += 1
          if (id === 1) replacementValue = context.acquireService(key, factory).value
        },
      }
    }

    firstValue = context.acquireService(key, factory).value
  })

  await module.tui(lifecycle.api, undefined, undefined)
  await lifecycle.dispose()

  assert.equal(creations, 2)
  assert.equal(disposals, 2)
  assert.notEqual(replacementValue, firstValue)
  assert.equal(replacementValue.id, 2)
})
