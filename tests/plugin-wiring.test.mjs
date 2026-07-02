import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import test from "node:test"

test("homepage quota is provided by provider plugins, not a standalone home plugin", () => {
  const pkg = JSON.parse(readFileSync("package.json", "utf8"))
  const tui = JSON.parse(readFileSync("tui.json", "utf8"))
  const tsconfig = JSON.parse(readFileSync("tsconfig.json", "utf8"))

  assert.equal(existsSync("opencode-quota-home.tsx"), false)
  assert.equal(pkg.exports["./home"], undefined)
  assert.deepEqual(tui.plugin, ["./opencode-quota-zai.tsx", "./opencode-quota-openai.tsx"])
  assert.equal(tsconfig.include.includes("opencode-quota-home.tsx"), false)
})

test("provider homepage views keep a stable initial slot node while quota loads", () => {
  const zai = readFileSync("opencode-quota-zai.tsx", "utf8")
  const openai = readFileSync("opencode-quota-openai.tsx", "utf8")

  assert.equal(/function HomeView[\s\S]*return \(\s*<Show when=\{summary\(\)\}>/.test(zai), false)
  assert.equal(/function HomeView[\s\S]*return \(\s*<Show when=\{summary\(\)\}>/.test(openai), false)
})
