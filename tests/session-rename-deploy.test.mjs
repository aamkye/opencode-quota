import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { pathToFileURL } from "node:url"
import test, { before, after } from "node:test"

const projectRoot = resolve(import.meta.dirname, "..")
const temporaryRoots = []
let deployPlugins

before(async () => {
  ({ deployPlugins } = await import(pathToFileURL(resolve(projectRoot, "deploy-plugins.mjs")).href))
})

after(async () => {
  await Promise.all(temporaryRoots.map((root) => rm(root, { recursive: true, force: true })))
})

async function createDeployFixture({ legacy }) {
  const root = await mkdtemp(join(tmpdir(), "session-rename-deploy-"))
  temporaryRoots.push(root)
  const pluginDirectory = join(root, "plugins")
  const destination = join(pluginDirectory, "session-rename.ts")
  const legacyDestination = join(pluginDirectory, "session-title.ts")
  await mkdir(pluginDirectory, { recursive: true })
  if (legacy === "file") await writeFile(legacyDestination, "legacy plugin")
  if (legacy === "directory") await mkdir(legacyDestination)
  return { root, destination, legacyDestination }
}

test("deploy installs session-rename before removing the legacy artifact", async () => {
  const fixture = await createDeployFixture({ legacy: "file" })
  try {
    await deployPlugins(fixture.root, { logLevel: "silent" })
    assert.equal(await readFile(fixture.destination, "utf8"), await readFile("dist/session-rename.ts", "utf8"))
    assert.equal(existsSync(fixture.legacyDestination), false)
  } finally {
    await rm(fixture.root, { recursive: true, force: true })
  }
})

test("deploy accepts an absent legacy artifact", async () => {
  const fixture = await createDeployFixture({ legacy: "missing" })
  try {
    await deployPlugins(fixture.root, { logLevel: "silent" })
    assert.equal(existsSync(fixture.destination), true)
  } finally {
    await rm(fixture.root, { recursive: true, force: true })
  }
})
