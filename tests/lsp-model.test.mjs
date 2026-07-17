import assert from "node:assert/strict"
import test from "node:test"

const { createLspPanelModel } = await import("../.tmp-test/lsp-model.mjs")

test("maps LSP statuses in host order without mutating or exposing metadata", () => {
  const entries = Object.freeze([
    Object.freeze({ id: "typescript", name: "TypeScript", root: "/workspace/a", status: "connected" }),
    Object.freeze({ id: "yaml-ls", name: "YAML", root: "/workspace/b", status: "error" }),
    Object.freeze({ id: "future-ls", name: "Future", root: "/workspace/c", status: "starting" }),
  ])
  const before = structuredClone(entries)

  const model = createLspPanelModel(entries)

  assert.deepEqual(model, {
    rows: [
      { id: "typescript", status: "success" },
      { id: "yaml-ls", status: "error" },
      { id: "future-ls", status: "textMuted" },
    ],
    total: 3,
  })
  assert.deepEqual(entries, before)
  assert.equal(JSON.stringify(model).includes("TypeScript"), false)
  assert.equal(JSON.stringify(model).includes("/workspace"), false)
})

test("counts errors and unknown statuses and returns an empty model", () => {
  assert.equal(createLspPanelModel([
    { id: "broken", status: "error" },
    { id: "future", status: "initializing" },
  ]).total, 2)
  assert.deepEqual(createLspPanelModel([]), { rows: [], total: 0 })
})
