import assert from "node:assert/strict"
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { basename, join, resolve } from "node:path"
import { pathToFileURL } from "node:url"
import test, { after, before } from "node:test"

const projectRoot = resolve(import.meta.dirname, "..")
const obsoleteNamespace = ["opencode", "quota"].join("-")
const rootOptions = {
  otherProviders: { percentageMode: "remaining", sortDirection: "asc" },
  quota: {
    opencodego: {
      workspaceId: "wrk_FALLBACK_TEST",
      workspaceToken: "TOKEN_FALLBACK_TEST_ONLY_DO_NOT_USE",
    },
  },
}
const localOptions = {
  otherProviders: { percentageMode: "used", sortDirection: "asc" },
  quota: {
    opencodego: {
      workspaceId: "wrk_TESTWORKSPACE",
      workspaceToken: "TOKEN_TEST_ONLY_DO_NOT_USE",
    },
  },
}
const globalOptions = {
  otherProviders: { percentageMode: "remaining", sortDirection: "desc" },
  quota: {
    opencodego: {
      workspaceId: "wrk_GLOBAL_TEST",
      workspaceToken: "TOKEN_GLOBAL_TEST_ONLY_DO_NOT_USE",
    },
  },
}
const tokenCommands = [
  "tokens_today",
  "tokens_daily",
  "tokens_weekly",
  "tokens_monthly",
  "tokens_all",
  "tokens_session",
  "tokens_session_all",
  "tokens_between",
]
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
      ["file:///tmp/unrelated/tui/quota.tsx", { preserve: "quota" }],
      "/tmp/unrelated/tui/home.tsx",
      "file:///tmp/unrelated/opencode-tools-quota.js",
      ["file:///tmp/unrelated/tokens.ts?version=1", { preserve: "tokens" }],
      ["./tui/quota.tsx", localOptions],
      "./tui/home.tsx",
      "@aamkye/opencode-tools/tui",
      `./${obsoleteNamespace}.js`,
      "./plugins/opencode-tools-tokens.js",
    ],
  }, null, 2))
  await writeFile(join(root, "plugins", "opencode-tools-tokens.js"), "obsolete")
  await writeFile(join(root, "plugins", "opencode-tools-tokens.ts"), "obsolete")
  await writeFile(join(root, "plugins", `${obsoleteNamespace}-tokens.js`), "obsolete")
  await writeFile(join(root, "plugins", "unrelated.js"), "preserve")
  await writeFile(join(root, "opencode.json"), JSON.stringify({
    $schema: "https://opencode.ai/config.json",
    provider: { unrelated: { enabled: true } },
    command: {
      unrelated: { description: "Preserve this command", template: "echo unrelated" },
      ...Object.fromEntries(tokenCommands.map((id) => [id, {
        description: `Managed ${id}`,
        template: "Generate the requested token usage report.",
      }])),
    },
  }, null, 2))
  return root
}

async function snapshot(root) {
  const files = [
    "opencode-tools-shared.js",
    "opencode-tools-quota.js",
    "plugins/unrelated.js",
    "tui.json",
    "opencode.json",
  ]
  return Object.fromEntries(await Promise.all(files.map(async (file) => [file, await readFile(join(root, file), "utf8")])))
}

async function managedArtifactPaths(root, relative = "") {
  const entries = await readdir(join(root, relative), { withFileTypes: true })
  const paths = await Promise.all(entries.map(async (entry) => {
    const path = relative ? `${relative}/${entry.name}` : entry.name
    return entry.isDirectory() ? managedArtifactPaths(root, path) : [path]
  }))
  return paths.flat().filter((path) => /(?:^|\/)opencode-tools-[^/]+\.(?:js|ts)$/.test(path)).sort()
}

test("local deployment removes token artifacts and commands while preserving unrelated config", async () => {
  const root = await fixture()

  await deployPlugins(root, { logLevel: "silent" })
  const first = await snapshot(root)
  await deployPlugins(root, { logLevel: "silent" })
  const second = await snapshot(root)

  assert.deepEqual(second, first)
  assert.equal(first["plugins/unrelated.js"], "preserve")

  const commands = JSON.parse(await readFile(join(root, "opencode.json"), "utf8"))
  assert.equal(commands.$schema, "https://opencode.ai/config.json")
  assert.deepEqual(commands.provider, { unrelated: { enabled: true } })
  assert.deepEqual(commands.command, {
    unrelated: { description: "Preserve this command", template: "echo unrelated" },
  })
  assert.ok(tokenCommands.every((id) => !(id in commands.command)))

  const config = JSON.parse(first["tui.json"])
  assert.equal(config.theme, "unchanged")
  assert.deepEqual(config.plugin, [
    "./unrelated.js",
    "@scope/unrelated-plugin",
    `file:///tmp/${obsoleteNamespace}/custom-plugin.js`,
    ["file:///tmp/unrelated/tui/quota.tsx", { preserve: "quota" }],
    "/tmp/unrelated/tui/home.tsx",
    "file:///tmp/unrelated/opencode-tools-quota.js",
    ["file:///tmp/unrelated/tokens.ts?version=1", { preserve: "tokens" }],
    ["./opencode-tools-quota.js", localOptions],
  ])
  assert.deepEqual(config.plugin.find((entry) => Array.isArray(entry) && entry[0] === "./opencode-tools-quota.js")[1], {
    otherProviders: { percentageMode: "used", sortDirection: "asc" },
    quota: {
      opencodego: {
        workspaceId: "wrk_TESTWORKSPACE",
        workspaceToken: "TOKEN_TEST_ONLY_DO_NOT_USE",
      },
    },
  })
  assert.equal(config.plugin.filter((entry) => (Array.isArray(entry) ? entry[0] : entry) === "./opencode-tools-quota.js").length, 1)
  assert.ok(config.plugin.every((entry) => !/^@aamkye\/opencode-(?:tools|quota)/.test(Array.isArray(entry) ? entry[0] : entry)))

  await assert.rejects(readFile(join(root, "plugins", "opencode-tools-tokens.ts"), "utf8"), { code: "ENOENT" })
  await assert.rejects(readFile(join(root, "plugins", "opencode-tools-tokens.js"), "utf8"), { code: "ENOENT" })
  await assert.rejects(readFile(join(root, "plugins", `${obsoleteNamespace}-tokens.js`), "utf8"), { code: "ENOENT" })

  for (const [deployed, built] of [
    ["opencode-tools-shared.js", "dist/opencode-tools-shared.js"],
    ["opencode-tools-quota.js", "dist/opencode-tools-quota.js"],
  ]) {
    assert.equal(first[deployed], await readFile(resolve(projectRoot, built), "utf8"))
  }
  assert.deepEqual(await managedArtifactPaths(root), [
    "opencode-tools-quota.js",
    "opencode-tools-shared.js",
  ])
})

test("deployment removes an empty managed command object", async () => {
  const root = await mkdtemp(join(tmpdir(), "opencode-tools-managed-commands-"))
  temporaryRoots.push(root)
  await writeFile(join(root, "opencode.json"), JSON.stringify({
    command: Object.fromEntries(tokenCommands.map((id) => [id, { template: `/${id}` }])),
  }))

  await deployPlugins(root, { logLevel: "silent" })

  const config = JSON.parse(await readFile(join(root, "opencode.json"), "utf8"))
  assert.equal("command" in config, false)
})

test("local deployment merges root and selected .opencode configs without duplicate managed plugins", async () => {
  const root = await mkdtemp(join(tmpdir(), "opencode-tools-project-"))
  temporaryRoots.push(root)
  const configRoot = join(root, ".opencode")
  await mkdir(configRoot, { recursive: true })

  await writeFile(join(root, "tui.json"), JSON.stringify({
    $schema: "https://opencode.ai/tui.json",
    theme: "root-theme",
    plugin: [
      "./root-unrelated.js",
      ["./tui/quota.tsx", rootOptions],
      "./tui/home.tsx",
    ],
  }, null, 2))
  await writeFile(join(configRoot, "tui.json"), JSON.stringify({
    $schema: "https://opencode.ai/tui.json",
    theme: "selected-theme",
    plugin: [
      "./selected-unrelated.js",
      "./tui/home.tsx",
    ],
  }, null, 2))

  const initialSelectedConfig = JSON.parse(await readFile(join(configRoot, "tui.json"), "utf8"))
  assert.equal(JSON.stringify(initialSelectedConfig).includes("opencodego"), false)

  await deployPlugins(configRoot, { logLevel: "silent", projectConfigRoot: root })

  const rootConfig = JSON.parse(await readFile(join(root, "tui.json"), "utf8"))
  const selectedConfig = JSON.parse(await readFile(join(configRoot, "tui.json"), "utf8"))
  assert.equal(rootConfig.theme, "root-theme")
  assert.deepEqual(rootConfig.plugin, ["./root-unrelated.js"])
  assert.equal(selectedConfig.theme, "selected-theme")
  assert.deepEqual(selectedConfig.plugin, [
    "./selected-unrelated.js",
    ["./opencode-tools-quota.js", rootOptions],
  ])
  assert.deepEqual(selectedConfig.plugin.find((entry) => Array.isArray(entry) && entry[0] === "./opencode-tools-quota.js")[1], {
    otherProviders: { percentageMode: "remaining", sortDirection: "asc" },
    quota: {
      opencodego: {
        workspaceId: "wrk_FALLBACK_TEST",
        workspaceToken: "TOKEN_FALLBACK_TEST_ONLY_DO_NOT_USE",
      },
    },
  })

  const activeManagedEntries = [
    ...rootConfig.plugin.map((entry) => ({ entry, root })),
    ...selectedConfig.plugin.map((entry) => ({ entry, root: configRoot })),
  ].filter(({ entry, root: entryRoot }) => {
    const spec = Array.isArray(entry) ? entry[0] : entry
    return resolve(entryRoot, spec) === join(configRoot, "opencode-tools-quota.js")
      || resolve(entryRoot, spec) === join(root, "tui", "quota.tsx")
      || resolve(entryRoot, spec) === join(root, "tui", "home.tsx")
  })
  assert.equal(activeManagedEntries.length, 1)
})

test("global config resolution honors XDG_CONFIG_HOME and deploys the same layout", async () => {
  const xdgRoot = await mkdtemp(join(tmpdir(), "opencode-tools-xdg-"))
  temporaryRoots.push(xdgRoot)
  const root = resolveGlobalConfigRoot({ XDG_CONFIG_HOME: xdgRoot }, "/unused-home")
  assert.equal(root, join(xdgRoot, "opencode"))

  await mkdir(root, { recursive: true })
  await writeFile(join(root, "tui.json"), JSON.stringify({
    plugin: [
      "file:///tmp/other.js",
      ["file:///tmp/unrelated/tui/quota.tsx", { preserve: "quota" }],
      "/tmp/unrelated/tui/home.tsx",
      "file:///tmp/unrelated/opencode-tools-quota.js",
      "file:///tmp/unrelated/tokens.ts",
      ["opencode-tools", globalOptions],
      "./opencode-tools-quota.js",
      "./tokens.ts",
    ],
  }))
  await deployPlugins(root, { logLevel: "silent" })
  const first = await readFile(join(root, "tui.json"), "utf8")
  await deployPlugins(root, { logLevel: "silent" })
  const second = await readFile(join(root, "tui.json"), "utf8")

  assert.equal(second, first)
  const config = JSON.parse(second)
  assert.deepEqual(config.plugin, [
    "file:///tmp/other.js",
    ["file:///tmp/unrelated/tui/quota.tsx", { preserve: "quota" }],
    "/tmp/unrelated/tui/home.tsx",
    "file:///tmp/unrelated/opencode-tools-quota.js",
    "file:///tmp/unrelated/tokens.ts",
    ["./opencode-tools-quota.js", globalOptions],
  ])
  assert.deepEqual(config.plugin.find((entry) => Array.isArray(entry) && entry[0] === "./opencode-tools-quota.js")[1], {
    otherProviders: { percentageMode: "remaining", sortDirection: "desc" },
    quota: {
      opencodego: {
        workspaceId: "wrk_GLOBAL_TEST",
        workspaceToken: "TOKEN_GLOBAL_TEST_ONLY_DO_NOT_USE",
      },
    },
  })
  assert.equal(basename(root), "opencode")
  const commands = JSON.parse(await readFile(join(root, "opencode.json"), "utf8"))
  assert.equal("command" in commands, false)
})

test("package scripts expose local and global deployment without npm plugin specs", async () => {
  const pkg = JSON.parse(await readFile(resolve(projectRoot, "package.json"), "utf8"))
  assert.equal(pkg.scripts["deploy:local"], "node deploy-plugins.mjs local")
  assert.equal(pkg.scripts["deploy:global"], "node deploy-plugins.mjs global")
  assert.doesNotMatch(JSON.stringify(pkg.scripts), /npm:(?:@aamkye\/)?opencode-(?:tools|quota)/)
})
