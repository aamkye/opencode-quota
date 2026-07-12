import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { existsSync, readFileSync } from "node:fs"
import test from "node:test"

test("build emits one bundled global session-title plugin", () => {
  const result = spawnSync(process.execPath, ["build-session-title.mjs"], { encoding: "utf8" })

  assert.equal(result.status, 0, result.stderr)
  assert.equal(existsSync("dist/session-title.ts"), true)

  const artifact = readFileSync("dist/session-title.ts", "utf8")
  assert.match(artifact, /aamkye\/session-title/)
  assert.doesNotMatch(artifact, /from\s*["']\.{1,2}\//)
  assert.doesNotMatch(artifact, /import\(\s*["']\.{1,2}\//)
})
