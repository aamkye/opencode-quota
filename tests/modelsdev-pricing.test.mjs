import assert from "assert/strict"
import { build } from "esbuild"
import test from "node:test"
import { writeFileSync, mkdtempSync, mkdirSync, copyFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, dirname } from "node:path"

const tmpDir = mkdtempSync(join(tmpdir(), "pricing-test-"))
mkdirSync(join(tmpDir, "data"), { recursive: true })
copyFileSync("lib/tokens/data/modelsdev-pricing.min.json", join(tmpDir, "data", "modelsdev-pricing.min.json"))
const bundlePath = join(tmpDir, "modelsdev-pricing.mjs")
const bundle = await build({
  entryPoints: ["lib/tokens/modelsdev-pricing.ts"],
  bundle: true,
  format: "esm",
  platform: "node",
  write: false,
})
writeFileSync(bundlePath, bundle.outputFiles[0].text)
const { hasProvider, hasModel, hasCost, lookupCost, listProvidersForModelId } = await import(`file://${bundlePath}`)

test("hasProvider returns true for bundled providers (anthropic, openai, google)", () => {
  assert.equal(hasProvider("anthropic"), true)
  assert.equal(hasProvider("openai"), true)
  assert.equal(hasProvider("google"), true)
})

test("hasProvider returns false for unknown providers", () => {
  assert.equal(hasProvider("nonexistent-provider"), false)
})

test("lookupCost returns cost buckets for a known model", () => {
  const cost = lookupCost("openai", "gpt-4o")
  assert.ok(cost, "gpt-4o should have a cost entry")
  // Cost buckets should have at least one finite numeric field
  const hasFinite = Object.values(cost).some((v) => typeof v === "number" && Number.isFinite(v) && v > 0)
  assert.ok(hasFinite, "at least one cost field should be a positive finite number")
})

test("lookupCost returns null for unknown model", () => {
  const cost = lookupCost("openai", "nonexistent-model-xyz")
  assert.equal(cost, null)
})

test("hasCost returns true for known provider+model and false for unknown", () => {
  assert.equal(hasCost("openai", "gpt-4o"), true)
  assert.equal(hasCost("openai", "nonexistent-model"), false)
})

test("hasModel returns true for known model and false for unknown", () => {
  assert.equal(hasModel("openai", "gpt-4o"), true)
  assert.equal(hasModel("openai", "nonexistent-model"), false)
})

test("listProvidersForModelId returns providers that have the model", () => {
  const providers = listProvidersForModelId("gpt-4o")
  assert.ok(Array.isArray(providers))
  assert.ok(providers.includes("openai"), "should include openai for gpt-4o")
})
