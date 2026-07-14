import assert from "node:assert/strict"
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { basename, join, resolve } from "node:path"
import { pathToFileURL } from "node:url"
import test, { after, before } from "node:test"

const projectRoot = resolve(import.meta.dirname, "..")
const obsoleteNamespace = ["opencode", "quota"].join("-")
const temporaryRoots = []
let deployPlugins
let resolveGlobalConfigRoot

before(async () => {
  ({ deployPlugins, resolveGlobalConfigRoot } = await import(pathToFileURL(resolve(projectRoot, "deploy-plugins.mjs"))))
})

after(async () => {
  await Promise.all(temporaryRoots.map((root) => rm(root, { recursive: true, force: true })))
})

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), "opencode-tools-deploy-"))
  temporaryRoots.push(root)
  await mkdir(join(root, "plugins"), { recursive: true })
  await writeFile(join(root, "tui.json"), JSON.stringify({
    $schema: "https://opencode.ai/tui.json",
    theme: "unchanged",
    plugin: [
      "./unrelated.js",
      "@scope/unrelated-plugin",
      `file:///tmp/${obsoleteNamespace}/custom-plugin.js`,
      "./tui/quota.tsx",
      "./tui/home.tsx",
      "@aamkye/opencode-tools/tui",
      `./${obsoleteNamespace}.js`,
      "./plugins/opencode-tools-tokens.js",
    ],
  }, null, 2))
  await writeFile(join(root, "plugins", "opencode-tools-tokens.ts"), "obsolete")
  await writeFile(join(root, "plugins", `${obsoleteNamespace}-tokens.js`), "obsolete")
  await writeFile(join(root, "plugins", "unrelated.js"), "preserve")
  return root
}

async function snapshot(root) {
  const files = [
    "opencode-tools-shared.js",
    "opencode-tools-quota.js",
    "plugins/opencode-tools-tokens.js",
    "plugins/unrelated.js",
    "tui.json",
  ]
  return Object.fromEntries(await Promise.all(files.map(async (file) => [file, await readFile(join(root, file), "utf8")])))
}

test("local deployment builds, cleans managed entries, and is idempotent", async () => {
  const root = await fixture()

  await deployPlugins(root, { logLevel: "silent" })
  const first = await snapshot(root)
  await deployPlugins(root, { logLevel: "silent" })
  const second = await snapshot(root)

  assert.deepEqual(second, first)
  assert.equal(first["plugins/unrelated.js"], "preserve")

  const config = JSON.parse(first["tui.json"])
  assert.equal(config.theme, "unchanged")
  assert.deepEqual(config.plugin, [
    "./unrelated.js",
    "@scope/unrelated-plugin",
    `file:///tmp/${obsoleteNamespace}/custom-plugin.js`,
    "./opencode-tools-quota.js",
  ])
  assert.equal(config.plugin.filter((entry) => entry === "./opencode-tools-quota.js").length, 1)
  assert.ok(config.plugin.every((entry) => !/^@aamkye\/opencode-(?:tools|quota)/.test(entry)))

  await assert.rejects(readFile(join(root, "plugins", "opencode-tools-tokens.ts"), "utf8"), { code: "ENOENT" })
  await assert.rejects(readFile(join(root, "plugins", `${obsoleteNamespace}-tokens.js`), "utf8"), { code: "ENOENT" })

  for (const [deployed, built] of [
    ["opencode-tools-shared.js", "dist/opencode-tools-shared.js"],
    ["opencode-tools-quota.js", "dist/opencode-tools-quota.js"],
    ["plugins/opencode-tools-tokens.js", "dist/plugins/opencode-tools-tokens.js"],
  ]) {
    assert.equal(first[deployed], await readFile(resolve(projectRoot, built), "utf8"))
  }
})

test("global config resolution honors XDG_CONFIG_HOME and deploys the same layout", async () => {
  const xdgRoot = await mkdtemp(join(tmpdir(), "opencode-tools-xdg-"))
  temporaryRoots.push(xdgRoot)
  const root = resolveGlobalConfigRoot({ XDG_CONFIG_HOME: xdgRoot }, "/unused-home")
  assert.equal(root, join(xdgRoot, "opencode"))

  await mkdir(root, { recursive: true })
  await writeFile(join(root, "tui.json"), JSON.stringify({ plugin: ["file:///tmp/other.js", "opencode-tools", "./tokens.ts"] }))
  await deployPlugins(root, { logLevel: "silent" })

  const config = JSON.parse(await readFile(join(root, "tui.json"), "utf8"))
  assert.deepEqual(config.plugin, ["file:///tmp/other.js", "./opencode-tools-quota.js"])
  assert.equal(basename(root), "opencode")
  assert.equal((await readFile(join(root, "plugins", "opencode-tools-tokens.js"), "utf8")).length > 0, true)
})

test("package scripts expose local and global deployment without npm plugin specs", async () => {
  const pkg = JSON.parse(await readFile(resolve(projectRoot, "package.json"), "utf8"))
  assert.equal(pkg.scripts["deploy:local"], "node deploy-plugins.mjs local")
  assert.equal(pkg.scripts["deploy:global"], "node deploy-plugins.mjs global")
  assert.doesNotMatch(JSON.stringify(pkg.scripts), /npm:(?:@aamkye\/)?opencode-(?:tools|quota)/)
})
