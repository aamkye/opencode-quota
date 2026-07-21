import assert from "node:assert/strict"
import test from "node:test"

const { createMcpPanelModel } = await import("../.tmp-test/mcp-model.mjs")

test("maps every MCP status in host order without exposing runtime errors", () => {
  const errorStrings = [
    "connected runtime detail",
    "disabled runtime detail",
    "failed runtime detail",
    "auth runtime detail",
    "client runtime detail",
    "future runtime detail",
  ]
  const model = createMcpPanelModel([
    { name: "connected", status: "connected", error: errorStrings[0] },
    { name: "disabled", status: "disabled", error: errorStrings[1] },
    { name: "failed", status: "failed", error: errorStrings[2] },
    { name: "auth", status: "needs_auth", error: errorStrings[3] },
    { name: "client", status: "needs_client_registration", error: errorStrings[4] },
    { name: "future", status: "future_status", error: errorStrings[5] },
  ])

  assert.deepEqual(model.rows, [
    { name: "connected", label: "Connected", status: "success" },
    { name: "disabled", label: "Disabled", status: "textMuted" },
    { name: "failed", label: "Failed", status: "error" },
    { name: "auth", label: "Needs auth", status: "error" },
    { name: "client", label: "Needs client ID", status: "error" },
    { name: "future", label: "Unknown", status: "textMuted" },
  ])
  assert.equal(model.connected, 1)
  assert.equal(model.warning, 1)
  assert.equal(model.error, 4)
  assert.equal(model.total, 6)
  const serialized = JSON.stringify(model)
  for (const errorString of errorStrings) assert.equal(serialized.includes(errorString), false)
})

test("segments roll up success, warning, and error counts with unconditional bucket colors", () => {
  const fullyConnected = createMcpPanelModel([
    { name: "one", status: "connected" },
    { name: "two", status: "connected" },
  ])
  assert.equal(fullyConnected.connected, 2)
  assert.equal(fullyConnected.warning, 0)
  assert.equal(fullyConnected.error, 0)
  assert.equal(fullyConnected.total, 2)
  assert.deepEqual(fullyConnected.summary, [
    { text: "2", status: "success" },
    { text: "/", status: "textMuted" },
    { text: "0", status: "warning" },
    { text: "/", status: "textMuted" },
    { text: "0", status: "error" },
  ])

  const partiallyConnected = createMcpPanelModel([
    { name: "one", status: "connected" },
    { name: "two", status: "connected" },
    { name: "three", status: "disabled" },
  ])
  assert.equal(partiallyConnected.connected, 2)
  assert.equal(partiallyConnected.warning, 1)
  assert.equal(partiallyConnected.error, 0)
  assert.equal(partiallyConnected.total, 3)
  assert.deepEqual(partiallyConnected.summary, [
    { text: "2", status: "success" },
    { text: "/", status: "textMuted" },
    { text: "1", status: "warning" },
    { text: "/", status: "textMuted" },
    { text: "0", status: "error" },
  ])

  const empty = createMcpPanelModel([])
  assert.equal(empty.connected, 0)
  assert.equal(empty.warning, 0)
  assert.equal(empty.error, 0)
  assert.equal(empty.total, 0)
  assert.deepEqual(empty.summary, [
    { text: "0", status: "success" },
    { text: "/", status: "textMuted" },
    { text: "0", status: "warning" },
    { text: "/", status: "textMuted" },
    { text: "0", status: "error" },
  ])
})

test("rolls mixed statuses into a 1/1/4 summary while preserving expanded-row colors", () => {
  const model = createMcpPanelModel([
    { name: "alpha", status: "connected" },
    { name: "beta", status: "disabled" },
    { name: "gamma", status: "failed" },
    { name: "delta", status: "needs_auth" },
    { name: "epsilon", status: "needs_client_registration" },
    { name: "zeta", status: "future_status" },
  ])

  assert.equal(model.connected, 1)
  assert.equal(model.warning, 1)
  assert.equal(model.error, 4)
  assert.equal(model.total, 6)
  assert.deepEqual(model.summary, [
    { text: "1", status: "success" },
    { text: "/", status: "textMuted" },
    { text: "1", status: "warning" },
    { text: "/", status: "textMuted" },
    { text: "4", status: "error" },
  ])
  assert.deepEqual(
    model.rows.map((row) => [row.name, row.label, row.status]),
    [
      ["alpha", "Connected", "success"],
      ["beta", "Disabled", "textMuted"],
      ["gamma", "Failed", "error"],
      ["delta", "Needs auth", "error"],
      ["epsilon", "Needs client ID", "error"],
      ["zeta", "Unknown", "textMuted"],
    ],
  )
})
