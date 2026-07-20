import assert from "assert/strict"
import { build } from "esbuild"
import test from "node:test"
import { writeFileSync, mkdtempSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

const tmpDir = mkdtempSync(join(tmpdir(), "storage-test-"))
const bundlePath = join(tmpDir, "opencode-storage.mjs")
const bundle = await build({
  entryPoints: ["lib/tokens/opencode-storage.ts"],
  bundle: true,
  format: "esm",
  platform: "node",
  write: false,
  external: ["bun:sqlite", "better-sqlite3"],
})
writeFileSync(bundlePath, bundle.outputFiles[0].text)
const { getOpenCodeDbPathCandidates, getOpenCodeDataDirCandidates, SessionNotFoundError } = await import(`file://${bundlePath}`)

test("getOpenCodeDataDirCandidates returns an array of candidate paths", () => {
  const dirs = getOpenCodeDataDirCandidates()
  assert.ok(Array.isArray(dirs))
  assert.ok(dirs.length > 0)
  for (const dir of dirs) {
    assert.equal(typeof dir, "string")
    assert.ok(dir.length > 0)
  }
})

test("getOpenCodeDbPathCandidates returns paths ending with opencode.db", () => {
  const paths = getOpenCodeDbPathCandidates()
  assert.ok(Array.isArray(paths))
  assert.ok(paths.length > 0)
  for (const p of paths) {
    assert.ok(p.endsWith("opencode.db"), `path should end with opencode.db: ${p}`)
  }
})

test("SessionNotFoundError is an Error subclass", () => {
  const err = new SessionNotFoundError("test-session", "/fake/path")
  assert.ok(err instanceof Error)
  assert.equal(err.message, "Session not found: test-session")
  assert.equal(err.sessionID, "test-session")
})
