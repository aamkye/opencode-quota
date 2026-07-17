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
    { name: "auth", label: "Needs auth", status: "warning" },
    { name: "client", label: "Needs client ID", status: "error" },
    { name: "future", label: "Unknown", status: "textMuted" },
  ])
  assert.equal(model.connected, 1)
  assert.equal(model.total, 6)
  const serialized = JSON.stringify(model)
  for (const errorString of errorStrings) assert.equal(serialized.includes(errorString), false)
})

test("segments connected and total counts for healthy, unhealthy, and empty summaries", () => {
  const fullyConnected = createMcpPanelModel([
    { name: "one", status: "connected" },
    { name: "two", status: "connected" },
  ])
  assert.equal(fullyConnected.connected, 2)
  assert.equal(fullyConnected.total, 2)
  assert.deepEqual(fullyConnected.summary, [
    { text: "2", status: "success" },
    { text: "/", status: "textMuted" },
    { text: "2", status: "success" },
  ])

  const partiallyConnected = createMcpPanelModel([
    { name: "one", status: "connected" },
    { name: "two", status: "connected" },
    { name: "three", status: "CONNECTED" },
  ])
  assert.equal(partiallyConnected.connected, 2)
  assert.equal(partiallyConnected.total, 3)
  assert.deepEqual(partiallyConnected.summary, [
    { text: "2", status: "success" },
    { text: "/", status: "textMuted" },
    { text: "3", status: "error" },
  ])

  const empty = createMcpPanelModel([])
  assert.equal(empty.connected, 0)
  assert.equal(empty.total, 0)
  assert.deepEqual(empty.summary, [
    { text: "0", status: "textMuted" },
    { text: "/", status: "textMuted" },
    { text: "0", status: "textMuted" },
  ])
})
