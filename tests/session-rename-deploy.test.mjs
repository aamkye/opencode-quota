import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { existsSync } from "node:fs"
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import test from "node:test"

async function createDeployFixture({ legacy }) {
  const fixtureHome = await mkdtemp(join(tmpdir(), "session-rename-deploy-"))
  const pluginDirectory = join(fixtureHome, ".config", "opencode", "plugins")
  const destination = join(pluginDirectory, "session-rename.ts")
  const legacyDestination = join(pluginDirectory, "session-title.ts")
  await mkdir(pluginDirectory, { recursive: true })
  if (legacy === "file") await writeFile(legacyDestination, "legacy plugin")
  if (legacy === "directory") await mkdir(legacyDestination)

  return {
    destination,
    legacyDestination,
    deploy() {
      return spawnSync(process.execPath, ["deploy-session-rename.mjs"], {
        encoding: "utf8",
        env: { ...process.env, HOME: fixtureHome },
      })
    },
    dispose() {
      return rm(fixtureHome, { recursive: true, force: true })
    },
  }
}

test("deploy installs session-rename before removing the legacy artifact", async () => {
  const fixture = await createDeployFixture({ legacy: "file" })
  try {
    const result = fixture.deploy()
    assert.equal(result.status, 0, result.stderr)
    assert.equal(await readFile(fixture.destination, "utf8"), await readFile("dist/session-rename.ts", "utf8"))
    assert.equal(existsSync(fixture.legacyDestination), false)
  } finally {
    await fixture.dispose()
  }
})

test("deploy accepts an absent legacy artifact", async () => {
  const fixture = await createDeployFixture({ legacy: "missing" })
  try {
    const result = fixture.deploy()
    assert.equal(result.status, 0, result.stderr)
    assert.equal(existsSync(fixture.destination), true)
  } finally {
    await fixture.dispose()
  }
})

test("deploy surfaces legacy cleanup errors after installing the new artifact", async () => {
  const fixture = await createDeployFixture({ legacy: "directory" })
  try {
    const result = fixture.deploy()
    assert.notEqual(result.status, 0)
    assert.equal(existsSync(fixture.destination), true)
    assert.match(result.stderr, /session-title\.ts|directory|EISDIR/iu)
  } finally {
    await fixture.dispose()
  }
})
