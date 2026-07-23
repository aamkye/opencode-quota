import assert from "node:assert/strict"
import test from "node:test"

const { createLspPanelModel } = await import("../.tmp-test/lsp-model.mjs")

test("maps LSP statuses in host order with the root basename, without leaking the full path or name", () => {
  const entries = Object.freeze([
    Object.freeze({ id: "typescript", name: "TypeScript", root: "/workspace/a", status: "connected" }),
    Object.freeze({ id: "yaml-ls", name: "YAML", root: "/workspace/b", status: "error" }),
    Object.freeze({ id: "future-ls", name: "Future", root: "/workspace/c", status: "starting" }),
  ])
  const before = structuredClone(entries)

  const model = createLspPanelModel(entries)

  assert.deepEqual(model, {
    rows: [
      { id: "typescript", label: "a", status: "success" },
      { id: "yaml-ls", label: "b", status: "error" },
      { id: "future-ls", label: "c", status: "textMuted" },
    ],
    total: 3,
  })
  assert.deepEqual(entries, before)
  assert.equal(JSON.stringify(model).includes("TypeScript"), false)
  assert.equal(JSON.stringify(model).includes("/workspace"), false)
})

test("derives the basename from the root and trims trailing separators", () => {
  const model = createLspPanelModel([
    { id: "one", name: "One", root: "/Users/aam/Projects/priv/opencode-tools", status: "connected" },
    { id: "two", name: "Two", root: "/srv/app/", status: "connected" },
    { id: "three", name: "Three", root: "relative-dir", status: "connected" },
  ])
  assert.deepEqual(model.rows.map((row) => row.label), ["opencode-tools", "app", "relative-dir"])
})

test("uses an empty label for missing, empty, or root-only paths", () => {
  const model = createLspPanelModel([
    { id: "broken", name: "Broken", status: "error" },
    { id: "empty", name: "Empty", root: "", status: "error" },
    { id: "root", name: "Root", root: "/", status: "error" },
  ])
  assert.deepEqual(model.rows.map((row) => row.label), ["", "", ""])
  assert.equal(model.total, 3)
})

test("returns an empty model", () => {
  assert.deepEqual(createLspPanelModel([]), { rows: [], total: 0 })
})
