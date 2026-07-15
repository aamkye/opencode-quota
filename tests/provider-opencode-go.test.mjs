import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const providerModule = await import("../.tmp-test/provider-opencode-go.mjs")
const { normalizeOpenCodeGoConfig } = providerModule
const sentinel = {
  workspaceId: "wrk_TESTWORKSPACE",
  workspaceToken: "TOKEN_TEST_ONLY_DO_NOT_USE",
}

test("OpenCode Go options normalize valid credentials without diagnostics", () => {
  const diagnostics = []
  const original = console.error
  console.error = (...args) => diagnostics.push(args)
  try {
    const config = normalizeOpenCodeGoConfig({
      workspaceId: ` ${sentinel.workspaceId} `,
      workspaceToken: ` ${sentinel.workspaceToken} `,
    })
    assert.deepEqual(config, sentinel)
    assert.equal(Object.isFrozen(config), true)
    assert.deepEqual(Object.keys(config), ["workspaceId", "workspaceToken"])
    assert.deepEqual(diagnostics, [])
  } finally {
    console.error = original
  }
})

test("OpenCode Go options reject invalid credentials without secret-derived output", () => {
  const diagnostics = []
  const errors = []
  const original = console.error
  console.error = (...args) => diagnostics.push(args)
  try {
    for (const value of [
      undefined,
      null,
      [],
      {},
      { workspaceId: "workspace", workspaceToken: sentinel.workspaceToken },
      { workspaceId: sentinel.workspaceId, workspaceToken: "" },
      { workspaceId: sentinel.workspaceId, workspaceToken: "   " },
      { workspaceId: sentinel.workspaceId, workspaceToken: "x\rX-Test: leaked" },
      { workspaceId: sentinel.workspaceId, workspaceToken: "x\nX-Test: leaked" },
    ]) {
      try {
        assert.equal(normalizeOpenCodeGoConfig(value), null)
      } catch (error) {
        errors.push(error instanceof Error ? error.message : String(error))
      }
    }
  } finally {
    console.error = original
  }
  const serialized = JSON.stringify({ diagnostics, errors })
  assert.deepEqual(errors, [])
  for (const secret of Object.values(sentinel)) assert.equal(serialized.includes(secret), false)
})

test("OpenCode Go options expose no redirectable transport control", () => {
  const source = readFileSync("tui/providers/opencode-go.ts", "utf8")
  for (const forbidden of ["origin?:", "url?:", "headers?:", "cookie?:"]) {
    assert.equal(source.includes(forbidden), false)
  }
})
