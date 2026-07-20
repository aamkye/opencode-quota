import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { existsSync, readFileSync } from "node:fs"
import test from "node:test"

test("build emits one bundled command-only session-rename plugin", () => {
  const result = spawnSync(process.execPath, ["build-session-rename.mjs"], { encoding: "utf8" })
  assert.equal(result.status, 0, result.stderr)
  assert.equal(existsSync("dist/session-rename.ts"), true)

  const artifact = readFileSync("dist/session-rename.ts", "utf8")
  assert.match(artifact, /aamkye\/session-rename/)
  assert.match(artifact, /session-rename/)
  const legacyIdentity = ["session", "title"].join("-")
  assert.equal(artifact.includes(legacyIdentity), false)
  assert.doesNotMatch(artifact, /TitleState|chat\.message|session\.idle|first message/iu)
  assert.doesNotMatch(artifact, /from\s*["']\.{1,2}\//)
  assert.doesNotMatch(artifact, /import\(\s*["']\.{1,2}\//)
})
