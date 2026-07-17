import assert from "node:assert/strict"
import test from "node:test"
import { pluginManifest, validatePluginManifest } from "../plugin-manifest.mjs"

const expected = [
  ["quota", "aamkye/opencode-tools-quota", "tui/quota.tsx", "opencode-tools-quota.js", 110, "quota"],
  ["home", "aamkye/opencode-tools-home", "tui/home.tsx", "opencode-tools-home.js", 110, "none"],
  ["token-report", "aamkye/opencode-tools-token-report", "tui/token-report.tsx", "opencode-tools-token-report.js", undefined, "none"],
  ["mcp", "aamkye/opencode-tools-mcp", "tui/mcp.tsx", "opencode-tools-mcp.js", 111, "none"],
  ["lsp", "aamkye/opencode-tools-lsp", "tui/lsp.tsx", "opencode-tools-lsp.js", 112, "none"],
]

test("manifest describes the five standalone plugins in deployment order", () => {
  assert.deepEqual(pluginManifest.map((entry) => [entry.key, entry.id, entry.source, entry.outfile, entry.slotOrder, entry.options]), expected)
  assert.doesNotThrow(() => validatePluginManifest(pluginManifest))
})

for (const field of ["key", "id", "source", "outfile"]) {
  test(`manifest rejects duplicate ${field}`, () => {
    const entries = structuredClone(pluginManifest)
    entries[1][field] = entries[0][field]
    assert.throws(() => validatePluginManifest(entries), new RegExp(`duplicate ${field}: ${entries[0][field]}`))
  })
}
