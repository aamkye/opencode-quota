import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"
import { pluginManifest, validatePluginManifest } from "../plugin-manifest.mjs"

const expected = [
  ["quota", "aamkye/opencode-tools-quota", "tui/quota.tsx", "opencode-tools-quota.js", 110, "quota"],
  ["home", "aamkye/opencode-tools-home", "tui/home.tsx", "opencode-tools-home.js", 110, "none"],
  ["token-report", "aamkye/opencode-tools-token-report", "tui/token-report.tsx", "opencode-tools-token-report.js", undefined, "none"],
  ["mcp", "aamkye/opencode-tools-mcp", "tui/mcp.tsx", "opencode-tools-mcp.js", 111, "none"],
  ["lsp", "aamkye/opencode-tools-lsp", "tui/lsp.tsx", "opencode-tools-lsp.js", 112, "none"],
  ["todo", "aamkye/opencode-tools-todo", "tui/todo.tsx", "opencode-tools-todo.js", 113, "none"],
]

test("manifest describes the six standalone plugins in deployment order", () => {
  assert.deepEqual(pluginManifest.map((entry) => [entry.key, entry.id, entry.source, entry.outfile, entry.slotOrder, entry.options]), expected)
  assert.doesNotThrow(() => validatePluginManifest(pluginManifest))
})

test("package exports every standalone plugin", async () => {
  const pkg = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"))
  assert.deepEqual(pkg.exports, {
    "./quota": "./tui/quota.tsx",
    "./home": "./tui/home.tsx",
    "./token-report": "./tui/token-report.tsx",
    "./mcp": "./tui/mcp.tsx",
    "./lsp": "./tui/lsp.tsx",
    "./todo": "./tui/todo.tsx",
  })
})

for (const field of ["key", "id", "source", "outfile"]) {
  test(`manifest rejects duplicate ${field}`, () => {
    const entries = structuredClone(pluginManifest)
    entries[1][field] = entries[0][field]
    assert.throws(() => validatePluginManifest(entries), new RegExp(`duplicate ${field}: ${entries[0][field]}`))
  })
}
