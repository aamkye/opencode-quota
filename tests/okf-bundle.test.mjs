import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const agents = readFileSync("AGENTS.md", "utf8")
const summary = readFileSync("okf_bundle/SUMMARY.md", "utf8")

test("documents OKF lookup instructions", () => {
  assert.match(agents, /\.\/okf_bundle\//)
  assert.match(agents, /okf lookup <Name>/)
  assert.match(agents, /okf lookup --type <Type>/)
})

test("indexes final session rename modules", () => {
  assert.match(summary, /session-rename\.ts/)
  assert.match(summary, /lib\/session-rename/)
  assert.match(summary, /deploy-session-rename\.mjs/)
  assert.doesNotMatch(summary, /deploy-session-title\.mjs/)
})
