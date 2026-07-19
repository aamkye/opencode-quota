import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"
import { pluginManifest, validatePluginManifest } from "../plugin-manifest.mjs"

const expected = [
  ["home", "aamkye/opencode-tools-home", "tui/home.tsx", "opencode-tools-home.js", 1, "none"],
  ["token-report", "aamkye/opencode-tools-token-report", "tui/token-report.tsx", "opencode-tools-token-report.js", undefined, "none"],
  ["context", "aamkye/opencode-tools-context", "tui/context.tsx", "opencode-tools-context.js", 100, "none"],
  ["ses-tokens", "aamkye/opencode-tools-ses-tokens", "tui/ses-tokens.tsx", "opencode-tools-ses-tokens.js", 110, "none"],
  ["subagent", "aamkye/opencode-tools-subagent", "tui/subagent.tsx", "opencode-tools-subagent.js", 120, "none"],
  ["quota", "aamkye/opencode-tools-quota", "tui/quota.tsx", "opencode-tools-quota.js", 130, "quota"],
  ["mcp", "aamkye/opencode-tools-mcp", "tui/mcp.tsx", "opencode-tools-mcp.js", 140, "none"],
  ["lsp", "aamkye/opencode-tools-lsp", "tui/lsp.tsx", "opencode-tools-lsp.js", 150, "none"],
  ["todo", "aamkye/opencode-tools-todo", "tui/todo.tsx", "opencode-tools-todo.js", 160, "none"],
]

test("manifest describes the nine standalone plugins in deployment order", () => {
  assert.deepEqual(pluginManifest.map((entry) => [entry.key, entry.id, entry.source, entry.outfile, entry.slotOrder, entry.options]), expected)
  assert.doesNotThrow(() => validatePluginManifest(pluginManifest))
})

test("manifest assigns the exact sidebar order and keeps token-report outside the sidebar", () => {
  assert.deepEqual(
    pluginManifest
      .filter((entry) => entry.slotOrder !== undefined)
      .map((entry) => [entry.key, entry.slotOrder]),
    [["home", 1], ["context", 100], ["ses-tokens", 110], ["subagent", 120], ["quota", 130], ["mcp", 140], ["lsp", 150], ["todo", 160]],
  )
  assert.equal(pluginManifest.find((entry) => entry.key === "token-report")?.slotOrder, undefined)
})

test("package exports every standalone plugin", async () => {
  const pkg = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"))
  assert.deepEqual(pkg.exports, {
    "./home": "./tui/home.tsx",
    "./token-report": "./tui/token-report.tsx",
    "./context": "./tui/context.tsx",
    "./ses-tokens": "./tui/ses-tokens.tsx",
    "./subagent": "./tui/subagent.tsx",
    "./quota": "./tui/quota.tsx",
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
