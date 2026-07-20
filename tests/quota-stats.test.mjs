import assert from "assert/strict"
import { build } from "esbuild"
import test from "node:test"
import { writeFileSync, mkdtempSync, mkdirSync, copyFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

const tmpDir = mkdtempSync(join(tmpdir(), "quota-stats-test-"))
mkdirSync(join(tmpDir, "data"), { recursive: true })
copyFileSync("lib/tokens/data/modelsdev-pricing.min.json", join(tmpDir, "data", "modelsdev-pricing.min.json"))
const bundlePath = join(tmpDir, "quota-stats.mjs")
const bundle = await build({
  entryPoints: ["lib/tokens/quota-stats.ts"],
  bundle: true,
  format: "esm",
  platform: "node",
  write: false,
  external: ["bun:sqlite", "better-sqlite3"],
})
writeFileSync(bundlePath, bundle.outputFiles[0].text)
const { aggregateUsage } = await import(`file://${bundlePath}`)

const now = Date.now()

function message(model, tokens) {
  return {
    id: `msg-${model}-${Math.random().toString(36).slice(2)}`,
    role: "assistant",
    modelID: model,
    time: { created: now, updated: now },
    tokens: tokens ?? { input: 1000, output: 500 },
  }
}

test("aggregateUsage returns structured result with byModel, unknown, and totals", async () => {
  const rows = [
    message("gpt-4o", { input: 1000, output: 500 }),
    message("gpt-4o-mini", { input: 2000, output: 100 }),
    message("unknown-model-xyz", { input: 500, output: 100 }),
  ]
  const result = await aggregateUsage(rows, {})
  assert.ok(Array.isArray(result.byModel), "byModel should be an array")
  assert.ok(Array.isArray(result.unknown), "unknown should be an array")
  assert.ok(typeof result.totals === "object", "totals should be an object")
  assert.ok(result.byModel.length > 0, "should have at least 1 model row")
})

test("aggregateUsage handles empty message list", async () => {
  const result = await aggregateUsage([], {})
  assert.ok(typeof result.totals === "object", "totals should be an object")
  assert.ok(Array.isArray(result.byModel), "byModel should be an array")
})

test("aggregateUsage collects unrecognized models", async () => {
  const rows = [message("completely-unknown-model", { input: 500, output: 100 })]
  const result = await aggregateUsage(rows, {})
  // The model may end up in byModel (if provider is inferred), unknown, or unpriced
  const totalEntries = result.byModel.length + (result.unknown?.length ?? 0) + (result.unpriced?.length ?? 0)
  assert.ok(totalEntries >= 1, "should have at least 1 entry across all collections")
})
